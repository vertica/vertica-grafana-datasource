package main

// Copyright (c) 2019 Micro Focus or one of its affiliates.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	// "strings"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	_ "github.com/vertica/vertica-sql-go"
)

func newDatasource() datasource.ServeOpts {
	// creates a instance manager for your plugin. The function passed
	// into `NewInstanceManger` is called when the instance is created
	// for the first time or when a datasource configuration changed.
	im := datasource.NewInstanceManager(newDataSourceInstance)
	ds := &VerticaDatasource{
		im: im,
	}

	return datasource.ServeOpts{
		QueryDataHandler:   ds,
		CheckHealthHandler: ds,
	}
}

// VerticaDatasource is an datasource used to create
// new datasource plugins with a backend.
type VerticaDatasource struct {
	im instancemgmt.InstanceManager
}

// GetVerticaDb will return the vertica db connection
// stored in the instance setting when the instance is created or update
func (v *VerticaDatasource) GetVerticaDb(pluginContext backend.PluginContext) (*sql.DB, error) {
	instance, err := v.im.Get(pluginContext)

	if err != nil {
		log.DefaultLogger.Error("getVerticaDb: %s", err)
		return nil, err
	}
	if instanceSetting, ok := instance.(*instanceSettings); ok {
		return instanceSetting.Db, nil
	}
	return nil, nil //this is added to avoid syntax error but this line will never gets executed

}

type configArgs struct {
	User                   string `json:"user"`
	Database               string `json:"database"`
	TLSMode                string `json:"tlsmode"`
	URL                    string `json:"url"`
	UseBackupServer        bool   `json:"useBackupserver"`
	BackupServerNode       string `json:"backupServerNode"`
	Port                   int    `json:"port"`
	UsePreparedStmts       bool   `json:"usePreparedStatements"`
	UseLoadBalancer        bool   `json:"useLoadBalancer"`
	MaxOpenConnections     int    `json:"maxOpenConnections"`
	MaxIdealConnections    int    `json:"maxIdealConnections"`
	MaxConnectionIdealTime int    `json:"maxConnectionIdealTime"`
}

// ConnectionURL , generates a vertica connection URL for configArgs. Requires password as input.
func (config *configArgs) ConnectionURL(password string) string {
	var tlsmode string

	if config.TLSMode == "" {
		tlsmode = "none"
	} else {
		tlsmode = config.TLSMode
	}
	
	return fmt.Sprintf("vertica://%s:%s@%s:%d/%s?use_prepared_statements=%d&connection_load_balance=%d&tlsmode=%s&backup_server_node=%s", config.User, password, config.URL, config.Port, config.Database, boolTouint8(config.UsePreparedStmts), boolTouint8(config.UseLoadBalancer), tlsmode, config.BackupServerNode)

}

type queryModel struct {
	DataSourceID string `json:"datasourceId"`
	Format       string `json:"format"`
	RawSQL       string `json:"rawSql"`
	RefID        string `json:"refId"`
}

