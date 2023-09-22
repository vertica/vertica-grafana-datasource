import React from 'react';
import { useTheme, SegmentAsync, ClickOutsideWrapper } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { toSelectableValue } from './toSelectableValue';
import { AddButton } from './AddButton';
import { unwrap } from './unwrap';

// eslint-disable-next-line @typescript-eslint/array-type
export type PartParams = Array<{
  value: string;
  options: (() => Promise<SelectableValue<string>>) | null;
}>;


type Props = {
  // eslint-disable-next-line @typescript-eslint/array-type
  parts: Array<{
    name: string;
    params: PartParams;
  }>;
  getNewPartOptions: () => Promise<SelectableValue[]>;
  onChange: (partIndex: number, paramValues: string[]) => void;
  onRemovePart: (index: number) => void;
  onAddNewPart: (type: string, data?: any) => void;
};

const noRightMarginPaddingClass = {
  paddingRight: '0',
  marginRight: '0',
};

const RemovableName = ({ name, onRemove }: { name: string; onRemove: () => void }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: '0px', y: '0px' });
  const theme = useTheme();

  const renderRemovableNameMenuItems = (onClick: () => void) => {
    const normalStyle = {
      background: `${theme.colors.dropdownBg}`,
      cursor: 'pointer',
      padding: '5px 12px 5px 10px',
      boxShadow: 'rgb(0 0 0) 0px 2px 5px 0px',
    };

    /** we have made use of event listeners like MouseOver and MouseOut to immitate hover functionality since the Grafana <8 does not support use of @emotion/css package to generate classes  */
    const handleMouseOverStyle = (e: any) => {
      e.target.style.backgroundColor = `${theme.colors.dropdownOptionHoverBg}`;
    };

    const handleMouseOutStyle = (e: any) => {
      e.target.style.backgroundColor = normalStyle.background;
    };

    return (
      <div
        style={normalStyle}
        className="gf-form-label"
        onClick={onRemove}
        onMouseOver={handleMouseOverStyle}
        onMouseOut={handleMouseOutStyle}
      >
        remove
      </div>
    );
  };

  const openMenu = (e: any) => {
    setPosition({ x: `${e.clientX}px`, y: `${e.clientY + 5}px` });
    setIsOpen(true);
  };

  const handleMenuItemClick = () => {
    setIsOpen(false);
    onRemove();
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  return (
    <>
      <ClickOutsideWrapper onClick={handleClickAway} includeButtonPress={false}>
        <button
          className="gf-form-label"
          style={noRightMarginPaddingClass}
          onMouseDown={handleClickAway}
          onClick={openMenu}
        >
          {name}
        </button>
      </ClickOutsideWrapper>
      <div style={{ position: 'fixed', left: position.x, top: position.y, zIndex: 1051 }}>
        {isOpen && renderRemovableNameMenuItems(handleMenuItemClick)}
      </div>
    </>
  );
};

type PartProps = {
  name: string;
  params: PartParams;
  onRemove: () => void;
  onChange: (paramValues: string[]) => void;
};

const noHorizMarginPaddingClass = {
  paddingLeft: '0',
  paddingRight: '0',
  marginLeft: '0',
  marginRight: '0',
};

const Part = ({ name, params, onChange, onRemove }: PartProps): JSX.Element => {
  const theme = useTheme();

  const onParamChange = (par: string, i: number) => {
    if (par.trim()) {
      const newParams = params.map((p) => p.value);
      newParams[i] = par;
      onChange(newParams);
    }
  };

  return (
    <div
      style={{
        paddingLeft: '0',
        // gf-form-label class makes certain css attributes incorrect
        // for the selectbox-dropdown, so we have to "reset" them back
        lineHeight: theme.typography.lineHeight.sm,
        fontSize: theme.typography.size.sm,
        marginBottom: '4px',
      }}
      className="gf-form-label"
    >
      <RemovableName name={name} onRemove={onRemove} />(
      {params.map((p, i) => {
        const results = new Promise<SelectableValue<string>[]>((resolve) => resolve([]));
        const { value, options } = p;
        const isLast = i === params.length - 1;
        const loadOptions =
          options !== null ? () => options().then((items) => items.map(toSelectableValue)) : () => results;
        return (
          <React.Fragment key={i}>
            <SegmentAsync
              style={noHorizMarginPaddingClass}
              loadOptions={loadOptions}
              value={value}
              onChange={(item) => {
                onParamChange(unwrap(item.value?.trim()), i);
              }}
            />
            <div>{!isLast && ','}</div>
          </React.Fragment>
        );
      })}
      )
    </div>
  );
};

export const PartListSection = ({
  parts,
  getNewPartOptions,
  onAddNewPart,
  onRemovePart,
  onChange,
}: Props): JSX.Element => {
  return (
    <>
      {parts.map((part, index) => (
        <Part
          key={index}
          name={part.name}
          params={part.params}
          onRemove={() => {
            onRemovePart(index);
          }}
          onChange={(pars) => {
            onChange(index, pars);
          }}
        />
      ))}
      <AddButton loadOptions={getNewPartOptions} onAdd={onAddNewPart} />
    </>
  );
};
