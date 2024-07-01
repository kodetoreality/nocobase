/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import _ from 'lodash';
import { FC, default as React, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Location, useLocation } from 'react-router-dom';
import { useAPIClient } from '../../../api-client';
import { DataBlockProvider } from '../../../data-source/data-block/DataBlockProvider';
import { BlockRequestContext } from '../../../data-source/data-block/DataBlockRequestProvider';
import { SchemaComponent } from '../../core';
import { TabsContextProvider } from '../tabs/context';
import { usePopupSettings } from './PopupSettingsProvider';
import { deleteRandomNestedSchemaKey, getRandomNestedSchemaKey } from './nestedSchemaKeyStorage';
import { PopupParams, getPopupParamsFromPath, getStoredPopupContext, usePagePopup } from './pagePopupUtils';
import {
  PopupContext,
  getPopupContextFromActionOrAssociationFieldSchema,
} from './usePopupContextInActionOrAssociationField';

interface PopupsVisibleProviderProps {
  visible: boolean;
  setVisible?: (value: boolean) => void;
}

interface PopupProps {
  params: PopupParams;
  context: PopupContext;
}

export const PopupVisibleProviderContext = React.createContext<PopupsVisibleProviderProps>(null);
export const PopupParamsProviderContext = React.createContext<PopupProps>(null);
PopupVisibleProviderContext.displayName = 'PopupVisibleProviderContext';
PopupParamsProviderContext.displayName = 'PopupParamsProviderContext';

export const usePopupContextAndParams = () => {
  const context = React.useContext(PopupParamsProviderContext);
  return (context || {}) as PopupProps;
};

/**
 * The difference between this component and ActionContextProvider is that
 * this component is only used to control the popups in the PagePopupsItem component (excluding the nested popups within it).
 * @param param0
 * @returns
 */
export const PopupVisibleProvider: FC<PopupsVisibleProviderProps> = ({ children, visible, setVisible }) => {
  return (
    <PopupVisibleProviderContext.Provider value={{ visible, setVisible }}>
      {children}
    </PopupVisibleProviderContext.Provider>
  );
};

const PopupParamsProvider: FC<PopupProps> = (props) => {
  const value = useMemo(() => {
    return { params: props.params, context: props.context };
  }, [props.params, props.context]);
  return <PopupParamsProviderContext.Provider value={value}>{props.children}</PopupParamsProviderContext.Provider>;
};

const PopupTabsPropsProvider: FC<{ params: PopupParams }> = ({ children, params }) => {
  const { changeTab } = usePagePopup();
  const onTabClick = useCallback(
    (key: string) => {
      changeTab(key);
    },
    [changeTab],
  );
  const { isPopupVisibleControlledByURL } = usePopupSettings();

  if (!isPopupVisibleControlledByURL) {
    return <>{children}</>;
  }

  return (
    <TabsContextProvider activeKey={params.tab} onTabClick={onTabClick}>
      {children}
    </TabsContextProvider>
  );
};

const PagePopupsItemProvider: FC<{ params: PopupParams; context: PopupContext }> = ({ params, context, children }) => {
  const { closePopup } = usePagePopup();
  const [visible, _setVisible] = useState(true);
  const setVisible = (visible: boolean) => {
    if (!visible) {
      _setVisible(false);

      if (process.env.__E2E__) {
        setTimeout(() => {
          closePopup();
          // Deleting here ensures that the next time the same popup is opened, it will generate another random key.
          deleteRandomNestedSchemaKey(params.popupuid);
        });
        return;
      }

      // Leave some time to refresh the block data
      setTimeout(() => {
        closePopup();
        // Deleting here ensures that the next time the same popup is opened, it will generate another random key.
        deleteRandomNestedSchemaKey(params.popupuid);
      }, 300);
    }
  };
  const storedContext = { ...getStoredPopupContext(params.popupuid) };

  if (!context) {
    context = storedContext;
  }

  return (
    <PopupParamsProvider params={params} context={context}>
      <PopupVisibleProvider visible={visible} setVisible={setVisible}>
        <DataBlockProvider
          dataSource={context.dataSource}
          collection={context.collection}
          association={context.association}
          sourceId={context.sourceId}
          filterByTk={params.filterbytk}
          // @ts-ignore
          record={storedContext.record}
          parentRecord={storedContext.parentRecord}
          action="get"
        >
          {/* Pass the service of the block where the button is located down, to refresh the block's data when the popup is closed */}
          <BlockRequestContext.Provider value={storedContext.service}>
            <PopupTabsPropsProvider params={params}>
              <div style={{ display: 'none' }}>{children}</div>
            </PopupTabsPropsProvider>
          </BlockRequestContext.Provider>
        </DataBlockProvider>
      </PopupVisibleProvider>
    </PopupParamsProvider>
  );
};

