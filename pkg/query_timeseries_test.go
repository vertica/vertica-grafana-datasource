package main

import (
	"context"
	"database/sql"
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

func Test_Query_Timeseries(t *testing.T) {

	fmt.Println("Query with Time Series Format Tests")

	tests := []struct {
		name            string
		ctx             context.Context
		dataQuery       backend.DataQuery
		fieldsCount     int
		pluginContext   backend.PluginContext
		expectedReponse backend.DataResponse
		expectingErr    error
	}{
		{
			name:          "Correct table query pass",
			ctx:           context.Background(),
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT name, value FROM table", Format: "table"}),
			fieldsCount:   2,
			pluginContext: getCredentials(configArgs{User: "testUser", Database: "testDB", TLSMode: "none", URL: "testurl",BackupServerNode:"host1:port1,host2:port",Port:5433,MaxOpenConnections: 2, MaxIdealConnections: 2, UsePreparedStmts: false, UseLoadBalancer: false}),
			expectedReponse: backend.DataResponse{
				Frames: data.Frames{
					data.NewFrame(
						"response",
						data.NewField("name", nil, []*string{}),
						data.NewField("value", nil, []*int64{}),
					).SetMeta(&data.FrameMeta{ExecutedQueryString: "SELECT name, value FROM table"}),
				},
				Error: nil,
			},
			expectingErr: nil,
		},
		{
			name:          "Correct timeseries query pass",
			ctx:           context.Background(),
			dataQuery:     getDataQuery(queryModel{RawSQL: "SELECT value, start_time FROM test_table", Format: "time series"}),
			fieldsCount:   2,
			pluginContext: getCredentials(configArgs{User: "testUser", Database: "testDB", TLSMode: "none", URL: "testurl",BackupServerNode:"host1:port1,host2:port",Port:5433, UsePreparedStmts: false, UseLoadBalancer: false,MaxOpenConnections: 2, MaxIdealConnections: 2}),
			expectedReponse: backend.DataResponse{
				Frames: data.Frames{
					data.NewFrame(
						"response",
						data.NewField("value", nil, []*string{}),
						data.NewField("start_time", nil, []*time.Time{}),
					).SetMeta(&data.FrameMeta{ExecutedQueryString: "SELECT value, start_time FROM test_table"}),
				},
				Error: nil,
			},
			expectingErr: nil,
		},
	}

	v := &VerticaDatasource{}
	db, mock, err := sqlmock.New()
	mock.ExpectQuery("SELECT name, value FROM table").WillReturnRows(sqlmock.NewRows([]string{"name", "value"}).AddRow("a", 1).AddRow("b", 2))

	// For timeseries data
	mockCol1 := mock.NewColumn("value").OfType("VARCHAR", "")
	mockCol2 := mock.NewColumn("start_time").OfType("TIME", time.Now().Format(time.RFC3339))
	mockRows := mock.NewRowsWithColumnDefinition(mockCol1, mockCol2).AddRow("a", time.Date(2021, 01, 05, 12, 00, 00, 00, time.UTC).In(time.FixedZone("UTC", 6*54*44)).Format(time.RFC3339)).AddRow("b", time.Date(2021, 01, 07, 12, 00, 00, 00, time.UTC).In(time.FixedZone("UTC", 6*54*44)).Format(time.RFC3339)).AddRow("c", time.Date(2021, 01, 9, 12, 00, 00, 00, time.UTC).In(time.FixedZone("UTC", 6*54*44)).Format(time.RFC3339))

	mock.ExpectQuery("SELECT value, start_time FROM test_table").WillReturnRows(mockRows)

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

			}
		})
	}

}
