package main

import (
	"fmt"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/stretchr/testify/require"
)

func Test_Macros(t *testing.T) {

	fmt.Println("Macros Sanitization Tests")

	tests := []struct {
		name          string
		rawSQL        string
		dataQuery     backend.DataQuery
		expectedQuery string
		expectingErr  error
	}{
		{
			name:          "Wrong query pass",
			rawSQL:        "test",
			dataQuery:     getDataQuery(queryModel{RawSQL: "test"}),
			expectedQuery: "test",
			expectingErr:  nil,
		},
		{
			name:          "Correct query pass",
			rawSQL:        "select * from test",
			dataQuery:     getDataQuery(queryModel{RawSQL: "select * from test"}),
			expectedQuery: "select * from test",
			expectingErr:  nil,
		},
		{
			name:          "Wrong Macro defination pass",
			rawSQL:        "select $__test(test_group)",
			dataQuery:     getDataQuery(queryModel{RawSQL: "select $__test(test_group)"}),
			expectedQuery: "",
			expectingErr:  fmt.Errorf("undefined macro: $____test"),
		},
		{
			name:          "Correct time Macro defination pass",
			rawSQL:        "select $__time(date_trunc('HOUR', current_timestamp))",
			dataQuery:     getDataQuery(queryModel{RawSQL: "select $__time(date_trunc('HOUR', current_timestamp))"}),
			expectedQuery: "select date_trunc('HOUR', current_timestamp) AS time",
			expectingErr:  nil,
		},
		{
			name:          "Correct timeFilter Macro defination pass",
			rawSQL:        "SELECT start_time FROM v_monitor.cpu_usage WHERE $__timeFilter(end_time)",
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT start_time FROM v_monitor.cpu_usage WHERE $__timeFilter(end_time)"}),
			expectedQuery: "SELECT start_time FROM v_monitor.cpu_usage WHERE end_time BETWEEN '2021-01-01T12:00:00Z' AND '2021-01-25T12:00:00Z'", // Timestamps are defined as per the Github env
			expectingErr:  nil,
		},
		{
			name:          "Correct timeFrom Macro defination pass",
			rawSQL:        "SELECT start_time FROM test_table WHERE start_time > $__timeFrom()",
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT start_time FROM test_table WHERE start_time > $__timeFrom()"}),
			expectedQuery: "SELECT start_time FROM test_table WHERE start_time > '2021-01-01T12:00:00Z'", // Timestamps are defined as per the Github env
			expectingErr:  nil,
		},
		{
			name:          "Correct timeTo Macro defination pass",
			rawSQL:        "SELECT start_time FROM test_table WHERE start_time < $__timeTo()",
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT start_time FROM test_table WHERE start_time < $__timeTo()"}),
			expectedQuery: "SELECT start_time FROM test_table WHERE start_time < '2021-01-25T12:00:00Z'", // Timestamps are defined as per the Github env
			expectingErr:  nil,
		},
		{
			name:          "Correct expandMultiString Macro defination pass",
			rawSQL:        "SELECT * FROM orders WHERE client in ($__expandMultiString('B')) ",
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT * FROM orders WHERE client in ($__expandMultiString('B')) "}),
			expectedQuery: "SELECT * FROM orders WHERE client in ('B') ",
			expectingErr:  nil,
		},
		{
			name:          "Correct unixEpochFilter Macro defination pass",
			rawSQL:        "SELECT start_time FROM test_table WHERE $__unixEpochFilter(end_time)",
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT start_time FROM test_table WHERE $__unixEpochFilter(end_time)"}),
			expectedQuery: "SELECT start_time FROM test_table WHERE end_time >= 1609502400 AND end_time <= 1611576000",
			expectingErr:  nil,
		},
		{
			name:          "Correct timeGroup Macro defination pass",
			rawSQL:        "select $__timeGroup(test_time, '1m'), avg(test_number) as 'test_number', avg(test_key) as 'test_key' from test_table GROUP BY 1 ORDER BY 1",
			dataQuery:     getDataQuery(queryModel{RawSQL: "select $__timeGroup(test_time, '1m'), avg(test_number) as 'test_number', avg(test_key) as 'test_key' from test_table GROUP BY 1 ORDER BY 1"}),
			expectedQuery: "select floor(extract(epoch from test_time)/60)*60 as time, avg(test_number) as 'test_number', avg(test_key) as 'test_key' from test_table GROUP BY 1 ORDER BY 1",
			expectingErr:  nil,
		},
		{
			name:          "Wrong timeGroup Macro defination pass",
			rawSQL:        "select $__timeGroup(test_time), avg(test_number) as 'test_number', avg(test_key) as 'test_key' from test_table GROUP BY 1 ORDER BY 1",
			dataQuery:     getDataQuery(queryModel{RawSQL: "select $__timeGroup(test_time), avg(test_number) as 'test_number', avg(test_key) as 'test_key' from test_table GROUP BY 1 ORDER BY 1"}),
			expectedQuery: "",
			expectingErr:  fmt.Errorf("macro __timeGroup needs time column and interval and optional fill value"),
		},
	}

	//v := VerticaDatasource{}

	for i, tc := range tests {
		fmt.Println("Test:", i)
		fmt.Println("Test:", tc.name)

		t.Run(tc.name, func(tt *testing.T) {

			querySQL, err := sanitizeAndInterpolateMacros(tc.rawSQL, tc.dataQuery)

			if tc.expectingErr != nil {
				require.NotNil(t, err, "Should set error if failed")
				require.Equal(t, querySQL, "", "Query sanitization should result null if wrong query has been passed")
			} else {
				require.Equal(t, tc.expectedQuery, querySQL, "After sanitization the Raw Query SQL should be same")
				require.Nil(t, err, "Correct query shouldn't throw any errors")

			}
		})
	}

}
