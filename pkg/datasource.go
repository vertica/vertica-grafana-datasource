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
	"time"

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

type configArgs struct {
	User             string `json:"user"`
	Database         string `json:"database"`
	TLSMode          string `json:"tlsmode"`
	URL              string `json:"url"`
	UsePreparedStmts bool   `json:"usePreparedStatements"`
	UseLoadBalancer  bool   `json:"useLoadBalancer"`
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

	// fetch plugin context
	pluginContext := req.PluginContext

	// Vertica db conntection
	var cfg configArgs
	json.Unmarshal([]byte(pluginContext.DataSourceInstanceSettings.JSONData), &cfg)
	password := pluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["password"]
	databaseURL := pluginContext.DataSourceInstanceSettings.URL

	connStr := fmt.Sprintf("vertica://%s:%s@%s/%s?use_prepared_statements=%d&connection_load_balance=%d&tlsmode=%s", cfg.User, password, databaseURL, cfg.Database, boolTouint8(cfg.UsePreparedStmts), boolTouint8(cfg.UseLoadBalancer), cfg.TLSMode)

	connDB, err := sql.Open("vertica", connStr)
	if err != nil {
		log.DefaultLogger.Error("Error while connecting to the Vertica Database: " + err.Error())
		return response, err
	}

	defer connDB.Close()

	if err = connDB.PingContext(context.Background()); err != nil {
		log.DefaultLogger.Error("Error while connecting to the Vertica Database: " + err.Error())
		return response, err
	}

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
}

// Create new datasource.
func newDataSourceInstance(setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &instanceSettings{
		httpClient: &http.Client{},
	}, nil
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (v *VerticaDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {

	log.DefaultLogger.Debug("Inside datasource.CheckHealth Function", "request", req)

	var status = backend.HealthStatusOk

	//Variable configArgs will take the values from UI and use them for connection
	var cfg configArgs
	json.Unmarshal([]byte(req.PluginContext.DataSourceInstanceSettings.JSONData), &cfg)
	password := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["password"]
	databaseURL := req.PluginContext.DataSourceInstanceSettings.URL

	connStr := fmt.Sprintf("vertica://%s:%s@%s/%s?use_prepared_statements=%d&connection_load_balance=%d&tlsmode=%s", cfg.User, password, databaseURL, cfg.Database, boolTouint8(cfg.UsePreparedStmts), boolTouint8(cfg.UseLoadBalancer), cfg.TLSMode)

	connDB, err := sql.Open("vertica", connStr)

	if err != nil {
		log.DefaultLogger.Error("Health check error: " + err.Error())
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}

	defer connDB.Close()

	if err = connDB.PingContext(context.Background()); err != nil {
		log.DefaultLogger.Error("Health check error: " + err.Error())
		return &backend.CheckHealthResult{
			Status:  backend.HealthStatusError,
			Message: fmt.Sprintf("%s", err),
		}, nil
	}

	result, err := connDB.Query("SELECT version()")

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
	// Called before creatinga a new instance to allow plugin authors
	// to cleanup.
}
