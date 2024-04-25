import * as _ from 'lodash';
import { Observable } from 'rxjs';

import { DataSourceInstanceSettings, DataQueryRequest, DataQueryResponse, MetricFindValue } from '@grafana/data';
import { DataSourceWithBackend, frameToMetricFindValue, getTemplateSrv } from '@grafana/runtime';
import { MyDataSourceOptions, MyQuery } from './types';

export class DataSource extends DataSourceWithBackend<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  // this method is used to trigger API call for /query endpoint to fetch the response
  query(options: DataQueryRequest<MyQuery>): Observable<DataQueryResponse> {
    options.targets = options.targets
      .filter((target) => (target.hide === undefined && target.rawSql ? true : target.hide === false)) // this filters the queries that are disabled, if hide property is undefined and there is rawSql property available, we will not filter that query
      .map((target) => {
        return {
          timeColumnType: target.timeColumnType,
          timeColumn: target.timeColumn,
          metricColumn: target.metricColumn,
          group: target.group,
          timeGroup: target.timeGroup,
          where: target.where,
          select: target.select,
          table: target.table,
          refId: target.refId,
          rawQuery: target.rawQuery,
          schema: target.schema,
          datasourceId: this.id,
          rawSql: getTemplateSrv().replace(target.rawSql, options.scopedVars, this.interpolateVariable),
          queryType: target.queryType,
          hide: target.hide,
          datasource: target.datasource,
          intervalMs: options.intervalMs,
          maxDataPoints: options.maxDataPoints,
          format: target.format,
        };
      });
    return super.query(options);
  }

  interpolateVariable(value: any, variable: any) {
    if (typeof value === 'string') {
      if (variable.multi || variable.includeAll) {
        return "'" + value.replace(/'/g, `''`) + "'";
      } else {
        return value;
      }
    }

    if (typeof value === 'number') {
      return value;
    }

    const quotedValues = _.map(value, (v: string) => {
      return "'" + v.replace(/'/g, `''`) + "'";
    });
    return quotedValues.join(',');
  }

  async metricFindQuery(query: string, optionalOptions?: any) {
    const refId = optionalOptions?.variable?.name || 'tempVar';

    const interpolatedQuery = {
      refId: refId,
      datasourceId: this.id,
      rawSql: getTemplateSrv().replace(query, {}, this.interpolateVariable),
      format: 'table',
    };
    return super
      .query({
        ...optionalOptions, // includes 'range'
        targets: [interpolatedQuery],
      })
      .toPromise()
      .then((rsp) => {
        if (rsp.data?.length) {
          const f = frameToMetricFindValue(rsp.data[0]);
          // TODO: split this out to a method
          const frame = rsp.data[0];
          // frameToMetricFindValue is OK if the lookup is text-only (one column, __text)
          if (frame.fields.length === 1) {
            return f;
          }
          // if there are two fields, one is __text and the other __value, parse them out so we send the __value instead of the __text
          const textFieldIdx = frame.fields[0].name === '__text' ? 0 : 1;
          const valueFieldIdx = textFieldIdx === 0 ? 1 : 0;
          let metricResponse: MetricFindValue[] = [];
          let idx: number;
          for (idx = 0; idx < frame.length; idx++) {
            metricResponse.push({
              text: frame.fields[textFieldIdx].values.get(idx),
              value: frame.fields[valueFieldIdx].values.get(idx),
            });
          }
          return metricResponse;
        }
        return [];
      });
  }
}
