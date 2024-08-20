/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database, mockDatabase } from '@nocobase/database';

describe('datetime no tz field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      timezone: '+08:00',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should set datetime no tz field', async () => {
    db.collection({
      name: 'tests',
      fields: [{ name: 'date1', type: 'datetimeNoTz' }],
    });

    await db.sync();

    const item = await db.getRepository('tests').create({
      values: {
        date1: '2023-03-24 12:00:00',
      },
    });

    expect(item.get('date1')).toBe('2023-03-24 12:00:00');
  });
});