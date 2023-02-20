package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"testing"
	"time"
	"bou.ke/monkey"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/stretchr/testify/require"
)

func getDataQuery(targetModel queryModel) backend.DataQuery {
	jsonData, _ := json.Marshal(targetModel)
	var queryType string
	if targetModel.Format == "" || targetModel.Format == "time series" {
		queryType = "time series"
	} else {
		queryType = "table"
	}

	// Timerange will define the output of macros
	return backend.DataQuery{JSON: jsonData, QueryType: queryType, TimeRange: backend.TimeRange{From: time.Date(2021, 01, 01, 12, 00, 00, 00, time.UTC).In(time.FixedZone("UTC", 6*54*44)), To: time.Date(2021, 01, 25, 12, 00, 00, 00, time.UTC).In(time.FixedZone("UTC", 6*54*44))}}
}

func getSettings(cfg configArgs) backend.DataSourceInstanceSettings {
	jsonData, _ := json.Marshal(cfg)
	return backend.DataSourceInstanceSettings{JSONData: jsonData}
}

func getCredentials(cfg configArgs) backend.PluginContext {
	dsSettings := getSettings(cfg)
	return backend.PluginContext{DataSourceInstanceSettings: &dsSettings}
}

func Test_Query(t *testing.T) {

	fmt.Println("Query Tests")

	tests := []struct {
		name            string
		ctx             context.Context
		dataQuery       backend.DataQuery
		fieldsCount     int
		rowsPerField    int
		pluginContext   backend.PluginContext
		expectedReponse backend.DataResponse
		expectingErr    error
	}{
		{
			name:          "Wrong query pass",
			ctx:           context.Background(),
			dataQuery:     getDataQuery(queryModel{RawSQL: "test"}),
			fieldsCount:   0,
			rowsPerField:  0,
			pluginContext: getCredentials(configArgs{User: "testUser", Database: "testDB", TLSMode: "none", URL: "testurl",BackupServerNode:"host1:port1,host2:port",Port:5433, UsePreparedStmts: false, UseLoadBalancer: false,MaxOpenConnections: 2, MaxIdealConnections: 2}),
			expectedReponse: backend.DataResponse{
				Error: errors.New("sql error occurred"),
			},
			expectingErr: errors.New("sql error occurred"),
		},
		{
			name:          "Correct query pass",
			ctx:           context.Background(),
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT 1"}),
			fieldsCount:   1,
			rowsPerField:  1,
			pluginContext: getCredentials(configArgs{User: "testUser", Database: "testDB", TLSMode: "none", URL: "testurl",BackupServerNode:"host1:port1,host2:port",Port:5433, UsePreparedStmts: false, UseLoadBalancer: false, MaxOpenConnections: 2, MaxIdealConnections: 2}),
			expectedReponse: backend.DataResponse{
				Frames: data.Frames{
					data.NewFrame("response").SetMeta(&data.FrameMeta{ExecutedQueryString: "SELECT 1"}),
				},
				Error: nil,
			},
			expectingErr: nil,
		},
		{
			name:          "Correct query with result pass",
			ctx:           context.Background(),
			dataQuery:     getDataQuery(queryModel{RawSQL: "select name, value from table"}),
			fieldsCount:   2,
			rowsPerField:  2,
			pluginContext: getCredentials(configArgs{User: "testUser", Database: "testDB", TLSMode: "none", URL: "testurl",BackupServerNode:"host1:port1,host2:port",Port:5433, UsePreparedStmts: false, UseLoadBalancer: false, MaxOpenConnections: 2, MaxIdealConnections: 2}),
			expectedReponse: backend.DataResponse{
				Frames: data.Frames{
					data.NewFrame(
						"response",
						data.NewField("name", nil, []*string{}),
						data.NewField("value", nil, []*int64{}),
					).SetMeta(&data.FrameMeta{ExecutedQueryString: "select name, value from table"}),
				},
				Error: nil,
			},
			expectingErr: nil,
		},
		{
			name:          "Correct query with macros result pass",
			ctx:           context.Background(),
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT value, $__time(start_time) FROM test_table"}),
			fieldsCount:   2,
			rowsPerField:  3,
			pluginContext: getCredentials(configArgs{User: "testUser", Database: "testDB", TLSMode: "none", URL: "testurl",BackupServerNode:"host1:port1,host2:port",Port:5433, MaxOpenConnections: 2, MaxIdealConnections: 2, UsePreparedStmts: false, UseLoadBalancer: false}),
			expectedReponse: backend.DataResponse{
				Frames: data.Frames{
					data.NewFrame(
						"response",
						data.NewField("value", nil, []*string{}),
						data.NewField("start_time", nil, []*time.Time{}),
					).SetMeta(&data.FrameMeta{ExecutedQueryString: "SELECT value, start_time AS time FROM test_table"}),
				},
				Error: nil,
			},
			expectingErr: nil,
		},
	}

	v := &VerticaDatasource{}

	// Mock Database
	db, mock, err := sqlmock.New()
	mock.ExpectQuery("test").WillReturnError(errors.New("sql error occurred"))
	mock.ExpectQuery("SELECT 1").WillReturnRows(sqlmock.NewRows([]string{""}).AddRow(1))
	mock.ExpectQuery("select name, value from table").WillReturnRows(sqlmock.NewRows([]string{"name", "value"}).AddRow("a", 1).AddRow("b", 2))
	mock.ExpectQuery("SELECT value, start_time AS time FROM test_table").WillReturnRows(sqlmock.NewRows([]string{"value", "start_time"}).AddRow("a", "2021-03-05 12:00:00").AddRow("b", "2021-03-10 12:00:00").AddRow("c", "2021-03-15 12:00:00"))

	monkey.UnpatchAll()

	for _, tc := range tests {
		fmt.Println("Test Name:", tc.name)

		t.Run(tc.name, func(tt *testing.T) {
			monkey.Patch(sql.Open, func(str string, _ string) (*sql.DB, error) {
				if err != nil {
					fmt.Println("Error while connecting to database", err)
					return nil, err
				}
				return db, nil
			})

			monkey.PatchInstanceMethod(reflect.TypeOf(db), "PingContext", func(_ *sql.DB, _ context.Context) error {
				return nil
			})

			queryOutput := v.query(tc.ctx, tc.dataQuery, db)

			monkey.UnpatchAll()

			if tc.expectingErr != nil {
				require.NotNil(t, queryOutput.Error, "Should set error to response if failed")
				require.Nil(t, queryOutput.Frames, "No frames should be created if failed")
			} else {
				require.Equal(t, tc.expectedReponse.Frames[0].Meta, queryOutput.Frames[0].Meta, "Invalid Frame SQL")
				require.Len(t, queryOutput.Frames[0].Fields, tc.fieldsCount, "Invalid number of fields created ")
				require.Equal(t, tc.rowsPerField, queryOutput.Frames[0].Fields[0].Len(), "Invalid number of values in field vectors")

			}
		})
	}

}
