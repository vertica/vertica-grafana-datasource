# Vertica data source
Vertica data source plugin allows you to query and visualize data from a Vertica database. This topic explains options, variables, querying, and other options specific to this data source. For instructions about how to add a data source to Grafana, refer to [Add a data source](https://grafana.com/docs/grafana/v7.5/datasources/add-a-data-source/). Only users with the organization admin role can add data sources.
## Prerequisite 
* [Grafana](https://grafana.com/docs/grafana/latest/installation/) (version >=7.5.5)
* [Vertica](https://www.vertica.com/download/vertica/) 
* [NodeJS](https://nodejs.org/en/download/package-manager/) (version >=14) (Package Manager: [yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable)) 
* [Go](https://golang.org/doc/install) 
* [Mage](https://magefile.org/)

**Note:** This plugin is tested in **Linux(Ubuntu)** with below versions:

* Grafana - v7.5.5 and v8.0.1
* NodeJS - v16.1.0
* Yarn - v1.22.5
* Npm - v7.11.2
* Go - v1.6.2
 
## Installation 
1. If you have the older version of the vertica grafana plugin then please remove it using grafana-cli first.
    ```
    grafana-cli plugins remove vertica-grafana-datasource
    ```

2. Clone the new Vertica grafana datasource repository into grafana plugin directory. 

3. Go to vertica plugin folder. 

4. Steps to build the plugin. 
   1. Install dependencies 
   
       ```bash 
          yarn install 
       ``` 
   2. Build plugin in production mode 
   
       ```bash 
          yarn build 
       ``` 
   3. Build backend plugin binaries for Linux, Windows, and Darwin 
   
       ```bash
          mage -v
       ```

5. Restart the grafana server.

## Logging

- Backend logging is enabled logs are present inside the grafana.log file. By default the log level for grafana.log file is info. In case of any error/bug, change the log level to debug to see the debug logs.

## Vertica settings
To access Vertica settings, hover your mouse over the **Configuration** (gear) icon, then click **Data Sources**, and then click the Vertica data source.

| Name     | Description |
| -------- | ----------- |
| `Name`  | The data source name. This is how you refer to the data source in panels and queries. |
| `Default`  | Default data source means that it will be pre-selected for new panels. |
| `Host`  | The IP address/hostname and optional port of your Vertica instance. _Do not_ include the database name. The connection string for connecting to Vertica will not be correct and it may cause errors. |
| `Database`  | Name of your Vertica database. |
| `User`  | Database user's login/username |
| `Password`  | Database user's password |
| `SSL Mode`  | Determines whether or with what priority a secure SSL TCP/IP connection will be negotiated with the server. When SSL Mode is disabled, SSL Method and Auth Details would not be visible. |
| `Load balancing`  | Determines whether to enable connection load balancing on the client-side. |

### Database user permissions (Important!)

The database user you specify when you add the data source should only be granted SELECT permissions on the specified database and tables you want to query. Grafana does not validate that the query is safe. The query could include any SQL statement. For example, statements like  `DELETE FROM user;`  and  `DROP TABLE user;`  would be executed. To protect against this we  **highly**  recommend you create a specific Vertica user with restricted permissions.

Example:
```sql
CREATE USER grafanareader WITH PASSWORD 'password';
GRANT USAGE ON SCHEMA schema TO grafanareader;
GRANT SELECT ON schema.table TO grafanareader;
```

Make sure the user does not get any unwanted privileges from the public role.

## Query Editor
You find the Vertica query editor in the metrics tab in Graph or Singlestat panel's edit mode. You can enter edit mode by clicking the panel title, then edit.

The query editor has a link named `Edit SQL`, while in panel edit mode. Click on it and it will switch to raw query editor mode and show the raw interpolated SQL string that was executed. On every change in query builder, the raw query is generated and executed and based on that results are shown in the dashboard.

### Select schema, table, time column and metric column (FROM SCHEMA)
In the FROM SCHEMA field, Grafana will suggest schemas that are available in the database for the configured user.

In the FROM TABLE field, Grafana will suggest tables that are available in the schema selected by user. To select a table or view not available in the dropdown, you can manually enter a fully qualified name (schema.table) like  `public.metrics`.

The Time column field refers to the name of the column holding your time values. The time column suggestions will only contain columns having data types like time, date timestamp etc. Selecting a value for the Time column field is mandatory. Selecting a value for the Metric column field is optional. If a value is selected, the Metric column field will be used as the series name.

The metric column suggestions will only contain columns with a text datatype (char,varchar,long varchar). If you want to use a column with a different datatype as metric column you may enter the column name with a cast:  `ip::text`.

### Columns, window, and aggregation functions (SELECT)
In the  `SELECT`  row you can specify what columns and functions you want to use. By default, column will have "value" instead of column name. By default, the alias will have the same name which is present as column name, which is changeable by user. By default, we will not be having anything selected in the WHERE and GROUP section.

You can use aggregate or window functions on the column selected and also provide aliases to them. If you use aggregate function, then you need to group by your result set. If one aggregate or window function is already selected within SELECT section and user selects another function for the same column, then the older function is replaced with new one.

You may add further value columns by clicking the plus button and selecting `Column` from the menu. Multiple value columns will be plotted as separate series in the graph panel.

### Filter data (WHERE)

To add a filter click the plus icon to the right of the  `WHERE`  condition. You can remove filters by clicking on the filter and selecting  `Remove`. Once the macro is selected in query builder in WHERE section, it cannot be used again in the same query. We will be having support of $__timeFilter macro in WHERE section dropdown. Other macros can be used in the raw query mode. We will populate the dropdown for value column with columns having number like data types.

### Group by

To group by time or any other columns click the plus icon at the end of the GROUP BY row. The suggestion dropdown will only columns selected in the SELECT clause along with the time column. You can remove the group by clicking on the item and then selecting  `Remove`.

### Gap filling

Grafana can fill in missing values when you group by time. The time function accepts two arguments. The first argument is the time window that you would like to group by, and the second argument is the value you want Grafana to fill missing items with.

### Text editor mode (RAW)
You can switch to the raw query editor mode by clicking `Edit SQL` below the query. We can also view the raw query by clicking on the `Query Inspector` and selecting the `Query` tab.

> If you use the raw query editor, be sure your query at minimum has `ORDER BY time` and a filter on the returned time range.

### Disable Query
When user clicks on "eye" icon in toolbar of query builder to disable it, then that query is not executed and its result is removed from the dashboard.

### Data source help
You can toggle the data source help while working with dashboards by clicking on the "?" icon within the toolbar of every query row.

## Supported Macros

| Macro Example  | Description |
| ------------- | ------------- |
| $__time(column)  | Add an alias 'time' to the column. Example: dateColumn as time|
| $__timeFilter(column)  | Add time range filter on specified column. Example: column BETWEEN '2017-04-21T05:01:17Z' AND '2017-04-21T05:01:17Z'  |
| $__expandMultiString(variable)  | Expand single/multi-select variable so it can be used inside of 'IN' predicate  |
| $__timeFrom()  | Replace the expression by the start timestamp of the current active time stamp.  |
| $__timeTo()  | Replace the expression by the end timestamp of the current active time stamp.  |
| $__unixEpochFilter(column)  | Add time range filter on specified column with times represented as Unix timestamp. Example: column BETWEEN 1623090232 AND 1623150232 |
| $__timeGroup(column, intervalVariable, [FillMode]) | Group the data based on value of interval variable. Optional parameter FillMode value decide how to fill the missing values in the data.  |
| $__timeGroup(column, intervalVariable, 0) | Same as above but missing values in the query result will be replaced by 0.  |
| $__timeGroup(column, intervalVariable, NULL) | Same as above but missing values in the query result will be replaced by NULL.  |
| $__timeGroup(column, intervalVariable, previous) | Same as above but missing values in the query result will be replaced by previous row value.  |

## Changes in UI/functionality from the old plugin
* The info icon exists on the label instead of the Select component in the configuration screen. 
* As the Checkbox component was appearing on the left, we have made use of the switch component for configuring the use of prepared statements in configuration screen.
* The existing QueryField component used to configure queries in the dashboard screen does not have color highlighting as per the syntax and also does not have auto-suggest functionality as we type the query.
* The existing Label component has text within white color instead of theme's blue color.
* The new plugin has made use of the existing health check API to test the datasource connection in the configuration screen instead of invoking the query API to avoid using the TimeSrv interface from @grafana/runtime package
* The query will not be auto-run when the query editor is focused and user presses Cmd + S or Ctrl + S, as the existing QueryField component does not have support for it.
* Time column validation for timeseries query format is not present in the new plugin.
* The prepared statement functionality is hidden in the new plugin, as no meaningful use-case could be determined for it.
* The vertica plugin will use the "?" icon within toolbar over query builder to show the help.
* The vertica plugin will use the Query Inspector to get the raw query generated from query builder. User can also use the "Edit SQL" button to switch to raw query mode.

## Known Limitations
* TimeGroup macro only fills the missing values in the data fetched from the vertica database, it is not creating more samples based on selected time range and interval value like postgres datasource.