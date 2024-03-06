import { Schema, useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { createDesignable, useSchemaComponentChangelessContext } from '../..';
import { useAPIClient } from '../../../api-client';
import { useBlockRequestContext } from '../../../block-provider';
import { mergeFilter } from '../../../filter-provider/utils';
import { ActionInitializer } from '../../../schema-initializer/items/ActionInitializer';

export const ActionBarAssociationFilterAction = (props) => {
  const { refresh } = useSchemaComponentChangelessContext();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { t } = useTranslation();
  const dn = createDesignable({ t, api, refresh, current: fieldSchema });
  const { service, props: blockProps } = useBlockRequestContext();

  dn.loadAPIClientEvents();

  const handleInsert = (s: Schema) => {
    dn.insertBeforeBegin(s);
  };

  const handleRemove = (schema, remove) => {
    remove(schema);
    service.run({
      ...service.params?.[0],
      filter: mergeFilter([blockProps?.params?.filter]),
    });
  };

  const schema = {
    type: 'void',
    'x-action': 'associateFilter',
    'x-initializer': 'AssociationFilter.Initializer',
    'x-component': 'AssociationFilter',
    properties: {},
  };

  const newProps = {
    ...props,
    insert: handleInsert,
    remove: handleRemove,
    wrap: (s) => s,
  };

  return <ActionInitializer {...newProps} schema={schema} />;
};
