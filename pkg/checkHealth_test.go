package main

import (
	"context"
	"database/sql"
	"fmt"
	"reflect"
	"strings"
	"testing"

	"bou.ke/monkey"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/stretchr/testify/require"
)

func Test_CheckHealth(t *testing.T) {

	fmt.Println("Check Health Tests")

	tests := []struct {
		name           string
		ctx            context.Context
		pluginContext  backend.PluginContext
		expectedStatus *backend.CheckHealthResult
		expectingErr   error
	}{
		{
			name:          "Success in connecting the Vertica DB",
			ctx:           context.Background(),
			pluginContext: getCredentials(configArgs{User: "testUser", Database: "testDB", TLSMode: "none", URL: "testUrl", UsePreparedStmts: false, UseLoadBalancer: false}),
			expectedStatus: &backend.CheckHealthResult{
				Status:  backend.HealthStatusOk,
				Message: "Successfully connected to Vertica Analytic Database v10.1.0-0",
			},
			expectingErr: nil,
		},
		{
			name:          "Error while establishing the Connection",
			ctx:           context.Background(),
			pluginContext: getCredentials(configArgs{URL: "InvalidUrl"}),
			expectedStatus: &backend.CheckHealthResult{
				Status:  backend.HealthStatusError,
				Message: "sql: database is closed",
			},
			expectingErr: nil,
		},
	}

	v := &VerticaDatasource{}

	// Mock Database
	db, mock, err := sqlmock.New()
	mock.ExpectQuery("SELECT version()").WillReturnRows(sqlmock.NewRows([]string{"version"}).AddRow("Vertica Analytic Database v10.1.0-0"))

	monkey.UnpatchAll()

	for i, tc := range tests {

		fmt.Println("Test:", i)
		fmt.Println("Test:", tc.name)

		t.Run(tc.name, func(tt *testing.T) {

			monkey.Patch(sql.Open, func(_ string, connStr string) (*sql.DB, error) {

				if err != nil || strings.Contains(connStr, "InvalidUrl") {
					return db, sql.ErrConnDone
				}
				return db, nil
			})

			monkey.PatchInstanceMethod(reflect.TypeOf(db), "PingContext", func(_ *sql.DB, _ context.Context) error {
				return nil
			})

			healthStatus, _ := v.CheckHealth(tc.ctx, &backend.CheckHealthRequest{PluginContext: tc.pluginContext})

			if tc.expectingErr != nil {
				require.Equal(t, healthStatus.Status, backend.HealthStatusError, "Health Status should be an Error")
			} else {
				require.Equal(t, tc.expectedStatus.Status.String(), healthStatus.Status.String(), "Health Status should be matched")
				require.Equal(t, tc.expectedStatus.Message, healthStatus.Message, "Health Message should be same")

			}
		})
	}

	defer db.Close()

	monkey.UnpatchAll()
}
