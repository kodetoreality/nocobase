/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getDefaultFormat, str2moment, toGmt, toLocal } from '@nocobase/utils/client';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const toStringByPicker = (value, picker, timezone: 'gmt' | 'local') => {
  if (!dayjs.isDayjs(value)) return value;
  if (timezone === 'local') {
    const offset = new Date().getTimezoneOffset();
    return dayjs(toStringByPicker(value, picker, 'gmt'))
      .add(offset, 'minutes')
      .toISOString();
  }

  if (picker === 'year') {
    return value.format('YYYY') + '-01-01T00:00:00.000Z';
  }
  if (picker === 'month') {
    return value.format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'quarter') {
    return value.startOf('quarter').format('YYYY-MM') + '-01T00:00:00.000Z';
  }
  if (picker === 'week') {
    return value.startOf('week').add(1, 'day').format('YYYY-MM-DD') + 'T00:00:00.000Z';
  }
  return value.format('YYYY-MM-DDTHH:mm:ss.SSS') + 'Z';
};

const toGmtByPicker = (value: Dayjs, picker?: any) => {
  if (!value || !dayjs.isDayjs(value)) {
    return value;
  }
  return toStringByPicker(value, picker, 'gmt');
};

const toLocalByPicker = (value: Dayjs, picker?: any) => {
  if (!value || !dayjs.isDayjs(value)) {
    return value;
  }
  return toStringByPicker(value, picker, 'local');
};

export interface Moment2strOptions {
  showTime?: boolean;
  gmt?: boolean;
  utc?: boolean;
  picker?: 'year' | 'month' | 'week' | 'quarter';
}

export const moment2str = (value?: Dayjs | null, options: Moment2strOptions = {}) => {
  const { showTime, gmt, picker, utc = true } = options;
  if (!value) {
    return value;
  }
  if (!utc) {
    const format = showTime ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
    return value.format(format);
  }
  if (showTime) {
    return gmt ? toGmt(value) : toLocal(value);
  }
  if (typeof gmt === 'boolean') {
    return gmt ? toGmtByPicker(value, picker) : toLocalByPicker(value, picker);
  }
  return toLocalByPicker(value, picker);
};

export const mapDatePicker = function () {
  return (props: any) => {
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;
    return {
      ...props,
      format: format,
      value: str2moment(props.value, props),
      onChange: (value: Dayjs | null, dateString) => {
        if (onChange) {
          if (!props.showTime && value) {
            value = value.startOf('day');
          }
          if (props.dateOnly) {
            onChange(dateString);
          } else {
            onChange(moment2str(value, props));
          }
        }
      },
    };
  };
};

export const mapRangePicker = function () {
  return (props: any) => {
    const format = getDefaultFormat(props) as any;
    const onChange = props.onChange;

    return {
      ...props,
      format: format,
      value: str2moment(props.value, props),
      onChange: (value: Dayjs[]) => {
        if (onChange) {
          onChange(
            value
              ? [moment2str(getRangeStart(value[0], props), props), moment2str(getRangeEnd(value[1], props), props)]
              : [],
          );
        }
      },
    } as any;
  };
};

function getRangeStart(value: Dayjs, options: Moment2strOptions) {
  const { showTime } = options;
  if (showTime) {
    return value;
  }
  return value.startOf('day');
}

function getRangeEnd(value: Dayjs, options: Moment2strOptions) {
  const { showTime } = options;
  if (showTime) {
    return value;
  }
  return value.endOf('day');
}

const getStart = (offset: any, unit: any) => {
  return dayjs()
    .add(offset, unit === 'isoWeek' ? 'week' : unit)
    .startOf(unit);
};

const getEnd = (offset: any, unit: any) => {
  return dayjs()
    .add(offset, unit === 'isoWeek' ? 'week' : unit)
    .endOf(unit);
};

