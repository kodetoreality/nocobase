import React from 'react';
import { useFieldSchema } from '@formily/react';
import { createDesignable, useSchemaComponentChangelessContext } from '../..';
import { useAPIClient } from '../../../api-client';
import { useTranslation } from 'react-i18next';
import { SchemaInitializerItem, useSchemaInitializerItem } from '../../../application';

export const AssociationFilterDesignerDelete = () => {
  const itemConfig = useSchemaInitializerItem();
  const { refresh } = useSchemaComponentChangelessContext();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { t } = useTranslation();
  const dn = createDesignable({ t, api, refresh, current: fieldSchema });
  dn.loadAPIClientEvents();

  const handleClick = () => {
    dn.remove(fieldSchema);
  };

  return (
    <SchemaInitializerItem onClick={handleClick}>
      <div>{itemConfig.title}</div>
    </SchemaInitializerItem>
  );
};
