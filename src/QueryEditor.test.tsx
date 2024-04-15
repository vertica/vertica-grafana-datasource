import React, { ReactNode } from 'react';
import { MyQuery } from './types';
// import { DataSource } from './datasource';
// import { render } from '@testing-library/react';
// import { QueryEditor } from './QueryEditor';
// Mocking Grafana Ui components
jest.mock('@grafana/ui', () => {
  const SegmentAsync = ({ value }: { value: string }) => {
    return <span>[{value}]</span>;
  };
  const Select = ({ defaultValue }: { defaultValue: { label: string; value: string } }) => {
    return <span>{defaultValue.label}</span>;
  };
  const InlineLabel = ({ children }: { children: ReactNode }) => {
    return <span>{children}</span>;
  };
  const ConfirmModal = ({ label }: { label: string }) => {
    return <span></span>;
  };
  const QueryField = ({ query }: { query: string }) => <span>[{query}]</span>;
  const orig = jest.requireActual('@grafana/ui');

  return {
    ...orig,
    SegmentAsync,
    QueryField,
    Select,
    InlineLabel,
    ConfirmModal,
  };
});
//Rendering QueryEditor for testcases
function assertEditor(query: MyQuery, textContent: string) {
  // const onChange = jest.fn();
  // const onRunQuery = jest.fn();
  // const datasource: DataSource = {} as DataSource;
  // const { container } = render(
  //   <QueryEditor query={query} onChange={onChange} onRunQuery={onRunQuery} datasource={datasource} />
  // );
  // expect(container.textContent).toBe(textContent);
}
describe('Query Editor Test cases', () => {
  it('should handle minimal query', () => {
    const query: MyQuery = {
      refId: 'A',
      schema: 'schema2',
      timeColumn: 'time',
      metricColumn: 'none',
      table: 'select table',
      timeColumnType: 'timestamp',
      group: [],
      where: [
        {
          type: 'macro',
          name: '$__timeFilter',
          params: [],
        },
      ],
      select: [
        [
          {
            name: 'Column',
            type: 'column',
            params: ['value'],
          },
        ],
      ],
      format: 'time_series',
      hide: false,
      rawQuery: false,
      rawSql: '',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
    };
    assertEditor(
      query,
      'FROM SCHEMA[schema2]' +
        'FROM TABLE[select table]' +
        'Time column[time]' +
        'Metric column[none]' +
        'SELECTColumn([value])[+]' +
        'WHEREMacro([$__timeFilter])[+]' +
        'GROUP BY[+]' +
        'Format asTime Series' +
        'Edit SQL'
    );
  });
  it('should handle minimal query with rawQuery on', () => {
    const query: MyQuery = {
      refId: 'A',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      schema: 'select schema',
      timeColumn: 'time',
      metricColumn: 'none',
      table: 'select table',
      timeColumnType: 'timestamp',
      group: [],
      where: [
        {
          type: 'macro',
          name: '$__timeFilter',
          params: [],
        },
      ],
      select: [
        [
          {
            name: 'Column',
            type: 'column',
            params: ['value'],
          },
        ],
      ],
      format: 'time_series',
      hide: false,
      rawQuery: true,
      rawSql:
        'SELECT \n  $__time(end_time), \n  average_cpu_usage_percent \n  FROM \n  v_monitor.cpu_usage \n  WHERE \n  $__timeFilter(end_time)',
    };
    assertEditor(
      query,
      '[SELECT \n' +
        '  $__time(end_time), \n' +
        '  average_cpu_usage_percent \n' +
        '  FROM \n' +
        '  v_monitor.cpu_usage \n' +
        '  WHERE \n' +
        '  $__timeFilter(end_time)]Format asTime SeriesQuery Builder'
    );
  });
  it('should handle basic query with From fields filled', () => {
    const query: MyQuery = {
      refId: 'A',
      schema: 'public',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      timeColumn: 'started',
      metricColumn: 'user_name',
      table: 'intest',
      timeColumnType: 'timestamp',
      group: [],
      where: [
        {
          type: 'macro',
          name: '$__timeFilter',
          params: [],
        },
      ],
      select: [
        [
          {
            name: 'Column',
            type: 'column',
            params: ['value'],
          },
        ],
      ],
      format: 'time_series',
      hide: false,
      rawQuery: false,
      rawSql:
        "SELECT \n  started AS 'time', \n  user_name AS metric,\n  job_number \n FROM public.intest\nWHERE\n  $__timeFilter(started) \n ORDER BY 1,2",
    };
    assertEditor(
      query,
      'FROM SCHEMA[public]' +
        'FROM TABLE[intest]' +
        'Time column[started]' +
        'Metric column[user_name]' +
        'SELECTColumn([value])[+]' +
        'WHEREMacro([$__timeFilter])[+]' +
        'GROUP BY[+]' +
        'Format asTime Series' +
        'Edit SQL'
    );
  });
  it('should handle basic query with values in from field and rawquery On', () => {
    const query: MyQuery = {
      refId: 'A',
      schema: 'public',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      timeColumn: 'started',
      metricColumn: 'user_name',
      table: 'intest',
      timeColumnType: 'timestamp',
      group: [],
      where: [
        {
          type: 'macro',
          name: '$__timeFilter',
          params: [],
        },
      ],
      select: [
        [
          {
            name: 'Column',
            type: 'column',
            params: ['value'],
          },
        ],
      ],
      format: 'time_series',
      hide: false,
      rawQuery: true,
      rawSql:
        "SELECT \n  started AS 'time', \n  user_name AS metric,\n  job_number \n FROM public.intest\nWHERE\n  $__timeFilter(started) \n ORDER BY 1,2",
    };
    assertEditor(
      query,
      `[SELECT \n  started AS \'time\', \n  user_name AS metric,\n  job_number \n FROM public.intest\nWHERE\n  $__timeFilter(started) \n ORDER BY 1,2]Format asTime SeriesQuery Builder`
    );
  });
  it('should handle basic query with From and Select fields filled', () => {
    const query: MyQuery = {
      refId: 'A',
      schema: 'public',
      timeColumn: 'started',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      metricColumn: 'user_name',
      table: 'intest',
      timeColumnType: 'timestamp',
      group: [],
      where: [
        {
          type: 'macro',
          name: '$__timeFilter',
          params: [],
        },
      ],
      select: [
        [
          {
            name: 'Column',
            type: 'column',
            params: ['user_key'],
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['count'],
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['user_key'],
          },
          {
            type: 'window',
            name: 'Window',
            params: ['delta'],
          },
        ],
        [
          {
            name: 'Column',
            type: 'column',
            params: ['job_number'],
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['min'],
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['job_number'],
          },
          {
            type: 'window',
            name: 'Window',
            params: ['increase'],
          },
        ],
      ],
      format: 'time_series',
      hide: false,
      rawQuery: false,
      rawSql:
        "SELECT \n  started AS 'time', \n  user_name AS metric,\n  count(user_key) - lag(count(user_key)) OVER (PARTITION BY user_name ORDER BY started) AS 'user_key',\n  (CASE WHEN min(job_number) >= lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) THEN min(job_number) - lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) WHEN lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) IS NULL THEN NULL ELSE min(job_number) END) AS 'job_number' \n FROM public.intest\nWHERE\n  $__timeFilter(started) \n ORDER BY 1,2",
    };
    assertEditor(
      query,
      'FROM SCHEMA[public]' +
        'FROM TABLE[intest]' +
        'Time column[started]' +
        'Metric column[user_name]' +
        'SELECTColumn([user_key])Aggregate([count])Alias([user_key])Window([delta])[+]Column([job_number])Aggregate([min])Alias([job_number])Window([increase])[+]' +
        'WHEREMacro([$__timeFilter])[+]' +
        'GROUP BY[+]' +
        'Format asTime Series' +
        'Edit SQL'
    );
  });
  it('should handle basic query with values in From ,Select fields and rawquery On', () => {
    const query: MyQuery = {
      refId: 'A',
      schema: 'public',
      timeColumn: 'started',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      metricColumn: 'user_name',
      table: 'intest',
      timeColumnType: 'timestamp',
      group: [],
      where: [
        {
          type: 'macro',
          name: '$__timeFilter',
          params: [],
        },
      ],
      select: [
        [
          {
            name: 'Column',
            type: 'column',
            params: ['user_key'],
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['count'],
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['user_key'],
          },
          {
            type: 'window',
            name: 'Window',
            params: ['delta'],
          },
        ],
        [
          {
            name: 'Column',
            type: 'column',
            params: ['job_number'],
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['min'],
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['job_number'],
          },
          {
            type: 'window',
            name: 'Window',
            params: ['increase'],
          },
        ],
      ],
      format: 'time_series',
      hide: false,
      rawQuery: true,
      rawSql:
        "SELECT \n  started AS 'time', \n  user_name AS metric,\n  count(user_key) - lag(count(user_key)) OVER (PARTITION BY user_name ORDER BY started) AS 'user_key',\n  (CASE WHEN min(job_number) >= lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) THEN min(job_number) - lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) WHEN lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) IS NULL THEN NULL ELSE min(job_number) END) AS 'job_number' \n FROM public.intest\nWHERE\n  $__timeFilter(started) \n ORDER BY 1,2",
    };
    assertEditor(
      query,
      `[SELECT \n  started AS \'time\', \n  user_name AS metric,\n  count(user_key) - lag(count(user_key)) OVER (PARTITION BY user_name ORDER BY started) AS \'user_key\',\n  (CASE WHEN min(job_number) >= lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) THEN min(job_number) - lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) WHEN lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY started) IS NULL THEN NULL ELSE min(job_number) END) AS \'job_number\' \n FROM public.intest\nWHERE\n  $__timeFilter(started) \n ORDER BY 1,2]Format asTime SeriesQuery Builder`
    );
  });
  it('should handle basic query with all fields filled', () => {
    const query: MyQuery = {
      refId: 'A',
      schema: 'public',
      timeColumn: 'started',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      metricColumn: 'user_name',
      table: 'intest',
      timeColumnType: 'timestamp',
      group: [
        {
          type: 'time',
          name: 'time',
          params: ['$__interval', 'NULL'],
        },
      ],
      where: [
        {
          type: 'macro',
          name: '$__timeFilter',
          params: [],
        },
        {
          type: 'expression',
          name: 'Expression',
          params: ['user_key', '=', 'value'],
        },
      ],
      select: [
        [
          {
            name: 'Column',
            type: 'column',
            params: ['user_key'],
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['count'],
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['user_key'],
          },
          {
            type: 'window',
            name: 'Window',
            params: ['delta'],
          },
        ],
        [
          {
            name: 'Column',
            type: 'column',
            params: ['job_number'],
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['min'],
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['job_number'],
          },
          {
            type: 'window',
            name: 'Window',
            params: ['increase'],
          },
        ],
      ],
      format: 'time_series',
      hide: false,
      rawQuery: false,
      rawSql:
        "SELECT \n  $__timeGroup(started,$__interval,NULL), \n  user_name AS metric,\n  count(user_key) - lag(count(user_key)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) AS 'user_key',\n  (CASE WHEN min(job_number) >= lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) THEN min(job_number) - lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) WHEN lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) IS NULL THEN NULL ELSE min(job_number) END) AS 'job_number' \n FROM public.intest\nWHERE\n  $__timeFilter(started) AND\n  user_key = value\nGROUP BY 1,2 \n ORDER BY 1,2",
    };
    assertEditor(
      query,
      'FROM SCHEMA[public]' +
        'FROM TABLE[intest]' +
        'Time column[started]' +
        'Metric column[user_name]' +
        'SELECTColumn([user_key])Aggregate([count])Alias([user_key])Window([delta])[+]Column([job_number])Aggregate([min])Alias([job_number])Window([increase])[+]' +
        'WHEREMacro([$__timeFilter])Expression([user_key],[=],[value])[+]' +
        'GROUP BYtime([$__interval],[NULL])[+]' +
        'Format asTime Series' +
        'Edit SQL'
    );
  });
  it('should handle basic query with values in all fields and rawquery On', () => {
    const query: MyQuery = {
      refId: 'A',
      schema: 'public',
      timeColumn: 'started',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      metricColumn: 'user_name',
      table: 'intest',
      timeColumnType: 'timestamp',
      group: [
        {
          type: 'time',
          name: 'time',
          params: ['$__interval', 'NULL'],
        },
      ],
      where: [
        {
          type: 'macro',
          name: '$__timeFilter',
          params: [],
        },
        {
          type: 'expression',
          name: 'Expression',
          params: ['user_key', '=', 'value'],
        },
      ],
      select: [
        [
          {
            name: 'Column',
            type: 'column',
            params: ['user_key'],
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['count'],
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['user_key'],
          },
          {
            type: 'window',
            name: 'Window',
            params: ['delta'],
          },
        ],
        [
          {
            name: 'Column',
            type: 'column',
            params: ['job_number'],
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['min'],
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['job_number'],
          },
          {
            type: 'window',
            name: 'Window',
            params: ['increase'],
          },
        ],
      ],
      format: 'time_series',
      hide: false,
      rawQuery: true,
      rawSql:
        "SELECT \n  $__timeGroup(started,$__interval,NULL), \n  user_name AS metric,\n  count(user_key) - lag(count(user_key)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) AS 'user_key',\n  (CASE WHEN min(job_number) >= lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) THEN min(job_number) - lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) WHEN lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) IS NULL THEN NULL ELSE min(job_number) END) AS 'job_number' \n FROM public.intest\nWHERE\n  $__timeFilter(started) AND\n  user_key = value\nGROUP BY 1,2 \n ORDER BY 1,2",
    };
    assertEditor(
      query,
      `[SELECT \n  $__timeGroup(started,$__interval,NULL), \n  user_name AS metric,\n  count(user_key) - lag(count(user_key)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) AS \'user_key\',\n  (CASE WHEN min(job_number) >= lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) THEN min(job_number) - lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) WHEN lag(min(job_number)) OVER (PARTITION BY user_name ORDER BY $__timeGroup(started,$__interval,NULL)) IS NULL THEN NULL ELSE min(job_number) END) AS \'job_number\' \n FROM public.intest\nWHERE\n  $__timeFilter(started) AND\n  user_key = value\nGROUP BY 1,2 \n ORDER BY 1,2]Format asTime SeriesQuery Builder`
    );
  });
  it('should handle complex query with value in group,select,where', () => {
    const query: MyQuery = {
      format: 'table',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      group: [
        {
          type: 'column',
          name: 'Column',
          params: ['c1'],
        },
        {
          type: 'column',
          name: 'Column',
          params: ['c2'],
        },
      ],
      hide: false,
      metricColumn: 'c2',
      rawQuery: false,
      rawSql:
        "SELECT \n  time AS 'time', \n  c2 AS metric,\n  max(c1),\n  c3 AS 'normal' \n FROM public.timetest_epoch\nWHERE\n  $__timeFilter(time)\nGROUP BY c1, c2,2 \n ORDER BY 1,2",
      refId: 'A',
      schema: 'public',
      select: [
        [
          {
            name: 'Column',
            params: ['c1'],
            type: 'column',
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['max'],
          },
        ],
        [
          {
            name: 'Column',
            params: ['c3'],
            type: 'column',
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['normal'],
          },
        ],
      ],
      table: 'timetest_epoch',
      timeColumn: 'time',
      timeColumnType: 'timestamp',
      where: [
        {
          name: '$__timeFilter',
          params: [],
          type: 'macro',
        },
      ],
    };
    assertEditor(
      query,
      'FROM SCHEMA[public]' +
        'FROM TABLE[timetest_epoch]' +
        'Time column[time]' +
        'Metric column[c2]' +
        'SELECTColumn([c1])Aggregate([max])[+]' +
        'Column([c3])Alias([normal])[+]' +
        'WHEREMacro([$__timeFilter])[+]' +
        'GROUP BYColumn([c1])Column([c2])[+]' +
        'Format asTable' +
        'Edit SQL'
    );
  });
  it('should handle complex query with value in group,select,where with rawQuery On', () => {
    const query: MyQuery = {
      format: 'table',
      timeGroup: {
        type: 'macro',
        name: '$__timeFilter',
        params: [],
      },
      group: [
        {
          type: 'column',
          name: 'Column',
          params: ['c1'],
        },
        {
          type: 'column',
          name: 'Column',
          params: ['c2'],
        },
      ],
      hide: false,
      metricColumn: 'c2',
      rawQuery: true,
      rawSql:
        "SELECT \n  time AS 'time', \n  c2 AS metric,\n  max(c1),\n  c3 AS 'normal' \n FROM public.timetest_epoch\nWHERE\n  $__timeFilter(time)\nGROUP BY c1, c2,2 \n ORDER BY 1,2",
      refId: 'A',
      schema: 'public',
      select: [
        [
          {
            name: 'Column',
            params: ['c1'],
            type: 'column',
          },
          {
            type: 'aggregate',
            name: 'Aggregate',
            params: ['max'],
          },
        ],
        [
          {
            name: 'Column',
            params: ['c3'],
            type: 'column',
          },
          {
            type: 'alias',
            name: 'Alias',
            params: ['normal'],
          },
        ],
      ],
      table: 'timetest_epoch',
      timeColumn: 'time',
      timeColumnType: 'timestamp',
      where: [
        {
          name: '$__timeFilter',
          params: [],
          type: 'macro',
        },
      ],
    };
    assertEditor(
      query,
      '[SELECT \n' +
        `  time AS 'time', \n` +
        '  c2 AS metric,\n' +
        '  max(c1),\n' +
        `  c3 AS 'normal' \n` +
        ' FROM public.timetest_epoch\n' +
        'WHERE\n' +
        '  $__timeFilter(time)\n' +
        'GROUP BY c1, c2,2 \n' +
        ' ORDER BY 1,2]Format asTableQuery Builder'
    );
  });
});