/**
 * insert childSchema to parentSchema to render the nested popups
 * @param childSchema
 * @param props
 * @param parentSchema
 */
export const insertChildToParentSchema = (childSchema: ISchema, props: PopupProps, parentSchema: ISchema) => {
  const { params, context } = props;

  const componentSchema = {
    type: 'void',
    'x-component': 'PagePopupsItemProvider',
    'x-component-props': {
      params,
      context,
    },
    properties: {
      popupAction: childSchema,
    },
  };

  // If we don't use a random name, it will cause the component's parameters not to be updated when reopening the popup
  const nestedPopupKey = getRandomNestedSchemaKey(params.popupuid);

  if (parentSchema.properties) {
    const popupSchema = _.get(parentSchema.properties, Object.keys(parentSchema.properties)[0]);
    if (_.isEmpty(_.get(popupSchema, `properties.${nestedPopupKey}`))) {
      _.set(popupSchema, `properties.${nestedPopupKey}`, componentSchema);
    }
  }
};

export const PagePopups = (props: { paramsList?: PopupParams[] }) => {
  const location = useLocation();
  const popupParams = props.paramsList || getPopupParamsFromPath(getPopupPath(location));
  const { requestSchema } = useRequestSchema();
  const [rootSchema, setRootSchema] = useState<ISchema>(null);
  const popupPropsRef = useRef<PopupProps[]>([]);

  useEffect(() => {
    const run = async () => {
      const waitList = popupParams.map(
        (params) => getStoredPopupContext(params.popupuid)?.schema || requestSchema(params.popupuid),
      );
      const schemas = await Promise.all(waitList);
      const clonedSchemas = schemas.map((schema) => {
        const result = _.cloneDeep(_.omit(schema, 'parent'));
        result['x-read-pretty'] = true;
        return result;
      });
      popupPropsRef.current = clonedSchemas.map((schema, index) => {
        const schemaContext = getPopupContextFromActionOrAssociationFieldSchema(schema);
        return {
          params: popupParams[index],
          context: schemaContext,
        };
      });
      const rootSchema = clonedSchemas[0];
      for (let i = 1; i < clonedSchemas.length; i++) {
        insertChildToParentSchema(clonedSchemas[i], popupPropsRef.current[i], clonedSchemas[i - 1]);
      }
      setRootSchema(rootSchema);
    };
    run();
  }, [popupParams, requestSchema]);

  const components = useMemo(() => ({ PagePopupsItemProvider }), []);

  if (!rootSchema) {
    return null;
  }

  return (
    <PagePopupsItemProvider params={popupPropsRef.current[0].params} context={popupPropsRef.current[0].context}>
      <SchemaComponent components={components} schema={rootSchema} onlyRenderProperties />;
    </PagePopupsItemProvider>
  );
};

export const useRequestSchema = () => {
  const api = useAPIClient();

  const requestSchema = useCallback(async (uid: string) => {
    const data = await api.request({
      url: `/uiSchemas:getJsonSchema/${uid}`,
    });
    return data.data?.data as ISchema;
  }, []);

  return { requestSchema };
};

/**
 * The reason why we don't use the decoded data returned by useParams here is because we need the raw values.
 * @param location
 * @returns
 */
export const getPopupPath = (location: Location) => {
  const [, ...popupsPath] = location.pathname.split('/popups/');
  return popupsPath.join('/popups/');
};