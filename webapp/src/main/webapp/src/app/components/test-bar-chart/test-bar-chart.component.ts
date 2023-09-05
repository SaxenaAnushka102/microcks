/*
 * Licensed to Laurent Broudoux (the "Author") under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. Author licenses this
 * file to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { Component, OnInit, Input } from '@angular/core';
import { Router } from "@angular/router";

import { TestResult } from '../../models/test.model';

import * as d3 from 'd3';

@Component({
  selector: 'test-bar-chart',
  styleUrls: ['./test-bar-chart.component.css'],
  template: `
    <div id="testBarChart"></div>
  `
})
export class TestBarChartComponent implements OnInit {
  @Input('data')
  data: TestResult[];

  minValues: number = 10;
  displayThreshold: number = 3;

  width: number;
  height: number = 140;
  margin = {top: 5, right: 5, bottom: 5, left: 5};

  constructor(private router: Router) {
  }

  ngOnInit() {
    var maxval = 0;
    var quinte = 0;
    var minval = Number.MAX_VALUE;
    var chartData = this.data.slice(0, this.data.length).reverse()
      .map(function(item) {
        maxval = Math.max(maxval, item.elapsedTime);
        quinte = Math.max(maxval / 5, item.elapsedTime);
        minval = Math.min(minval, item.elapsedTime);
        return {
          'id' : item.id,
          'success' : item.success,
          'testDate' : new Date(item.testDate),
          'testNumber': item.testNumber,
          'elapsedTime' : item.elapsedTime
        };
      });
    if (maxval == 0){
      maxval = 1;
    }

    if (chartData.length < this.minValues) {
      const dataLength = chartData.length
      for (let i = 0; i < this.minValues - dataLength; i++) {
        chartData.unshift({
          'id' : 'empty',
          'success' : true,
          'testDate' : new Date(),
          'testNumber': 0,
          'elapsedTime' : 0
        });
      }
    }

    var height = this.height;
    var width = parseInt(d3.select('#testBarChart').style('width')) 
      - (chartData.length * (this.margin.left + this.margin.right));

    var vis = d3.select('#testBarChart').selectAll('div').data(chartData);
    vis.enter()
      .append('div').attr('class', 'test-box-container')
        .append('div').attr('class', function(d) {
          if (d.id !== 'empty') {
            if (d.success === true) {
              return "bar bar-success tooltipaware";
            } else {
              return "bar bar-failure tooltipaware";
            }
          } else {
            return "bar";
          }
        })
        .style('height', function(d) {
          if (d.elapsedTime == 0){
            d.elapsedTime = 1;
          }
          var h = d.elapsedTime * height / maxval as number;
          // Enhanced display of lower value so that they're still visible.
          if (d.elapsedTime < quinte) {
            h = d.elapsedTime * height / quinte;
          }
          return h + 'px';
        })
        .style('width', function(d) {
          //console.log('width: ' + width);
          var w = width / chartData.length as number;
          //console.log('w: ' + w);
          return w + 'px';
        })
        .attr('data-placement', 'left').attr('title', function(d) {
          return "[" + d.testDate.toISOString() + "] : " + d.elapsedTime + " ms";
        })
        .on('click', function(d) {
          document.location.href = '/#/tests/' + d.id.toString();
          //this.navigateToTest(d.id.toString());
        });

    d3.selectAll("#testBarChart > .test-box-container > .bar").each(function (d) {
      var div = document.createElement('div');
      div.setAttribute('class', 'text-center');
      if (d.testNumber != 0) {
        div.innerText = 'Test #' + d.testNumber;
      } else {
        div.innerText = '-';
      }
      this.parentNode.insertBefore(div, this.nextSibling);       
    });

    vis.exit().remove();
  }

  public navigateToTest(testId: string): void {
    this.router.navigate(['/tests', testId]);
  }
}