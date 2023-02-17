import { DataQuery, DataSourceJsonData, SelectableValue } from '@grafana/data';

export interface QueryPart {
  type: string;
  params: Array<string | number>;
  name?: string;
}

export type ResultFormat = 'time_series' | 'table';
export interface MyQuery extends DataQuery {
  timeColumnType: string;
  timeGroup: QueryPart;
  timeColumn: string;
  metricColumn: string;
  group: QueryPart[];
  where: QueryPart[];
  select: QueryPart[][];
  schema: string;
  table: string;
  format: ResultFormat;
  rawQuery: boolean;
  rawSql: string;
  queryText?: string;
  hide: boolean;
}

export type PartParams = Array<{
  value: string;
  options: (() => Promise<SelectableValue<string>>) | null;
}>;

export type Part = {
  name: string;
  params: PartParams;
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  url: string;

  port?: string;

  database?: string;

  user?: string;

  tlsmode?: string;

  usePreparedStatements: boolean;

  useLoadBalancer: boolean;

  maxOpenConnections: number;

  maxIdealConnections: number;

  maxConnectionIdealTime: number;

  useBackupserver: boolean;

  backupServerNode: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  password?: string;
}

export const FIELD_TYPES = {
  URL: 'url',
  DATABASE: 'database',
  USER: 'user',
};
