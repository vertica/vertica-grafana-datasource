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
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// Regex to find the macros in the raw SQL query.
const macroPattern = `\$(__[_a-zA-Z0-9]+)`

var fillMode data.FillMode = data.FillModeNull

// Slice of macros which requires more than 1 argument.
var macrosWithMultipleArgument = []string{"__timeGroup"}

// Function to evaluate the macro function and convert it into an appropriate query syntex.
func evaluateMacro(name string, args []string, timeRange backend.TimeRange) (string, error) {

	log.DefaultLogger.Debug("Inside macros.evaluateMacro Function")

	switch name {
	case "__time":
		if len(args) == 0 {
			return "", fmt.Errorf("missing time column argument for macro %v", name)
		}
		return fmt.Sprintf("%s AS time", args[0]), nil
	case "__timeFilter":
		if len(args) == 0 {
			return "", fmt.Errorf("missing time column argument for macro %v", name)
		}
		return fmt.Sprintf("%s BETWEEN '%s' AND '%s'",
				args[0],
				time.Unix(0, timeRange.From.UnixNano()).Format(time.RFC3339Nano),
				time.Unix(0, timeRange.To.UnixNano()).Format(time.RFC3339Nano)),
			nil
	case "__timeFrom":
		log.DefaultLogger.Info("QueryData", "timeR", timeRange.From)
		if len(args) != 0 {
			return "", fmt.Errorf("macro %v should have no arguments", name)
		}
		return fmt.Sprintf("'%s'",
				time.Unix(0, timeRange.From.UnixNano()).Format(time.RFC3339Nano)),
			nil
	case "__timeTo":
		if len(args) != 0 {
			return "", fmt.Errorf("macro %v should have no arguments", name)
		}
		return fmt.Sprintf("'%s'",
				time.Unix(0, timeRange.To.UnixNano()).Format(time.RFC3339Nano)),
			nil
	case "__expandMultiString":
		if len(args) == 0 {
			return "", fmt.Errorf("missing selector argument for macro: %v", name)
		}

		var result string

		for ct := 0; ct < len(args); ct++ {
			trimmed := strings.Trim(args[ct], "{}'")
			if ct > 0 {
				result += fmt.Sprintf(",'%s'", trimmed)
			} else {
				result += fmt.Sprintf("'%s'", trimmed)
			}
		}

		return result, nil
	case "__timeGroup":
		if len(args) < 2 {
			return "", fmt.Errorf("macro %v needs time column and interval and optional fill value", name)
		}
		interval, err := ParseDuration(strings.Trim(args[1], `'`))
		if err != nil {
			return "", fmt.Errorf("error parsing interval %v", args[1])
		}
		if len(args) == 3 {
			if args[2] == "previous" {
				fillMode = data.FillModePrevious
			} else if args[2] == "NULL" {
				fillMode = data.FillModeNull
			} else if args[2] == "0" {
				fillMode = data.FillModeValue
			}
		}
		return fmt.Sprintf("floor(extract(epoch from %s)/%v)*%v as time", args[0], interval.Seconds(), interval.Seconds()), nil
	case "__unixEpochFilter":
		if len(args) == 0 {
			return "", fmt.Errorf("missing time column argument for macro %v", name)
		}
		return fmt.Sprintf("%s >= %d AND %s <= %d", args[0], timeRange.From.Unix(), args[0], timeRange.To.Unix()), nil
	default:
		return "", fmt.Errorf("undefined macro: $__%v", name)
	}
}

func replaceAllStringSubmatchFunc(re *regexp.Regexp, rawSQL string, repl func([]string) (string, error)) (string, error) {

	log.DefaultLogger.Debug("Inside macros.replaceAllStringSubmatchFunc Function")

	result := ""
	lastIndex := 0
	argLength := 0

	// Find macros and their arguments if any.
	for _, matchIndex := range re.FindAllSubmatchIndex([]byte(rawSQL), -1) {
		groups := []string{}
		// matchIndex is slice of integers that contains index of the matched groups.
		// Example: [1 3 2 5], Here "1" is the starting index of group1 and "3" is
		// ending index of group1 and so on.
		// Iterate matched groups in the rawSQL.
		for i := 0; i < len(matchIndex); i += 2 {
			groups = append(groups, rawSQL[matchIndex[i]:matchIndex[i+1]])
		}

		parenthesisCount := 1
		arg := []byte{}
		startArgIndex := matchIndex[len(matchIndex)-1] + 1
		// Check if macro has any argument or not.
		if len(rawSQL) > startArgIndex+2 {
			// Find the macro argument.
			for {
				if string(rawSQL[startArgIndex]) == ")" && parenthesisCount == 0 {
					break
				}
				arg = append(arg, rawSQL[startArgIndex])
				startArgIndex++
				if string(rawSQL[startArgIndex]) == "(" {
					parenthesisCount++
				} else if string(rawSQL[startArgIndex]) == ")" {
					parenthesisCount--
				}
			}
		}
		argLength = len(arg)
		// Add macro argument in the groups.
		groups = append(groups, string(arg))

		replacement, err := repl(groups)

		if err != nil {
			log.DefaultLogger.Error("Error while replacing the string submatches: " + err.Error())
			return "", err
		}

		// Replace the macro with the replacement.
		result += rawSQL[lastIndex:matchIndex[0]] + replacement
		// Append the remaining query after the argument.
		lastIndex = matchIndex[1] + argLength + 2
	}

	return result + rawSQL[lastIndex:], nil
}

// Function to santize and interpolate macro function in the raw sql query.
func sanitizeAndInterpolateMacros(rawSQL string, query backend.DataQuery) (string, error) {

	log.DefaultLogger.Debug("Inside macros.sanitizeAndInterpolateMacros Function")

	regex, err := regexp.Compile(macroPattern)

	if err != nil {
		log.DefaultLogger.Error("Error while compiling regex for macro: " + err.Error())
		return rawSQL, err
	}

	sql, err := replaceAllStringSubmatchFunc(regex, rawSQL, func(groups []string) (string, error) {

		var args []string

		if len(groups) > 2 && len(groups[2]) > 0 {
			if contains(macrosWithMultipleArgument, groups[1]) {
				args = strings.Split(groups[2], ",")
			} else {
				args = append(args, groups[2])
			}
			for i, arg := range args {
				args[i] = strings.Trim(arg, " ")
			}
		}

		/* TODO: check for multiple Queries */
		res, err := evaluateMacro(groups[1], args, query.TimeRange)

		if err != nil {
			return "", err
		}

		return res, err
	})

	return sql, err
}