export const getDateRanges = (props?: {
  /** 日期是否是 UTC 格式 */
  utc?: boolean;
  /** 如果为 true 则返回的值是一个字符串 */
  shouldBeString?: boolean;
}) => {
  if (props?.shouldBeString) {
    const toString = (date) => {
      if (Array.isArray(date)) {
        return date.map((d) => moment2str(d, { utc: props?.utc }));
      }
      return moment2str(date, { utc: props?.utc });
    };
    return {
      now: () => toString(dayjs()),
      today: () => toString([getStart(0, 'day'), getEnd(0, 'day')]),
      yesterday: () => toString([getStart(-1, 'day'), getEnd(-1, 'day')]),
      tomorrow: () => toString([getStart(1, 'day'), getEnd(1, 'day')]),
      thisWeek: () => toString([getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')]),
      lastWeek: () => toString([getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')]),
      nextWeek: () => toString([getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')]),
      thisIsoWeek: () => toString([getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')]),
      lastIsoWeek: () => toString([getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')]),
      nextIsoWeek: () => toString([getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')]),
      thisMonth: () => toString([getStart(0, 'month'), getEnd(0, 'month')]),
      lastMonth: () => toString([getStart(-1, 'month'), getEnd(-1, 'month')]),
      nextMonth: () => toString([getStart(1, 'month'), getEnd(1, 'month')]),
      thisQuarter: () => toString([getStart(0, 'quarter'), getEnd(0, 'quarter')]),
      lastQuarter: () => toString([getStart(-1, 'quarter'), getEnd(-1, 'quarter')]),
      nextQuarter: () => toString([getStart(1, 'quarter'), getEnd(1, 'quarter')]),
      thisYear: () => toString([getStart(0, 'year'), getEnd(0, 'year')]),
      lastYear: () => toString([getStart(-1, 'year'), getEnd(-1, 'year')]),
      nextYear: () => toString([getStart(1, 'year'), getEnd(1, 'year')]),
      last7Days: () => toString([getStart(-6, 'days'), getEnd(0, 'days')]),
      next7Days: () => toString([getStart(1, 'day'), getEnd(7, 'days')]),
      last30Days: () => toString([getStart(-29, 'days'), getEnd(0, 'days')]),
      next30Days: () => toString([getStart(1, 'day'), getEnd(30, 'days')]),
      last90Days: () => toString([getStart(-89, 'days'), getEnd(0, 'days')]),
      next90Days: () => toString([getStart(1, 'day'), getEnd(90, 'days')]),
    };
  }

  return {
    now: () => dayjs().toISOString(),
    today: () => [getStart(0, 'day'), getEnd(0, 'day')],
    yesterday: () => [getStart(-1, 'day'), getEnd(-1, 'day')],
    tomorrow: () => [getStart(1, 'day'), getEnd(1, 'day')],
    thisWeek: () => [getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')],
    lastWeek: () => [getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')],
    nextWeek: () => [getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')],
    thisIsoWeek: () => [getStart(0, 'isoWeek'), getEnd(0, 'isoWeek')],
    lastIsoWeek: () => [getStart(-1, 'isoWeek'), getEnd(-1, 'isoWeek')],
    nextIsoWeek: () => [getStart(1, 'isoWeek'), getEnd(1, 'isoWeek')],
    thisMonth: () => [getStart(0, 'month'), getEnd(0, 'month')],
    lastMonth: () => [getStart(-1, 'month'), getEnd(-1, 'month')],
    nextMonth: () => [getStart(1, 'month'), getEnd(1, 'month')],
    thisQuarter: () => [getStart(0, 'quarter'), getEnd(0, 'quarter')],
    lastQuarter: () => [getStart(-1, 'quarter'), getEnd(-1, 'quarter')],
    nextQuarter: () => [getStart(1, 'quarter'), getEnd(1, 'quarter')],
    thisYear: () => [getStart(0, 'year'), getEnd(0, 'year')],
    lastYear: () => [getStart(-1, 'year'), getEnd(-1, 'year')],
    nextYear: () => [getStart(1, 'year'), getEnd(1, 'year')],
    last7Days: () => [getStart(-6, 'days'), getEnd(0, 'days')],
    next7Days: () => [getStart(1, 'day'), getEnd(7, 'days')],
    last30Days: () => [getStart(-29, 'days'), getEnd(0, 'days')],
    next30Days: () => [getStart(1, 'day'), getEnd(30, 'days')],
    last90Days: () => [getStart(-89, 'days'), getEnd(0, 'days')],
    next90Days: () => [getStart(1, 'day'), getEnd(90, 'days')],
  };
};
