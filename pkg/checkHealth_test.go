package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"bou.ke/monkey"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
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
			pluginContext: getCredentials(configArgs{User: "testUser", Database: "testDB", TLSMode: "none", URL: "testUrl",BackupServerNode:"host1:port1,host2:port",Port:5433, UsePreparedStmts: false, UseLoadBalancer: false, MaxOpenConnections: 2, MaxIdealConnections: 2}),
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
				Message: "sql: connection is already closed",
			},
			expectingErr: nil,
		},
	}

	v := &VerticaDatasource{}

	for i, tc := range tests {

		fmt.Println("Test:", i)
		fmt.Println("Test:", tc.name)

		t.Run(tc.name, func(tt *testing.T) {

			im := datasource.NewInstanceManager(mockDataSourceInstance)
			v.im = im
			healthStatus, _ := v.CheckHealth(tc.ctx, &backend.CheckHealthRequest{PluginContext: tc.pluginContext})

			if tc.expectingErr != nil {
				require.Equal(t, healthStatus.Status, backend.HealthStatusError, "Health Status should be an Error")
			} else {
				require.Equal(t, tc.expectedStatus.Status.String(), healthStatus.Status.String(), "Health Status should be matched")
				require.Equal(t, tc.expectedStatus.Message, healthStatus.Message, "Health Message should be same")

			}
		})
	}
	monkey.UnpatchAll()
}

func mockDataSourceInstance(setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var config configArgs

	err := json.Unmarshal(setting.JSONData, &config)
	if err != nil {
		log.DefaultLogger.Error("newDataSourceInstance : error in unmarshaler: %s", err)
	}
	if config.URL == "InvalidUrl" {
		return nil, sql.ErrConnDone
	}
	db, mock, err := sqlmock.NewWithDSN("test")
	if err != nil {
		return nil, err
	}
	mock.ExpectQuery("SELECT version()").WillReturnRows(sqlmock.NewRows([]string{"version"}).AddRow("Vertica Analytic Database v10.1.0-0"))
	db.SetMaxOpenConns(config.MaxOpenConnections)
	db.SetMaxIdleConns(config.MaxIdealConnections)
	db.SetConnMaxIdleTime(time.Minute * time.Duration(config.MaxConnectionIdealTime))
	log.DefaultLogger.Info(fmt.Sprintf("newDataSourceInstance: new instance fo datasource created: %s", setting.Name))
	return &instanceSettings{
		httpClient: &http.Client{},
		Db:         db,
		Name:       setting.Name,
	}, nil
}

// return nil, nil //this is added to avoid syntax error but this line will never gets executed
