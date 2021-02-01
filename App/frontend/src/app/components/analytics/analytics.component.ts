import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from 'src/app/services/api/api.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {

  measures: any;

  //line chart temperature
  view: any [] =  [500, 200];
  temperatureResults = [];
  temperatureColor = {domain: ['#ff3030']};

  //line chart air humidity
  airHumidityResults = [];
  airHumidityColor = {domain: ['#bcd5ff']};

  //line chart soil humidity
  soilHumidityResults = [];
  soilHumidityColor = {domain: ['#703a23']};

  // area chart water level
  waterLevelResults = [];
  waterLevelColor = {domain: ['#42b0f4']};

  //line chart pump
  pumpResults = [];
  pumpColor = {domain: ['#2000c1']};

  // line chart light intensity
  lightIntensityResults = [];
  lightIntensityColor = {domain: ['#ffff00']};

  // line chart light switch
  lightSwitchResults = [];
  lightSwitchColor = {domain: ['#343434']};

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.getAnalytics();
  }

  getAnalytics(page?: string) {
    this.api.getAnalytics().subscribe(response => {
      this.measures = response;
      for(let i=0; i<this.measures.length; i++){
        this.temperatureResults.push(this.parseAnalyticsData(this.measures[i].timestamps, this.measures[i].temperatures, 'Temperature'));
        this.airHumidityResults.push(this.parseAnalyticsData(this.measures[i].timestamps, this.measures[i].air_humidities, 'Air humidity'));
        this.soilHumidityResults.push(this.parseAnalyticsData(this.measures[i].timestamps, this.measures[i].soil_humidities, 'Soil humidity'));
        this.waterLevelResults.push(this.parseAnalyticsData(this.measures[i].timestamps, this.measures[i].water_levels, 'Water level'));
        this.pumpResults.push(this.parseAnalyticsData(this.measures[i].timestamps, this.measures[i].pumps, 'Pump'));
        this.lightIntensityResults.push(this.parseAnalyticsData(this.measures[i].timestamps, this.measures[i].light_intensities, 'Light Intensity'));
        this.lightSwitchResults.push(this.parseAnalyticsData(this.measures[i].timestamps, this.measures[i].light_switchs, 'Light switch'));
      }
    });
  }

  parseAnalyticsData(xData: any, yData: any, name:string) {
    let measures = {};
    measures['name'] = name;
    measures['series'] = [];
    for(let i=0; i<yData.length; i++){
      measures['series'].push({'name': xData[i], 'value': yData[i]});
    }
    return [measures];
  }

  getSensor(id: any) {
    this.router.navigate([`sensor/${id}`]);
  }
}
