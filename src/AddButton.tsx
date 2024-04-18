import React from 'react';
import { SelectableValue } from '@grafana/data';
import { unwrap } from './unwrap';
import { SegmentAsync } from '@grafana/ui';

type Props = {
  loadOptions: () => Promise<SelectableValue[]>;
  allowCustomValue?: boolean;
  onAdd: (v: string, t?: any) => void;
};

export const AddButton = ({ loadOptions, allowCustomValue, onAdd }: Props): JSX.Element => {
  return (
    <SegmentAsync
      Component={
        <div
          className="gf-form-label"
          style={{
            minWidth: '42px',
            height: '32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
          }}
        >
          +
        </div>
      }
      value="+"
      loadOptions={loadOptions}
      allowCustomValue={allowCustomValue}
      onChange={(v) => {
        onAdd(unwrap(v.value), v);
      }}
    />
  );
};
