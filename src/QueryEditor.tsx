import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Select, InlineLabel, SegmentAsync, ConfirmModal, useTheme, Button } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { MetaQuery } from './meta_query';
import QueryModel from './query_model';
import { MyDataSourceOptions, MyQuery } from './types';
import { getTemplateSrv } from '@grafana/runtime';
import { cloneDeep } from 'lodash';
import { PartListSection } from 'PartListSection';
import { SELECT_OPTIONS, WHERE_OPTIONS, FORMAT_OPTIONS } from './constants';
import { DataSource } from './datasource';
// added for autoSuggestion in SQL Field
import AceEditor from 'react-ace';
import 'ace-builds/src-min-noconflict/ext-language_tools';
import 'brace/mode/mysql';
import 'brace/theme/monokai';

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

const normalizeQuery = (query: MyQuery) => {
  if (
    query.table !== undefined &&
    query.timeColumn !== undefined &&
    query.metricColumn !== undefined &&
    query.select !== undefined &&
    query.where !== undefined &&
    query.group !== undefined
  ) {
    return query;
  }
  const queryCopy = cloneDeep(query); // the query-model mutates the query
  return new QueryModel(queryCopy).target;
};

const noHorizMarginPaddingClass = {
  paddingLeft: '0',
  paddingRight: '0',
  marginLeft: '0',
  marginRight: '0',
};

