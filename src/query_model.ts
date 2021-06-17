import { map, find } from 'lodash';
import { MyQuery } from './types';
import { ScopedVars } from '@grafana/data';
import { TemplateSrv } from '@grafana/runtime';

export default class QueryModel {
  target: MyQuery;
  queryBuilder: any;
  groupByParts: any;
  templateSrv: any;
  scopedVars: any;
  refId?: string;

  constructor(target: MyQuery, templateSrv?: TemplateSrv, scopedVars?: ScopedVars) {
    this.target = target;
    this.templateSrv = templateSrv;
    this.scopedVars = scopedVars;

    target.schema = target.schema || 'select schema';
    target.timeColumn = target.timeColumn || 'time';
    target.metricColumn = target.metricColumn || 'none';
    target.table = target.table || 'select table';
    target.timeColumnType = 'timestamp';

    target.group = target.group || [];
    target.where = target.where || [];
    target.select = target.select || [[{ name: 'Column', type: 'column', params: ['value'] }]];

    target.format = target.format || 'time_series';
    target.hide = target.hide ?? false;

    // handle pre query gui panels gracefully, so by default we will have raw editor
    target.rawQuery = target.rawQuery ?? true;

    if (target.rawQuery) {
      target.rawSql =
        target.rawSql ||
        'SELECT \n  $__time(end_time), \n  average_cpu_usage_percent \n  FROM \n  v_monitor.cpu_usage \n  WHERE \n  $__timeFilter(end_time)';
    } else {
      target.rawSql = target.rawSql || this.buildQuery();
    }

    this.interpolateQueryStr = this.interpolateQueryStr.bind(this);
  }

  // remove identifier quoting from identifier to use in metadata queries
  unquoteIdentifier(value: string) {
    if (value[0] === '"' && value[value.length - 1] === '"') {
      return value.substring(1, value.length - 1).replace(/""/g, '"');
    } else {
      return value;
    }
  }

