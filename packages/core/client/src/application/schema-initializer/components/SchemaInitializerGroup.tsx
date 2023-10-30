import React, { FC } from 'react';
import { useCompile } from '../../../schema-component';
import { SchemaInitializerChildren } from './SchemaInitializerChildren';
import { SchemaInitializerDivider } from './SchemaInitializerDivider';
import { SchemaInitializerOptions } from '../types';
import { useStyles } from './style';
import { useSchemaInitializerItem } from '../context';

export interface SchemaInitializerGroupProps {
  title: string;
  children?: SchemaInitializerOptions['items'];
  divider?: boolean;
}

export const SchemaInitializerGroup = () => {
  const { children, title, divider } = useSchemaInitializerItem<SchemaInitializerGroupProps>();
  const compile = useCompile();
  const { componentCls } = useStyles();
  return (
    <div>
      {divider && <SchemaInitializerDivider />}
      <div className={`${componentCls}-group-title`}>{compile(title)}</div>
      <SchemaInitializerChildren>{children}</SchemaInitializerChildren>
    </div>
  );
};