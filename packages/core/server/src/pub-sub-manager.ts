/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import _ from 'lodash';
import Application from './application';

export interface PubSubManagerCallbackOptions {
  skipSelf?: boolean;
  debounce?: number;
}

export class PubSubManager {
  adapter: IPubSubAdapter;
  subscribes = new Map();
  publisherId: string;

  constructor(
    protected app: Application,
    protected options: any = {},
  ) {
    this.publisherId = uid();
    app.on('afterStart', async () => {
      await this.connect();
    });
    app.on('afterStop', async () => {
      await this.close();
    });
    app.on('beforeLoadPlugin', async (plugin) => {
      if (!plugin.name) {
        return;
      }
      await this.subscribe(plugin.name, plugin.onMessage.bind(plugin), { debounce: 1000 });
    });
  }

  get prefix() {
    return this.options.name || this.app.name;
  }

  setAdapter(adapter: IPubSubAdapter) {
    this.adapter = adapter;
  }

  async connect() {
    if (!this.adapter) {
      return;
    }
    await this.adapter.connect();
    // subscribe 要在 connect 之后
    for (const [channel, callbacks] of this.subscribes) {
      for (const [, fn] of callbacks) {
        await this.adapter.subscribe(`${this.prefix}.${channel}`, fn);
      }
    }
  }

  async close() {
    if (!this.adapter) {
      return;
    }
    return await this.adapter.close();
  }

  async subscribe(channel: string, callback, options: PubSubManagerCallbackOptions = {}) {
    const { skipSelf = true, debounce = 0 } = options;
    const fn = (wrappedMessage) => {
      const { publisherId, message } = JSON.parse(wrappedMessage);
      if (skipSelf && publisherId === this.publisherId) {
        return;
      }
      callback(message);
    };
    const debounceCallback = debounce ? _.debounce(fn, debounce) : fn;
    if (!this.subscribes.has(channel)) {
      const map = new Map();
      this.subscribes.set(channel, map);
    }
    const map = this.subscribes.get(channel);
    map.set(callback, debounceCallback);
  }

  async unsubscribe(channel, callback) {
    const map: Map<any, any> = this.subscribes.get(channel);
    let fn = null;
    if (map) {
      fn = map.get(callback);
    }
    if (!this.adapter || !fn) {
      return;
    }
    return this.adapter.unsubscribe(`${this.prefix}.${channel}`, fn);
  }

  async publish(channel, message) {
    if (!this.adapter) {
      return;
    }

    const wrappedMessage = JSON.stringify({
      publisherId: this.publisherId,
      message: message,
    });

    return this.adapter.publish(`${this.prefix}.${channel}`, wrappedMessage);
  }

  onMessage(callback, options: PubSubManagerCallbackOptions = {}) {
    if (!this.adapter) {
      return;
    }
    const { skipSelf = true, debounce = 0 } = options;
    const debounceCallback = debounce
      ? _.debounce((channel, message) => {
          callback(channel, message);
        }, debounce)
      : callback;
    return this.adapter.onMessage((channel: string, wrappedMessage) => {
      if (!channel.startsWith(`${this.prefix}.`)) {
        return;
      }
      const { publisherId, message } = JSON.parse(wrappedMessage);
      if (skipSelf && publisherId === this.publisherId) {
        return;
      }
      debounceCallback(channel, message);
    });
  }
}

export interface IPubSubAdapter {
  connect(): Promise<any>;
  close(): Promise<any>;
  subscribe(channel: string, callback): Promise<any>;
  unsubscribe(channel: string, callback): Promise<any>;
  publish(channel: string, message): Promise<any>;
  onMessage(callback): void;
}