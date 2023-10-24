import { useDesignable } from '@nocobase/client';
import React, { useState } from 'react';
import { ChartConfigContext, ChartConfigCurrent, ChartConfigure } from '../configure/ChartConfigure';
import { ChartRendererProvider } from '../renderer';

export const ChartV2Block: React.FC = (props) => {
  const { insertAdjacent } = useDesignable();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState<ChartConfigCurrent>({} as any);
  return (
    <ChartConfigContext.Provider value={{ visible, setVisible, current, setCurrent }}>
      {props.children}
      <ChartRendererProvider {...current.field?.decoratorProps}>
        <ChartConfigure insert={(schema, options) => insertAdjacent('beforeEnd', schema, options)} />
      </ChartRendererProvider>
    </ChartConfigContext.Provider>
  );
};