export const QueryEditor = (props: Props): JSX.Element => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isFirstTime = useRef(true);
  const { datasource, onBlur, onRunQuery, onChange } = props;
  const query = normalizeQuery(props.query);
  const { table, timeColumn, metricColumn, format, rawQuery, rawSql, hide, schema } = query;
  const formatData = FORMAT_OPTIONS.filter((formatItem) => formatItem.value === format)[0];
  const theme = useTheme();
  const divStyle = {
    color: theme.colors.textBlue,
  };
  const buttonStyle = {
    color: theme.colors.textBlue,
    marginLeft: '5px',
  };
  const editorColor = {
    backgroundColor: '#111217',
    color: '#ccccdc',
    lineHeight: '18px',
    backgroundImage: 'none',
    border: '1px solid #ccccdc26',
    borderRadius: '2px',
    caretColor: 'red',
  };
  // this is to run query variable declared here with styling
  const [runValue, setRunValue] = useState<string | undefined>('');
  // Value used  for ace-editor in field
  const [queryValue, setQueryValue] = useState<string | undefined>('');

  const buttonPosition = {
    justifyContent: 'right',
  };

  // this is to make sure query is executed first time when user opens a new panel or adds new query
  useEffect(() => {
    if (isFirstTime.current) {
      onApplyQueryChange(query);
      isFirstTime.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handler for query field change action
  const onQueryTextChange = (value?: any, override?: boolean) => {
    // comment to stop on change of runquery
    // onApplyQueryChange({ ...query, rawSql: value }, override);
    setRunValue(value);
    setQueryValue(value);
  };

  // handler for change action for formats dropdown
  const onFormatChange = (value: SelectableValue) => {
    onApplyQueryChange({ ...query, format: value.value });
  };

  // method to show the confirm prompt when user clicks on "Query Builder" button from raw sql mode
  const showConfirmPrompt = () => {
    if (query.rawQuery) {
      setIsModalOpen(true);
    } else {
      const queryModel = new QueryModel(query, getTemplateSrv());
      setQueryValue(queryModel.buildQuery());
      onApplyQueryChange({ ...query, rawQuery: true, rawSql: queryModel.buildQuery() }, false);
    }
  };

  // handler for query field change action
  const onClickQueryChange = () => {
    // const queryModel = new QueryModel(query, getTemplateSrv());
    if (!runValue) {
      setQueryValue(rawSql);
      onApplyQueryChange({ ...query, rawSql: rawSql }, true);
    } else {
      setQueryValue(runValue);
      onApplyQueryChange({ ...query, rawSql: runValue }, true);
    }
  };
  // method to toggle query edit mode
  const toggleQueryBuilder = () => {
    setIsModalOpen((prevState) => !prevState);
    const queryModel = new QueryModel(query, getTemplateSrv());
    setQueryValue(!query.rawQuery ? queryModel.buildQuery() : rawSql);
    onApplyQueryChange(
      { ...query, rawQuery: !query.rawQuery, rawSql: !query.rawQuery ? queryModel.buildQuery() : rawSql },
      false
    );
  };

  // handler for action when confirm prompt is closed
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // method invoked when any change in query is made
  const onApplyQueryChange = (changedQuery: MyQuery, runQuery = true) => {
    setQueryValue(changedQuery.rawSql);
    if (onChange) {
      if (!changedQuery.rawQuery) {
        const queryModel = new QueryModel(changedQuery, getTemplateSrv());
        setQueryValue(queryModel.buildQuery());
        changedQuery.rawSql = queryModel.buildQuery();
      }
      onChange({ ...changedQuery });
    }
    if (runQuery && onRunQuery) {
      onRunQuery();
    }
  };

  // handler for schema change action
  const handleSchemaChange = (data: any) => {
    onApplyQueryChange({ ...query, schema: data.value.trim() });
  };

  // handler for from change action
  const handleFromChange = (data: any) => {
    onApplyQueryChange({ ...query, table: data.value.trim() });
  };

  // handler for time column change action
  const handleTimeColumnChange = (data: any) => {
    onApplyQueryChange({ ...query, timeColumn: data.value.trim() });
  };

  // handler for metric column change action
  const handleMetricColumnChange = (data: any) => {
    onApplyQueryChange({ ...query, metricColumn: data.value.trim() });
  };

  // handler when SELECT section part is changed
  const handleSelectParamsChange = (index: number, paramIndex: number, params: string[]) => {
    const newSel = [...(query.select ?? [])];
    newSel[index] = [...newSel[index]];
    newSel[index][paramIndex] = {
      ...newSel[index][paramIndex],
      params: params,
    };
    onApplyQueryChange({ ...query, select: newSel });
  };

  // handler when SELECT section part is added
  const handleSelectParamsAdd = (index: number, type: string) => {
    const clonedQuery = cloneDeep(query);
    const label = type.split('|')[0];
    const value = type.split('|')[1];
    const partType = type.split('|')[2];
    let defaultParams: Array<string | number> = [];
    switch (value) {
      case 'column':
        defaultParams = ['value'];
        break;
      case 'avg':
      case 'min':
      case 'max':
      case 'count':
      case 'stddev':
      case 'variance':
      case 'delta':
      case 'increase':
      case 'rate':
      case 'sum':
        defaultParams = [value];
        break;
      case 'alias':
        const part = clonedQuery.select[index];
        const aliasIndex = part.findIndex((p: { type: string }) => p.type === 'column');
        if (aliasIndex !== -1) {
          defaultParams = [part[aliasIndex].params[0]];
        } else {
          defaultParams = ['value'];
        }
        break;
      case 'moving_window':
        defaultParams = ['avg', '5'];
        break;
      default:
        defaultParams = [];
    }
    if (value === 'column') {
      clonedQuery.select.push([{ name: 'Column', type: 'column', params: ['value'] }]);
    } else {
      // check if the type is already added in that column
      const part = [...clonedQuery.select[index]];
      const partIndex = part.findIndex(
        (p) =>
          p.name === label ||
          (p.name === 'Moving Window' && label === 'Window') ||
          (p.name === 'Window' && label === 'Moving Window')
      );
      const payload = {
        type: partType,
        name: label,
        params: defaultParams,
      };
      // if part is already added, update it with new params and label
      if (partIndex !== -1) {
        clonedQuery.select[index][partIndex] = payload;
      } else {
        // if type does not exist already, then add new part in that column
        clonedQuery.select[index].push(payload);
      }
    }
    onApplyQueryChange({ ...clonedQuery });
  };

  // handler when SELECT section part is removed
  const handleSelectParamsRemove = (index: number, paramIndex: number) => {
    const newSel = [...(query.select ?? [])];
    newSel[index] = [...newSel[index]];
    if (newSel[index][paramIndex].type === 'column' && newSel.length > 1) {
      newSel.splice(index, 1);
      onApplyQueryChange({ ...query, select: newSel });
    } else if (newSel[index][paramIndex].type !== 'column') {
      newSel[index].splice(paramIndex, 1);
      onApplyQueryChange({ ...query, select: newSel });
    }
  };

  // handler when WHERE section part is changed
  const handleWhereParamsChange = (paramIndex: number, params: string[]) => {
    const where = cloneDeep(query.where) ?? [];
    if (where[paramIndex].type === 'macro') {
      return;
    }
    where[paramIndex] = {
      ...where[paramIndex],
      params: params,
    };
    onApplyQueryChange({ ...query, where: where });
  };

  // handler when WHERE section part is added
  const handleWhereParamsAdd = (type: string) => {
    const clonedQuery = cloneDeep(query);
    let defaultParams: Array<string | number> = [];
    let partName = '';
    switch (type) {
      case 'macro':
        defaultParams = [];
        partName = '$__timeFilter';
        break;
      case 'expression':
        defaultParams = ['value', '=', 'value'];
        partName = 'Expression';
        break;
      default:
        defaultParams = [];
    }
    const partIndex = clonedQuery.where.findIndex((p: { type: string }) => p.type === 'macro');
    if ((partIndex === -1 && type === 'macro') || type === 'expression') {
      clonedQuery.where.push({
        type: type,
        name: partName,
        params: defaultParams,
      });
      onApplyQueryChange({ ...clonedQuery });
    }
  };

  // handler when WHERE part is removed
  const handleWhereParamsRemove = (index: number) => {
    const where = cloneDeep(query.where) ?? [];
    where.splice(index, 1);
    onApplyQueryChange({ ...query, where });
  };

  // handler when GROUP part is changed
  const handleGroupParamsChange = (paramIndex: number, params: string[]) => {
    const group = cloneDeep(query.group) ?? [];
    group[paramIndex] = {
      ...group[paramIndex],
      params: params,
    };
    onApplyQueryChange({ ...query, group: group });
  };

  // handler when GROUP part is added
  const handleGroupParamsAdd = (type: string, data: any = { label: '', value: '', type: '' }) => {
    // const clonedQuery = cloneDeep(query);
    const clonedQuery = cloneDeep<any | undefined>(query);
    let defaultParams: Array<string | number> = [];
    let partName = '';
    switch (type) {
      case 'time':
        defaultParams = ['$__interval', 'none'];
        partName = 'time';
        break;
      case 'column':
        defaultParams = [data.label];
        partName = 'Column';
        break;
      default:
        defaultParams = [];
    }
    const partIndex = clonedQuery.where.findIndex((p: { type: string }) => p.type === 'time');
    if ((partIndex === -1 && type === 'time') || type === 'column') {
      clonedQuery.group.push({
        type: type,
        name: partName,
        params: defaultParams,
      });
      onApplyQueryChange({ ...clonedQuery });
    }
  };

  // handler when GROUP part is removed
  const handleGroupParamsRemove = (index: number) => {
    const group = cloneDeep(query.group) ?? [];
    group.splice(index, 1);
    onApplyQueryChange({ ...query, group });
  };

  // method to fetch all the schemas available in the configured datasource
  const getSchemaOptions = () => {
    const queryModel = new QueryModel(query, getTemplateSrv());
    const metaBuilder = new MetaQuery(query, queryModel);
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      setTimeout(async () => {
        const response = await datasource.metricFindQuery(metaBuilder.buildSchemaQuery());
        const result = response.map((res: any) => {
          return { label: res.text, value: res.text };
        });
        resolve(result);
      }, 0);
    });
  };

  // method to fetch all the tables for the selected schema
  const getTableOptions = () => {
    const queryModel = new QueryModel(query, getTemplateSrv());
    const metaBuilder = new MetaQuery(query, queryModel);
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      setTimeout(async () => {
        const response = await datasource.metricFindQuery(metaBuilder.buildTableQuery());
        const result = response.map((res: any) => {
          return { label: res.text, value: res.text };
        });
        resolve(result);
      }, 0);
    });
  };

  // method to fetch all the time columns for the selected table
  const getTimeColumnOptions = () => {
    const queryModel = new QueryModel(query, getTemplateSrv());
    const metaBuilder = new MetaQuery(query, queryModel);
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      setTimeout(async () => {
        const response = await datasource.metricFindQuery(metaBuilder.buildColumnQuery('time'));
        const result = response.map((res: any) => {
          return { label: res.text, value: res.text };
        });
        resolve(result);
      }, 0);
    });
  };

  // method to fetch all the metric columns for the selected table
  const getMetricColumnOptions = () => {
    const queryModel = new QueryModel(query, getTemplateSrv());
    const metaBuilder = new MetaQuery(query, queryModel);
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      setTimeout(async () => {
        const response = await datasource.metricFindQuery(metaBuilder.buildColumnQuery('metric'));
        const result = response.map((res: any) => {
          return { label: res.text, value: res.text };
        });
        resolve(result);
      }, 0);
    });
  };

  // method to fetch all the value columns for the selected table
  const getColumnOptions = useCallback(async () => {
    const queryModel = new QueryModel(query, getTemplateSrv());
    const metaBuilder = new MetaQuery(query, queryModel);
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      setTimeout(async () => {
        const response = await datasource.metricFindQuery(metaBuilder.buildColumnQuery('value'));
        const result = response.map((res: any) => {
          return res.text;
        });
        resolve(result);
      }, 0);
    });
  }, [datasource, query]);

  // method to fetch all the columns selected in the SELECT section and TIME section
  const getSelectedColumnOptions = useCallback(() => {
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      setTimeout(() => {
        const result: any = [];
        result.push(query.timeColumn);
        query.select.map((select: any) => {
          select.map((item: any) => {
            if (item.type === 'column') {
              result.push(item.params[0]);
            }
          });
        });
        resolve(result);
      }, 0);
    });
  }, [query]);

  // method to fetch all the group columns for the selected table
  const getGroupByOptions = () => {
    const queryModel = new QueryModel(query, getTemplateSrv());
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      setTimeout(async () => {
        const response = await getSelectedColumnOptions();
        const options = [];
        if (!queryModel.hasTimeGroup()) {
          options.push({ type: 'time', value: 'time', label: 'time($__interval,none)' });
        }
        for (const tag of response) {
          options.push({ type: 'column', value: 'column', label: tag.toString() });
        }
        resolve(options);
      }, 0);
    });
  };

  // method to fetch all the columns for the selected table
  const getAllColumns = useCallback(() => {
    const { datasource } = props;
    const queryModel = new QueryModel(query, getTemplateSrv());
    const metaBuilder = new MetaQuery(query, queryModel);
    return new Promise<Array<SelectableValue<string>>>((resolve) => {
      setTimeout(async () => {
        const response = await datasource.metricFindQuery(metaBuilder.buildColumnQuery(''));
        const result = response.map((res: any) => {
          return res.text;
        });
        resolve(result);
      }, 0);
    });
  }, [props, query]);

  // prepares an array of parts to be rendered within the SELECT section
  const selectParts = useMemo(() => {
    const results: any = [];
    query.select &&
      query.select.map((item) => {
        const data: any = [];
        item.map((row) => {
          const params: Array<{ value: string; options: (() => Promise<SelectableValue<string>>) | null }> = [];
          row.params.map((param, paramIndex) => {
            if (row.type === 'column') {
              params.push({
                value: param.toString(),
                options: () => Promise.resolve(getColumnOptions()),
              });
            } else if (row.type === 'alias') {
              params.push({
                value: param.toString(),
                options: null,
              });
            } else if (row.type === 'aggregate') {
              params.push({
                value: param.toString(),
                options: () => Promise.resolve(['avg', 'count', 'min', 'max', 'sum', 'stddev', 'variance']),
              });
            } else if (row.type === 'window' && row.name === 'Window') {
              params.push({
                value: param.toString(),
                options: () => Promise.resolve(['delta', 'increase', 'rate', 'sum']),
              });
            } else if (row.type === 'moving_window') {
              if (paramIndex === 0) {
                params.push({
                  value: param.toString(),
                  options: () => Promise.resolve(['avg']),
                });
              } else {
                params.push({
                  value: param.toString(),
                  options: () => Promise.resolve(['3', '5', '7', '10', '20']),
                });
              }
            }
          });
          data.push({
            name: row.name,
            type: row.type,
            params: params,
          });
        });
        results.push(data);
      });
    return results;
  }, [query.select, getColumnOptions]);

  // prepares an array of parts to be rendered within the WHERE section
  const whereParts = useMemo(() => {
    const results: any = [];
    query.where?.map((part) => {
      const params: Array<{ value: string; options: (() => Promise<SelectableValue<string>>) | null }> = [];
      let partName = '';
      part.params.map((param, index) => {
        if (part.type === 'expression') {
          partName = 'Expression';
          if (index === 0) {
            params.push({
              value: param.toString(),
              options: () => getAllColumns(),
            });
          }
          if (index === 2) {
            params.push({
              value: param.toString(),
              options: null,
            });
          } else if (index === 1) {
            params.push({
              value: param.toString(),
              options: () => Promise.resolve(['=', '!=', '<', '<=', '>', '>=', 'IN', 'NOT IN']),
            });
          }
        }
      });
      if (part.type === 'macro') {
        partName = 'Macro';
        params.push({
          value: part.name?.toString() || `$__timeFilter`,
          options: null,
        });
      }
      results.push({
        name: partName,
        type: part.type,
        params: params,
      });
    });
    return results;
  }, [query.where, getAllColumns]);

  // prepares an array of parts to be rendered within the GROUP section
  const groupParts = useMemo(() => {
    const results: any = [];
    query.group &&
      query.group.map((part) => {
        const params: Array<{ value: string; options: (() => Promise<SelectableValue<string>>) | null }> = [];
        let partName = '';
        part.params.map((param, index) => {
          if (part.type === 'time') {
            partName = part.type;
            if (index === 0) {
              params.push({
                value: param.toString(),
                options: () => Promise.resolve(['$__interval', '1s', '10s', '1m', '5m', '10m', '15m', '1h']),
              });
            } else {
              params.push({
                value: param.toString(),
                options: () => Promise.resolve(['none', 'NULL', 'previous', '0']),
              });
            }
          } else {
            partName = 'Column';
            params.push({
              value: param.toString(),
              options: () => getSelectedColumnOptions(),
            });
          }
        });
        results.push({
          name: partName,
          type: part.type,
          params: params,
        });
      });
    return results;
  }, [query.group, getSelectedColumnOptions]);

  const selectStyle = {
    paddingLeft: '0',
    lineHeight: theme.typography.lineHeight.sm,
    fontSize: theme.typography.size.sm,
  };

  return (
    <>
      {rawQuery ? (
        <>
          <div className="gf-form col-md-12" style={buttonPosition}>
            <Button icon="play" variant="primary" disabled={hide} size="sm" onClick={onClickQueryChange}>
              Run query
            </Button>
          </div>
          <div className="gf-form" style={hide ? { cursor: 'none' } : { cursor: 'pointer' }}>
            <AceEditor
              // id="editorAutoComplete"
              key={datasource?.name}
              aria-label="editorAutoComplete"
              mode="mysql"
              theme="monokai"
              name="editorAutoComplete"
              fontSize={16}
              style={{ ...editorColor }}
              minLines={15}
              maxLines={10}
              width="100%"
              showPrintMargin={false}
              showGutter
              editorProps={{ $blockScrolling: true }}
              setOptions={{
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                enableSnippets: true,
              }}
              value={queryValue}
              portalOrigin="vertica"
              readOnly={hide}
              onBlur={onBlur}
              onRunQuery={onRunQuery}
              onChange={onQueryTextChange}
            />
          </div>

          <div className="gf-form-inline">
            <InlineLabel style={divStyle} width={10}>
              Format as
            </InlineLabel>
            <Select onChange={onFormatChange} options={FORMAT_OPTIONS} width={16} defaultValue={formatData} />
            <InlineLabel style={{ ...buttonStyle, cursor: 'pointer' }} width={14} onClick={showConfirmPrompt}>
              {rawQuery ? `Query Builder` : `Edit SQL`}
            </InlineLabel>
            <div className="gf-form gf-form--grow">
              <label className="gf-form-label gf-form-label--grow"></label>
            </div>
          </div>
        </>
      ) : (
        <div>
          <div className="gf-form-inline">
            <div className="gf-form">
              <InlineLabel width={14} style={divStyle}>
                FROM SCHEMA
              </InlineLabel>
              <div className="gf-form-label" style={selectStyle}>
                <SegmentAsync
                  style={noHorizMarginPaddingClass}
                  loadOptions={getSchemaOptions}
                  value={schema}
                  onChange={(data) => {
                    handleSchemaChange(data);
                  }}
                />
              </div>
              <InlineLabel width={14} style={divStyle}>
                FROM TABLE
              </InlineLabel>
              <div className="gf-form-label" style={selectStyle}>
                <SegmentAsync
                  style={noHorizMarginPaddingClass}
                  loadOptions={getTableOptions}
                  value={table}
                  onChange={(data) => {
                    handleFromChange(data);
                  }}
                />
              </div>
              <InlineLabel width={14} style={divStyle}>
                Time column
              </InlineLabel>
              <div className="gf-form-label" style={selectStyle}>
                <SegmentAsync
                  style={noHorizMarginPaddingClass}
                  loadOptions={getTimeColumnOptions}
                  value={timeColumn}
                  onChange={(data) => {
                    handleTimeColumnChange(data);
                  }}
                />
              </div>
              <InlineLabel width={21} style={divStyle} tooltip="Column to be used as metric name for the value column">
                Metric column
              </InlineLabel>
              <div className="gf-form-label">
                <SegmentAsync
                  style={noHorizMarginPaddingClass}
                  loadOptions={getMetricColumnOptions}
                  value={metricColumn}
                  onChange={(data) => {
                    handleMetricColumnChange(data);
                  }}
                />
              </div>
            </div>
            <div className="gf-form gf-form--grow">
              <label className="gf-form-label gf-form-label--grow"></label>
            </div>
          </div>
          {selectParts.map((item: any, index: number) => (
            <div className="gf-form-inline" key={`select__${index}`}>
              <div key={index}>
                <InlineLabel style={divStyle} width={10}>
                  {index === 0 ? 'SELECT' : ''}
                </InlineLabel>
              </div>
              <PartListSection
                parts={item}
                getNewPartOptions={() => new Promise((resolve) => resolve(SELECT_OPTIONS))}
                onChange={(partIndex, newParams) => {
                  handleSelectParamsChange(index, partIndex, newParams);
                }}
                onAddNewPart={(type) => {
                  handleSelectParamsAdd(index, type);
                }}
                onRemovePart={(partIndex) => {
                  handleSelectParamsRemove(index, partIndex);
                }}
              />
              <div className="gf-form gf-form--grow">
                <label className="gf-form-label gf-form-label--grow"></label>
              </div>
            </div>
          ))}
          <div className="gf-form-inline">
            <InlineLabel style={divStyle} width={10}>
              WHERE
            </InlineLabel>
            <PartListSection
              parts={whereParts}
              getNewPartOptions={() => new Promise((resolve) => resolve(WHERE_OPTIONS))}
              onChange={(partIndex, newParams) => {
                handleWhereParamsChange(partIndex, newParams);
              }}
              onAddNewPart={(type) => {
                handleWhereParamsAdd(type);
              }}
              onRemovePart={(partIndex) => {
                handleWhereParamsRemove(partIndex);
              }}
            />
            <div className="gf-form gf-form--grow">
              <label className="gf-form-label gf-form-label--grow"></label>
            </div>
          </div>
          <div className="gf-form-inline">
            <InlineLabel style={divStyle} width={10}>
              GROUP BY
            </InlineLabel>
            <PartListSection
              parts={groupParts}
              getNewPartOptions={() => getGroupByOptions()}
              onChange={(partIndex, newParams) => {
                handleGroupParamsChange(partIndex, newParams);
              }}
              onAddNewPart={(type, item) => {
                handleGroupParamsAdd(type, item);
              }}
              onRemovePart={(partIndex) => {
                handleGroupParamsRemove(partIndex);
              }}
            />
            <div className="gf-form gf-form--grow">
              <label className="gf-form-label gf-form-label--grow"></label>
            </div>
          </div>
          <div className="gf-form-inline">
            <InlineLabel style={divStyle} width={10}>
              Format as
            </InlineLabel>
            <Select onChange={onFormatChange} options={FORMAT_OPTIONS} width={16} defaultValue={formatData} />
            <InlineLabel style={{ ...buttonStyle, cursor: 'pointer' }} width={10} onClick={showConfirmPrompt}>
              {rawQuery ? `Query Builder` : `Edit SQL`}
            </InlineLabel>
            <div className="gf-form gf-form--grow">
              <label className="gf-form-label gf-form-label--grow"></label>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isModalOpen}
        title="Warning"
        body="Switching to query builder may overwrite your raw SQL."
        confirmText="Switch"
        onConfirm={() => {
          toggleQueryBuilder();
        }}
        onDismiss={() => {
          handleModalClose();
        }}
      />
    </>
  );
};