type sqlColumn struct {
	// Name is the name of the column
	Name string

	// Type is the data type of the column.
	// This determines which row property to use
	Type string

	// TimeData contains time values (if Type == "TIME")
	TimeData []*time.Time

	// IntData contains integer values (if Type == "INTEGER")
	IntData []*int64

	// BoolData contains boolean values (if Type == "BOOLEAN")
	BoolData []*bool

	// FloatData contains float values (if Type == "FLOAT")
	FloatData []*float64

	// StringData contains string values (if Type == "STRING")
	StringData []*string
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifer).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (v *VerticaDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {

	log.DefaultLogger.Debug("Inside datasource.QueryData Function", "Query request: ", req)

	// create response struct
	response := backend.NewQueryDataResponse()

	// Vertica db conntection
	connDB, err := v.GetVerticaDb(req.PluginContext)
	if err != nil {
		log.DefaultLogger.Error("Error while connecting to the Vertica Database: " + err.Error())
		return response, err
	}

	if err = connDB.PingContext(context.Background()); err != nil {
		log.DefaultLogger.Error("Error while connecting to the Vertica Database: " + err.Error())
		return response, err
	}
	// https://golang.org/pkg/database/sql/#DBStats
	log.DefaultLogger.Debug(fmt.Sprintf("%s connection stats open connections =%d, InUse = %d, Ideal = %d", req.PluginContext.DataSourceInstanceSettings.Name, connDB.Stats().MaxOpenConnections, connDB.Stats().InUse, connDB.Stats().Idle))

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := v.query(ctx, q, connDB)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type instanceSettings struct {
	httpClient *http.Client
	Db         *sql.DB
	Name       string
}

// Create new datasource.
func newDataSourceInstance(setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	var config configArgs

	secret := setting.DecryptedSecureJSONData["password"]

	cnf := make(map[string]interface{})

	err := json.Unmarshal([]byte(setting.JSONData), &cnf)

	json.Unmarshal(setting.JSONData, &config)
	
	port := cnf["port"].(string)
	if port == "" {
		config.Port = 5433
	} else {
		config.Port, _ = strconv.Atoi(port)
	}
	connStr := config.ConnectionURL(secret)
	db, err := sql.Open("vertica", connStr)

	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(config.MaxOpenConnections)
	db.SetMaxIdleConns(config.MaxIdealConnections)
	db.SetConnMaxIdleTime(time.Minute * time.Duration(config.MaxConnectionIdealTime))
	log.DefaultLogger.Info(fmt.Sprintf("newDataSourceInstance: new instance of datasource created: %+v", setting.Name))
	return &instanceSettings{
		httpClient: &http.Client{},
		Db:         db,
		Name:       setting.Name,
	}, nil

}



// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (v *VerticaDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {

	log.DefaultLogger.Debug("Inside datasource.CheckHealth Function", "request", req)

	var status = backend.HealthStatusOk
	connDB, err := v.GetVerticaDb(req.PluginContext)

	if err != nil {
		log.DefaultLogger.Error("unable to get sql.DB connection: " + err.Error())
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}
	// https://golang.org/pkg/database/sql/#DBStats
	log.DefaultLogger.Debug(fmt.Sprintf("%s connection stats open connections =%d, InUse = %d, Ideal = %d", req.PluginContext.DataSourceInstanceSettings.Name, connDB.Stats().MaxOpenConnections, connDB.Stats().InUse, connDB.Stats().Idle))
	connection, err := connDB.Conn(ctx)

	if err != nil {
		log.DefaultLogger.Info(fmt.Sprintf("CheckHealth :connection: %s", err))
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}

	if err = connection.PingContext(context.Background()); err != nil {
		log.DefaultLogger.Error("Error while connecting to the Vertica Database: " + err.Error())
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}
	defer connection.Close()

	result, err := connection.QueryContext(ctx, "SELECT version()")

	if err != nil {
		log.DefaultLogger.Error("Health check error: " + err.Error())
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}

	defer result.Close()

	var queryResult string

	if result.Next() {
		err = result.Scan(&queryResult)
		if err != nil {
			log.DefaultLogger.Error("Health check error: " + err.Error())
			return &backend.CheckHealthResult{
				Status:  backend.HealthStatusError,
				Message: fmt.Sprintf("%s", err),
			}, nil
		}
	}

	return &backend.CheckHealthResult{
		Status:  status,
		Message: fmt.Sprintf("Successfully connected to %s", queryResult),
	}, nil
}

func (s *instanceSettings) Dispose() {
	// Called before creating a new instance to allow plugin authors
	// to cleanup.
	log.DefaultLogger.Debug("%s connection stats open connections =%d, InUse = %d, Ideal = %d", s.Name, s.Db.Stats().MaxOpenConnections, s.Db.Stats().InUse, s.Db.Stats().Idle)
	s.Db.Close()
	log.DefaultLogger.Info(fmt.Sprintf("db connections of datasource %s closed", s.Name))
}
