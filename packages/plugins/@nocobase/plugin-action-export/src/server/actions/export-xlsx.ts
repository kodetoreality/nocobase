/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { Repository } from '@nocobase/database';

import XlsxExporter from '../xlsx-exporter';
import XLSX from 'xlsx';

export async function exportXlsx(ctx: Context, next: Next) {
  const { title, filter, sort, fields, except } = ctx.action.params;
  let columns = ctx.action.params.values?.columns || ctx.action.params?.columns;

  if (typeof columns === 'string') {
    columns = JSON.parse(columns);
  }

  const repository = ctx.getCurrentRepository() as Repository;

  const collection = repository.collection;

  const xlsxExporter = new XlsxExporter({
    collection,
    columns,
    findOptions: {
      filter,
      fields,
      except,
      sort,
    },
  });

  const wb = await xlsxExporter.run();

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  ctx.body = buffer;

  ctx.set({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename=${encodeURI(title)}.xlsx`,
  });

  await next();
}
