export class MetaQuery {
  constructor(private target: any, private queryModel: any) {}

  // quote identifier as literal to use in metadata queries
  quoteIdentAsLiteral(value: string) {
    return this.queryModel.quoteLiteral(this.queryModel.unquoteIdentifier(value));
  }

  buildTableConstraint(table: string, schema: string) {
    let query = '';

    // check for schema qualified table
    if (table.includes('.')) {
      const parts = table.split('.');
      query = 'table_schema = ' + this.quoteIdentAsLiteral(parts[0]);
      query += ' AND table_name = ' + this.quoteIdentAsLiteral(parts[1]);
      return query;
    } else {
      query = `table_schema = ${this.quoteIdentAsLiteral(schema)} AND table_name = ${this.quoteIdentAsLiteral(table)}`;

      return query;
    }
  }

  buildSchemaQuery() {
    return 'SELECT distinct(table_schema) FROM tables';
  }

  buildTableQuery() {
    return 'SELECT table_name FROM tables WHERE table_schema = ' + this.quoteIdentAsLiteral(this.target.schema);
  }

  buildColumnQuery(type?: string) {
    let query = 'SELECT column_name FROM columns WHERE ';
    query += this.buildTableConstraint(this.target.table, this.target.schema);

    switch (type) {
      case 'time': {
        query +=
          " AND (data_type LIKE 'date%' OR data_type LIKE 'time%' OR data_type LIKE 'timestamp%' OR data_type LIKE 'timetz%' OR data_type LIKE 'timestamptz%' OR data_type LIKE 'interval%')";
        break;
      }
      case 'metric': {
        query += " AND (data_type LIKE 'long varchar%' OR data_type LIKE 'varchar%' OR data_type LIKE 'char%')";
        break;
      }
      case 'value': {
        query +=
          " AND (data_type LIKE 'double precision%' OR data_type LIKE 'float%' OR data_type LIKE 'real%' OR data_type LIKE 'int%' OR data_type LIKE 'bigint%' OR data_type LIKE 'smallint%' OR data_type LIKE 'tinyint%' OR data_type LIKE 'decimal%' OR data_type LIKE 'numeric%' OR data_type LIKE 'number%' OR data_type LIKE 'money%')";
        query += ' AND column_name <> ' + this.quoteIdentAsLiteral(this.target.timeColumn);
        break;
      }
    }

    query += ' ORDER BY column_name';

    return query;
  }
}
