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
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	_ "github.com/vertica/vertica-sql-go"
)

var invalidMetricColumnTypes = []string{"date", "timestamp", "timestamptz", "time", "timetz", "bigint", "int", "smallint", "mediumint", "tinyint", "double", "decimal", "float"}

// Query is primary method of handling requests.
func (v *VerticaDatasource) query(ctx context.Context, query backend.DataQuery, connDB *sql.DB) backend.DataResponse {

	log.DefaultLogger.Debug("Inside query.query Function")

	// Creating the Data response for query
	response := backend.DataResponse{}
	frame := data.NewFrame("response")

	// QueryArgs will fetch all the data of input sql query
	var queryArgs queryModel
	json.Unmarshal(query.JSON, &queryArgs)

	// Check if the timeGroup macro is present in the rawSQL or not.
	isTimeGroupMacro := strings.Contains(queryArgs.RawSQL, "$__timeGroup")

	// Assign the default fill mode value to fillMode variable.
	fillMode = data.FillModeNull

	// Log a warning if `Format` is empty.
	if queryArgs.Format == "" {
		log.DefaultLogger.Warn("Format is empty. defaulting to time series")
	}

	queryArgs.RawSQL, response.Error = sanitizeAndInterpolateMacros(queryArgs.RawSQL, query)
	log.DefaultLogger.Debug("Sanitized final raw query: " + queryArgs.RawSQL)

	if response.Error != nil {
		log.DefaultLogger.Error("Error while sanitizing the query: " + response.Error.Error())
		return response
	}

	// Excute the query
	var rows *sql.Rows
	rows, response.Error = connDB.Query(queryArgs.RawSQL)
	if response.Error != nil {
		log.DefaultLogger.Error("Error while fetching the Query Result", response.Error)
		return response
	}

	// Add sql query in the data frame
	frame.Meta = &data.FrameMeta{ExecutedQueryString: queryArgs.RawSQL}

	// Defining the columns
	columnTypes, _ := rows.ColumnTypes()
	columnCount := len(columnTypes)
	columns := make([]*sqlColumn, columnCount)

	for idx := range columns {
		columns[idx] = &sqlColumn{Name: columnTypes[idx].Name()}

		// If the column alias is metric then column type should not be from invalidMetricColumnTypes.
		if columns[idx].Name == "metric" {
			if contains(invalidMetricColumnTypes, strings.ToLower(columnTypes[idx].DatabaseTypeName())) {
				response.Error = fmt.Errorf("Column metric must be of type UNKNOWN, TEXT, VARCHAR, CHAR")
				return response
			}
		}

		if columns[idx].Name == "time" && isTimeGroupMacro {
			// If the column alias is time and macro is timeGroup, column type should be TIME.
			columns[idx].Type = "TIME"
		} else {
			switch strings.ToUpper(columnTypes[idx].DatabaseTypeName()) {
			case "INTEGER", "INT":
				columns[idx].Type = "INTEGER"
			case "REAL", "NUMERIC", "DOUBLE", "FLOAT":
				columns[idx].Type = "FLOAT"
			case "NULL", "TEXT", "BLOB", "VARCHAR", "LONG VARCHAR", "CHAR", "UUID", "VARBINARY", "LONG VARBINARY", "BINARY":
				columns[idx].Type = "STRING"
			case "TIME", "TIMESTAMP", "TIMESTAMPTZ":
				columns[idx].Type = "TIME"
			case "BOOL", "BOOLEAN":
				columns[idx].Type = "BOOLEAN"
			default:
				log.DefaultLogger.Debug(
					"Unknown database type",
					"type",
					columnTypes[idx].DatabaseTypeName(),
					"column",
					columnTypes[idx].Name(),
				)
				columns[idx].Type = "UNKNOWN"
			}
		}

	}

	// Fetching the rows
	for rows.Next() {
		values := make([]interface{}, columnCount)
		valuePointers := make([]interface{}, columnCount)

		for i := 0; i < columnCount; i++ {
			valuePointers[i] = &values[i]
		}

		if err := rows.Scan(valuePointers...); err != nil {
			log.DefaultLogger.Error("Could not scan row", "err", err)
			response.Error = err
			return response
		}

		// Storing the entries as per the dataType of Column
		for i, column := range columns {
			var intV int64
			var floatV float64
			var stringV string
			var timeV time.Time
			valueType := ""

			switch v := values[i].(type) {
			case int8, int16, int32, int64:
				valueType = "INTEGER"
				intV = v.(int64)
			case int:
				valueType = "INTEGER"
				intV = int64(v)
			case float32, float64:
				valueType = "FLOAT"
				floatV = v.(float64)
			case []byte, string:
				valueType = "STRING"
				stringV = v.(string)
			case time.Time:
				valueType = "TIME"
				timeV = v
			case nil:
				valueType = "NULL"
			default:
				log.DefaultLogger.Warn(
					"Scanned row value type was unexpected",
					"value", values[i], "type", fmt.Sprintf("%T", values[i]),
					"column", column.Name,
				)
				valueType = "UNKNOWN"
			}

			if column.Type == "UNKNOWN" && valueType != "NULL" {
				// we need to decide on a type for the column as we need to
				// fill a typed list later. Multiple types are not allowed
				if valueType == "UNKNOWN" {
					column.Type = "STRING"
				} else {
					column.Type = valueType
				}
			}

			// variable to indicate whether to explicitly set the value to null
			setNull := false

			if column.Type == "TIME" {
				var value time.Time
				var err error

				if valueType == "TIME" {
					value = timeV
				} else if valueType == "INTEGER" {
					value = time.Unix(intV, 0)
				} else if valueType == "FLOAT" {
					value = time.Unix(int64(floatV), 0)
				} else if valueType != "NULL" {
					val := fmt.Sprintf("%v", values[i])
					value, err = time.Parse(time.RFC3339, val)
					if err != nil {
						// try parsing the string as a number
						if f, err := strconv.ParseInt(val, 10, 64); err == nil {
							value = time.Unix(int64(f), 0)
						} else {
							log.DefaultLogger.Warn(
								"Could not parse (RFC3339) value to timestamp", "value", val,
							)
							setNull = true
						}
					}
				}

				if setNull || valueType == "NULL" {
					if fillMode == data.FillModePrevious {
						if len(columns[i].TimeData) >= 1 {
							value = *columns[i].TimeData[len(columns[i].TimeData)-1]
							columns[i].TimeData = append(columns[i].TimeData, &value)
						} else {
							columns[i].TimeData = append(columns[i].TimeData, nil)
						}
					} else {
						columns[i].TimeData = append(columns[i].TimeData, nil)
					}
				} else {
					columns[i].TimeData = append(columns[i].TimeData, &value)
				}
				continue
			}

			if column.Type == "INTEGER" {
				var value int64
				var err error
				if valueType == "INTEGER" {
					value = intV
				} else if valueType == "FLOAT" {
					value = int64(floatV)
				} else {
					value, err = strconv.ParseInt(string(stringV), 10, 64)
					if err != nil {
						log.DefaultLogger.Warn("Could not convert value to int", "value", stringV)
						setNull = true
					}
				}
				if setNull || valueType == "NULL" {
					if fillMode == data.FillModePrevious {
						if len(columns[i].IntData) >= 1 {
							value = *columns[i].IntData[len(columns[i].IntData)-1]
							columns[i].IntData = append(columns[i].IntData, &value)
						} else {
							columns[i].IntData = append(columns[i].IntData, nil)
						}
					} else if fillMode == data.FillModeValue {
						value = 0
						columns[i].IntData = append(columns[i].IntData, &value)
					} else {
						columns[i].IntData = append(columns[i].IntData, nil)
					}
				} else {
					columns[i].IntData = append(columns[i].IntData, &value)
				}
				continue
			}

			if column.Type == "FLOAT" {
				var value float64
				var err error

				if valueType == "FLOAT" {
					value = floatV
				} else if valueType == "INTEGER" {
					value = float64(intV)
				} else {
					value, err = strconv.ParseFloat(string(stringV), 64)

					if err != nil {
						log.DefaultLogger.Warn("Could not convert value to float", "value", stringV)
						setNull = true
					}
				}

				if setNull || valueType == "NULL" {
					if fillMode == data.FillModePrevious {
						if len(columns[i].FloatData) >= 1 {
							value = *columns[i].FloatData[len(columns[i].FloatData)-1]
							columns[i].FloatData = append(columns[i].FloatData, &value)
						} else {
							columns[i].FloatData = append(columns[i].FloatData, nil)
						}
					} else if fillMode == data.FillModeValue {
						value = 0
						columns[i].FloatData = append(columns[i].FloatData, &value)
					} else {
						columns[i].FloatData = append(columns[i].FloatData, nil)
					}
				} else {
					columns[i].FloatData = append(columns[i].FloatData, &value)
				}
				continue
			}

			if column.Type == "BOOLEAN" {
				var value bool
				var err error

				if valueType == "INTEGER" {
					value, err = strconv.ParseBool(fmt.Sprintf("%d", intV))
					if err != nil {
						log.DefaultLogger.Warn("Could not convert value to bool", "value", intV)
						setNull = true
					}
				} else if valueType == "FLOAT" {
					value, err = strconv.ParseBool(fmt.Sprintf("%f", floatV))
					if err != nil {
						log.DefaultLogger.Warn("Could not convert value to bool", "value", floatV)
						setNull = true
					}
				} else if valueType == "STRING" {
					value, err = strconv.ParseBool(stringV)
					if err != nil {
						log.DefaultLogger.Warn("Could not convert value to bool", "value", stringV)
						setNull = true
					}
				}

				if setNull || valueType == "NULL" {
					columns[i].BoolData = append(columns[i].BoolData, nil)
				} else {
					columns[i].BoolData = append(columns[i].BoolData, &value)
				}
				continue
			}

			if column.Type == "STRING" {
				var value string

				if valueType == "INTEGER" {
					value = fmt.Sprintf("%d", intV)
				} else if valueType == "FLOAT" {
					value = fmt.Sprintf("%f", floatV)
				} else {
					value = fmt.Sprintf("%v", values[i])
				}

				if valueType == "NULL" {
					if fillMode == data.FillModePrevious {
						if len(columns[i].StringData) >= 1 {
							value = *columns[i].StringData[len(columns[i].StringData)-1]
							columns[i].StringData = append(columns[i].StringData, &value)
						} else {
							columns[i].StringData = append(columns[i].StringData, nil)
						}
					} else if fillMode == data.FillModeValue {
						value = ""
						columns[i].StringData = append(columns[i].StringData, &value)
					} else {
						columns[i].StringData = append(columns[i].StringData, nil)
					}
					columns[i].StringData = append(columns[i].StringData, nil)
				} else {
					columns[i].StringData = append(columns[i].StringData, &value)
				}
				continue
			}

			columns[i].IntData = append(columns[i].IntData, nil)
			columns[i].TimeData = append(columns[i].TimeData, nil)
			columns[i].BoolData = append(columns[i].BoolData, nil)
			columns[i].FloatData = append(columns[i].FloatData, nil)
			columns[i].StringData = append(columns[i].StringData, nil)

		}

	}

	// Appending all the fetched data into Frames
	for _, column := range columns {
		switch column.Type {
		case "TIME":
			frame.Fields = append(
				frame.Fields, data.NewField(column.Name, nil, column.TimeData),
			)
		case "FLOAT":
			frame.Fields = append(
				frame.Fields, data.NewField(column.Name, nil, column.FloatData),
			)
		case "INTEGER":
			frame.Fields = append(
				frame.Fields, data.NewField(column.Name, nil, column.IntData),
			)
		case "BOOLEAN":
			frame.Fields = append(
				frame.Fields, data.NewField(column.Name, nil, column.BoolData),
			)
		default:
			frame.Fields = append(
				frame.Fields, data.NewField(column.Name, nil, column.StringData),
			)
		}
	}

	//based on the frame we can just judge the type of the frame.
	//this use full when the user writes a variable query
	if queryArgs.Format == "table" || frame.TimeSeriesSchema().Type == data.TimeSeriesTypeNot {
		response.Frames = append(response.Frames, frame)
	} else if frame.TimeSeriesSchema().Type == data.TimeSeriesTypeWide {
		response.Frames = append(response.Frames, frame)
	} else if frame.Rows() == 0 {
		response.Frames = append(response.Frames, data.NewFrame("Long"))
	} else {
		wideFrame, err := data.LongToWide(frame, nil)
		if err != nil {
			log.DefaultLogger.Error("Error while rendering the time-series data" + err.Error())
			response.Error = err
			return response
		}
		response.Frames = append(response.Frames, wideFrame)
	}

	return response
}
