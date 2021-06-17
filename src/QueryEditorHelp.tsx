import React from 'react';
import { QueryEditorHelpProps } from '@grafana/data';

interface Props extends QueryEditorHelpProps {}

export class QueryEditorHelp extends React.PureComponent<Props> {
  render() {
    return (
      <pre className="gf-form-pre alert alert-info">
        Time series: <br />- return column named time or time_sec (in UTC), as a unix time stamp or any sql native date
        data type. You can use the macros below. <br />- return column(s) with numeric datatype as values <br />
        Optional: <br /> &nbsp;- return column named <i>metric</i> to represent the series name. <br /> &nbsp;- If
        multiple value columns are returned the metric column is used as prefix. <br /> &nbsp;- If no column named
        metric is found the column name of the value column is used as series name <br />
        <br />
        Resultsets of time series queries need to be sorted by time.
        <br />
        <br />
        Table:
        <br />- return any set of columns <br />
        <br />
        Macros: <br />- $__time(column) -&gt; UNIX_TIMESTAMP(column) as time_sec <br />- $__timeEpoch(column) -&gt;
        UNIX_TIMESTAMP(column) as time_sec <br />- $__timeFilter(column) -&gt; column BETWEEN FROM_UNIXTIME(1492750877)
        AND FROM_UNIXTIME(1492750877) <br />- $__unixEpochFilter(column) -&gt; time_unix_epoch &gt; 1492750877 AND
        time_unix_epoch &lt; 1492750877 <br />- $__unixEpochNanoFilter(column) -&gt; column &gt;= 1494410783152415214
        AND column &lt;= 1494497183142514872 <br />- $__timeGroup(column,&apos;5m&apos;[, fillvalue]) -&gt;
        cast(cast(UNIX_TIMESTAMP(column)/(300) as signed)*300 as signed) by setting fillvalue grafana will fill in
        missing values according to the interval fillvalue can be either a literal value, NULL or previous; previous
        will fill in the previous seen value or NULL if none has been seen yet <br />-
        $__timeGroupAlias(column,&apos;5m&apos;) -&gt; cast(cast(UNIX_TIMESTAMP(column)/(300) as signed)*300 as signed)
        AS &quot;time&quot; <br />- $__unixEpochGroup(column,&apos;5m&apos;) -&gt; column DIV 300 * 300 <br />-
        $__unixEpochGroupAlias(column,&apos;5m&apos;) -&gt; column DIV 300 * 300 AS &quot;time&quot; <br />
        <br />
        Example of group by and order by with $__timeGroup:
        <br />
        SELECT <br />
        &nbsp;&nbsp;$__timeGroupAlias(timestamp_col, &apos;1h&apos;), <br />
        &nbsp;&nbsp;sum(value_double) as value <br />
        FROM yourtable <br />
        GROUP BY 1 <br />
        ORDER BY 1<br />
        <br />
        Or build your own conditionals using these macros which just return the values: <br />- $__timeFrom() -&gt;
        FROM_UNIXTIME(1492750877) <br />- $__timeTo() -&gt; FROM_UNIXTIME(1492750877) <br />- $__unixEpochFrom() -&gt;
        1492750877 <br />- $__unixEpochTo() -&gt; 1492750877 <br />- $__unixEpochNanoFrom() -&gt; 1494410783152415214{' '}
        <br />- $__unixEpochNanoTo() -&gt; 1494497183142514872
      </pre>
    );
  }
}
