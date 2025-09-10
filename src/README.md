# Vertica Grafana Data Source Plugin
Vertica Grafana data source plugin allows you to query and visualize data from a Vertica database. This plugin supports features such as SSL and Native Load Balancing. This version of the plugin is updated from Angular to React framework and is a signed plugin.

To modify and build your own version of the plugin, refer to the [Setting Up Your Development Environment](https://github.com/vertica/vertica-grafana-datasource#setting-up-your-development-environment) section in this readme.

## Migrating from an Older Version of the Data Source Plugin
•	If you have an older version of the plugin with the same ID as vertica-grafana-datasource, remove the older version using grafana-cli and replace it with the new version:
	
 `grafana-cli plugins remove vertica-grafana-datasource`

Your old dashboards will work as expected after you install the new version of the plugin.

•	If your plugin ID does not match with vertica-grafana-datasource 
1.	Export your existing dashboards. 
2.	Remove the old dashboards.
3.	Install and configure the new plugin. 
4.	Import your dashboards and change the embedded data source.

## Installing the Grafana Data Source Plugin
To install the plugin, see the Installation tab in the Grafana Plugins page for Vertica.

## Adding a Data Source
To add a data source in Grafana, refer to Data Sources > Add data source in the Grafana Documentation website.

**Note:** Only users with the admin role can add data sources.

# Configuring the Vertica Grafana Data Source Plugin
After you add the Vertica data source, you need to configure it by entering the following fields and connection details:
| Name     | Description |
| -------- | ----------- |
| `Name`  | The data source name. |
| `Default`  | The data source is pre-selected for new panels. |
| `Host`  | The IP address/hostname and the port of your Vertica instance separated by colon (host:port). Do not include the database name as the connection string for connecting to Vertica may cause errors. |
| `Database`  | Name of your Vertica database. |
| `User`  | Database username. |
| `Password`  | Database user password. |
| `SSL Mode`  | Determines whether or with what priority a secure SSL TCP/IP connection will be negotiated with the server. When SSL Mode is disabled, SSL Method and Auth Details are not visible. |
| `Use Backup Server Node`  | To enable backup hosts on server side. |
| `Backup Server Node List`  | Comma delimited list of backup host:port for the client to try to connect if the primary host is unreachable. |
| `Use Vertica OAuth` | To enable OAuth connection to Vertica database. |
| `OAuth Access Token` | Use OAuth Access Token for authentication to Vertica database. |
| `Use Connection Load Balancing`  | To enable connection load balancing on the client-side.|
| `Max Open Connections` |  Maximum number of connections a user can open concurrently on individual nodes or across the database cluster.|
| `Max Ideal Connections` | Maximum number of idle connections. This number should be less than or equal to Max Open Connections. |
| `Max Connection Ideal Time` | Idle time after which the session times out. |

**Note:** 
1. The current OAuth setup only uses access token for authentication as per vertica-sql-go driver. Consider altering your token expiration time to extend token validity.
2. To enable load balancing, the server side needs to be configured. For more information, see [Connection Load Balancing](https://www.vertica.com/docs/10.1.x/HTML/Content/Authoring/AdministratorsGuide/ManagingClientConnections/LoadBalancing/ConnectionLoadBalancing.htm?tocpath=Administrator%27s%20Guide%7CManaging%20Client%20Connections%7CConnection%20Load%20Balancing%7C_____0) in the Vertica documentation.
For more information on managing client connections, see [Managing Client Connections](https://www.vertica.com/docs/11.0.x/HTML/Content/Authoring/AdministratorsGuide/ManagingClientConnections/OverviewClientConnections.htm?tocpath=Administrator%27s%20Guide%7CManaging%20Client%20Connections%7C_____0).

![Data Source Config](https://raw.githubusercontent.com/vertica/vertica-grafana-datasource/main/src/img/datasource-config.png)

## User Permission 
When you add the data source, the database user you specify must only be granted SELECT permissions on the specified database and tables you want to query. Grafana does not validate that the query is safe. The query could include any SQL statement. For example, statements like `DELETE FROM user;`  and  `DROP TABLE user;`  will be executed. We **highly** recommend you create a specific Vertica user with restricted permissions.

**Note:** The default query supplied with the data source requires dbadmin, pseudosuperuser, or sysmonitor role as it’s a system table.

For example,
```sql
SYSMONITOR TO grafana_user;
alter user grafana_user default role sysmonitor;
```
## Importing and Viewing the Vertica Performance Dashboard
To import the dashboard, 
1.	On the left panel, click the Dashboards icon, and then click **Import**.
2.	In the Import via grafana.com field, enter the **dashboard ID: 16615** and click **Load**.
![Import Dashboard](https://raw.githubusercontent.com/vertica/vertica-grafana-datasource/main/src/img/import-dashboard.png)
3.	In the Importing dashboard window, select the datasource you created and click **Import**.
![Import Dashboard Datasource](https://raw.githubusercontent.com/vertica/vertica-grafana-datasource/main/src/img/import-dashboard-datasource.png)

You can now start exploring the dashboard to monitor Vertica.

## Querying the Data Source
### Query Builder
To open the query builder, click **Panel Title**, and then click **Edit**.
You can switch to raw query mode to run SQL queries. To do this, click **Edit SQL**.
For any change in the query builder, the raw query is generated and executed. The result is displayed in the dashboard.


![Query Builder](https://raw.githubusercontent.com/vertica/vertica-grafana-datasource/main/src/img/datasource-query-builder.png)


### FROM SCHEMA, FROM TABLE, Time column, and Metric column
FROM SCHEMA - Lists schemas that are available in the database for the configured user.

FROM TABLE - Lists tables that are available in the schema you selected. To manually enter a table or view that is not available in the list, type the fully qualified name in the format schema.table, for example, `public.metrics`.

Time column - Lists columns with data types such as time, date timestamp, etc. This field is mandatory. 

Metric column - Lists columns with a text data type such as char, varchar, and long varchar. If you want to use a column with a different data type, enter the column name with a cast:  `ip::text`. This field is optional. If a value is selected, the Metric column field will be used as the series name.

### Aggregate Functions, Windows Functions, and Column (SELECT)
In the `SELECT` row, you can specify the columns and functions you want to use. By default, Column has "value" instead of the column name and the alias has the same name as column name which you can change.  

You can use Aggregate or Window Functions on the column you selected and provide aliases to these columns. If you use aggregate function, you need to group by your result set. If an aggregate or window function is already selected and you select another function for the same column, then the previous function is replaced with new one. To add more columns, click the plus button and select `Column`. Multiple value columns will be plotted as separate series in the graph panel.

### Filter data (WHERE)
To add a filter, click the plus button to the right of the `WHERE` condition. To remove the filter, click the filter and then click `Remove`. You cannot use the same query again after it is selected in the WHERE field. You can use other macros in the raw query mode (Edit SQL). 

### GROUP BY
To group by time or other columns, click the plus button to the right of the GROUP BY condition. This displays columns selected in the SELECT clause and the time column. To remove a column, click the column, and then click Remove.

### Gap filling
Grafana fills in missing values when you group by time. The time function accepts two arguments. The first argument is the time window that you want to group by, and the second argument is the value you want Grafana to fill missing items with.

### Raw Query Mode
To switch to the raw query mode, click `Edit SQL`. You can also click `Query Inspector` to view the raw query.
You can now use the new Auto-completion feature in Raw Query Mode to predict keywords in your queries as you type.
To run your query, click `Run Query`.

**Note:** If you use the raw query mode, ensure your query at minimum has `ORDER BY time` and a filter on the returned time range.


![Raw Query Mode](https://raw.githubusercontent.com/vertica/vertica-grafana-datasource/main/src/img/datasource-panel-raw-query.png)


### Disable Query
To disable a query, click the eye icon in the toolbar of the query builder. The query is not executed, and its result is removed from the dashboard.

### Data Source Help
To view the data source help, click `?` icon in the toolbar of every query row.


![Query Help](https://raw.githubusercontent.com/vertica/vertica-grafana-datasource/main/src/img/datasource-query-help.png)

## Supported Macros
Macros can be used within a query to simplify syntax and allow for dynamic parts.
| Macro Example  | Description |
| ------------- | ------------- |
| $__time(column)  | Adds an alias 'time' to the column. For example, dateColumn as time.|
| $__timeFilter(column)  | Adds time range filter on the specified column. For example, column BETWEEN '2017-04-21T05:01:17Z' AND '2017-04-21T05:01:17Z'.  |
| $__expandMultiString(variable)  | Expands single/multi-select variable so it can be used inside the 'IN' predicate.  |
| $__timeFrom()  | Replaces the expression by the start timestamp of the current active time stamp.  |
| $__timeTo()  | Replaces the expression by the end timestamp of the current active time stamp.  |
| $__unixEpochFilter(column)  | Adds time range filter on the specified column with time represented as Unix timestamp. For example, column BETWEEN 1623090232 AND 1623150232. |
| $__timeGroup(column, intervalVariable, [FillMode]) | Groups the data based on the value of interval variable. Optional parameter FillMode value decides how to fill the missing values in the data.  |
| $__timeGroup(column, intervalVariable, 0) | Same as above but missing values in the query result are replaced by 0.  |
| $__timeGroup(column, intervalVariable, NULL) | Same as above but missing values in the query result are replaced by NULL.  |
| $__timeGroup(column, intervalVariable, previous) | Same as above but missing values in the query result are replaced by previous row value.  |

## Logging
For troubleshooting, enabled logs are available in the grafana.log file. By default, the log level for grafana.log file is info. In case of any error or bug, change the log level to debug to view the debug logs.

## Known Limitations
TimeGroup macro only fills missing values in the data fetched from the Vertica database. It does not create more samples based on the selected time range and interval value.

To know more about data type limitations when using Grafana with Vertica, see [Vertica Integration with Grafana: Connection Guide](https://www.vertica.com/kb/Grafana_CG/Content/Partner/Grafana_CG.htm).