  quoteIdentifier(value: any) {
    return '"' + String(value).replace(/"/g, '""') + '"';
  }

  quoteLiteral(value: any) {
    return "'" + String(value).replace(/'/g, "''") + "'";
  }

  escapeLiteral(value: any) {
    return String(value).replace(/'/g, "''");
  }

  hasTimeGroup() {
    return find(this.target.group, (g: any) => g.type === 'time');
  }

  hasMetricColumn() {
    return this.target.metricColumn !== 'none';
  }

  interpolateQueryStr(value: any, variable: { multi: any; includeAll: any }, defaultFormatFn: any) {
    // if no multi or include all do not regexEscape
    if (!variable.multi && !variable.includeAll) {
      return this.escapeLiteral(value);
    }

    if (typeof value === 'string') {
      return this.quoteLiteral(value);
    }

    const escapedValues = map(value, this.quoteLiteral);
    return escapedValues.join(',');
  }

  render(interpolate?: any) {
    const target = this.target;

    // new query with no table set yet
    if (!this.target.rawQuery && !('table' in this.target)) {
      return '';
    }

    if (!target.rawQuery) {
      target.rawSql = this.buildQuery();
    }

    if (interpolate) {
      return this.templateSrv.replace(target.rawSql, this.scopedVars, this.interpolateQueryStr);
    } else {
      return target.rawSql;
    }
  }

  hasUnixEpochTimecolumn() {
    return ['int4', 'int8', 'float4', 'float8', 'numeric'].indexOf(this.target.timeColumnType) > -1;
  }

  buildTimeColumn(alias = true) {
    const timeGroup = this.hasTimeGroup();
    let query;
    let macro = '$__timeGroup';

    if (timeGroup) {
      let args;
      if (timeGroup.params.length > 1 && timeGroup.params[1] !== 'none') {
        args = timeGroup.params.join(',');
      } else {
        args = timeGroup.params[0];
      }
      if (this.hasUnixEpochTimecolumn()) {
        macro = '$__unixEpochGroup';
      }
      query = macro + '(' + this.target.timeColumn + ',' + args + ')';
    } else {
      query = this.target.timeColumn;
      if (alias) {
        query += ' AS "time"';
      }
    }

    return query;
  }

  buildMetricColumn() {
    if (this.hasMetricColumn()) {
      return this.target.metricColumn + ' AS metric';
    }

    return '';
  }

  buildValueColumns() {
    let query = '';
    for (const column of this.target.select) {
      query += ',\n  ' + this.buildValueColumn(column);
    }

    return query;
  }

  buildValueColumn(column: any) {
    let query = '';

    const columnName: any = find(column, (g: any) => g.type === 'column');
    query = columnName.params[0];

    const aggregate: any = find(column, (g: any) => g.type === 'aggregate' || g.type === 'percentile');
    const windows: any = find(column, (g: any) => g.type === 'window' || g.type === 'moving_window');

    if (aggregate) {
      const func = aggregate.params[0];
      switch (aggregate.type) {
        case 'aggregate':
          if (func === 'first' || func === 'last') {
            query = func + '(' + query + ',' + this.target.timeColumn + ')';
          } else {
            query = func + '(' + query + ')';
          }
          break;
        case 'percentile':
          query = func + '(' + aggregate.params[1] + ') WITHIN GROUP (ORDER BY ' + query + ')';
          break;
      }
    }

    if (windows) {
      const overParts = [];
      if (this.hasMetricColumn()) {
        overParts.push('PARTITION BY ' + this.target.metricColumn);
      }
      overParts.push('ORDER BY ' + this.buildTimeColumn(false));

      const over = overParts.join(' ');
      let curr: string;
      let prev: string;
      const hasAlias = find(column, (g: any) => g.type === 'alias');
      switch (windows.type) {
        case 'window':
          switch (windows.params[0]) {
            case 'delta':
              curr = query;
              prev = 'lag(' + curr + ') OVER (' + over + ')';
              query = curr + ' - ' + prev;
              if (!hasAlias) {
                query += ' AS ' + this.quoteIdentifier(windows.params[0]);
              }
              break;
            case 'increase':
              curr = query;
              prev = 'lag(' + curr + ') OVER (' + over + ')';
              query = '(CASE WHEN ' + curr + ' >= ' + prev + ' THEN ' + curr + ' - ' + prev;
              query += ' WHEN ' + prev + ' IS NULL THEN NULL ELSE ' + curr + ' END)';
              break;
            case 'rate':
              let timeColumn = this.target.timeColumn;
              if (aggregate) {
                timeColumn = 'min(' + timeColumn + ')';
              }

              curr = query;
              prev = 'lag(' + curr + ') OVER (' + over + ')';
              query = '(CASE WHEN ' + curr + ' >= ' + prev + ' THEN ' + curr + ' - ' + prev;
              query += ' WHEN ' + prev + ' IS NULL THEN NULL ELSE ' + curr + ' END)';
              query += '/extract(epoch from ' + timeColumn + ' - lag(' + timeColumn + ') OVER (' + over + '))';
              if (!hasAlias) {
                query += ' AS ' + this.quoteIdentifier(windows.params[0]);
              }
              break;
            default:
              query = windows.params[0] + '(' + query + ') OVER (' + over + ')';
              if (!hasAlias) {
                query += ' AS ' + this.quoteIdentifier(windows.params[0]);
              }
              break;
          }
          break;
        case 'moving_window':
          query = windows.params[0] + '(' + query + ') OVER (' + over + ' ROWS ' + windows.params[1] + ' PRECEDING)';
          if (!hasAlias) {
            query += ' AS ' + this.quoteIdentifier(windows.type);
          }
          break;
      }
    }

    const alias: any = find(column, (g: any) => g.type === 'alias');
    if (alias) {
      query += ' AS ' + this.quoteIdentifier(alias.params[0]);
    }

    return query;
  }

  buildWhereClause() {
    let query = '';
    const conditions = map(this.target.where, (tag) => {
      switch (tag.type) {
        case 'macro':
          return tag.name + '(' + this.target.timeColumn + ')';
        case 'expression':
          return tag.params.join(' ');
        default:
          return '';
      }
    });

    if (conditions.length > 0) {
      query = '\nWHERE\n  ' + conditions.join(' AND\n  ');
    }

    return query;
  }

  buildGroupClause() {
    let query = '';
    let groupSection = '';

    for (let i = 0; i < this.target.group.length; i++) {
      const part = this.target.group[i];
      if (i > 0) {
        groupSection += ', ';
      }
      if (part.type === 'time') {
        groupSection += '1';
      } else {
        groupSection += part.params[0];
      }
    }

    if (groupSection.length) {
      query = '\nGROUP BY ' + groupSection;
      if (this.hasMetricColumn()) {
        query += ',2';
      }
    }
    return query;
  }

  buildQuery() {
    // check if the table is not selected query should not be built
    if (this.target.schema === 'select schema' || this.target.table === 'select table') {
      return this.target.rawSql;
    }
    let query = 'SELECT';

    query += ' \n  ' + this.buildTimeColumn();
    if (this.hasMetricColumn()) {
      query += ', \n  ' + this.buildMetricColumn();
    }
    query += this.buildValueColumns();

    query += ' \n FROM ' + `${this.target.schema}.${this.target.table}`;

    query += this.buildWhereClause();
    query += this.buildGroupClause();

    query += ' \n ORDER BY 1';
    if (this.hasMetricColumn()) {
      query += ',2';
    }

    return query;
  }
}
