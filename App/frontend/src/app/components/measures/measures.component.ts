import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { PageEvent } from '@angular/material/paginator';

import { WebsocketService } from 'src/app/services/websocket/websocket.service';
import { ApiService } from 'src/app/services/api/api.service';
import { Measure } from 'src/app/models/measure';

@Component({
  selector: 'app-measures',
  templateUrl: './measures.component.html',
  styleUrls: ['./measures.component.scss']
})
export class MeasuresComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService, 
              private websocket: WebsocketService, private location: Location) { }

  private measures: Measure[];
  private sensor: string;
  private section: string;
  private inProgress: boolean;
  private totalPages: number;
  private pageSize = 12;

  private lastMeasure: Measure;
  private realtimeMeasure: Measure;

  // activate services variables
  private waterPump: boolean;
  private lightSwitch: boolean;

  // table
  displayedColumns: string[] = ['temperature', 'air_humidity', 'soil_humidity', 'light_intensity', 'water_level', 'light_switch', 'pump', 'time'];

  // linear gauge chart
  linearGaugeColor = { domain: ['#ff3030'] };
  linearGaugeResults;

  // pie chart
  view: any [] = [150, 150];
  color = { domain: ['#42b0f4'] }; 
  pieResults;

  // heat map chart
  heatMapColor = { domain: ['#703a23']};
  heatMapResults;

  // vertical bar chart
  barVerticalView: any [] = [300, 150];
  colors = { domain : ['#bfe2ff', '#ffff00'] };
  barVerticalResults;
  
  ngOnInit() {
    this.waterPump = false;
    this.lightSwitch = false;
    this.getMeasures(this.route.snapshot.params.id);
    this.websocket.onDataResponse().subscribe(message => {
      this.realtimeMeasure = {temperature: message.message.temp, air_humidity: message.message.airH, soil_humidity: message.message.soilH,
      light_intensity: message.message.luz, water_level: message.message.wLvl, pump: message.message.wPump, light_switch: message.message.led};
    });
  }

  getMeasures(id: number, page?: string) {
    if(!page){
      this.inProgress = true;
    }
    this.api.getSensor(id, page).subscribe(response => {
      this.measures = response.measures;
      this.sensor = response.sensor;
      this.section = response.section;
      this.totalPages = response.total_pages*this.pageSize;
      this.getLastMeasure(this.measures[0]);
      this.inProgress = false;
    });
  }

  getLastMeasure(measure: Measure) {
    this.lastMeasure = measure;
    this.linearGaugeResults = this.lastMeasure.temperature;
    this.pieResults = [{'name': 'Water level', 'value': this.lastMeasure.water_level}];
    this.heatMapResults = [{'name': 'Soil humidity', 'series': [ {'name': 'Last measure','value': this.lastMeasure.soil_humidity} ]}];
    this.barVerticalResults = [
      {'name': 'Air humidity', 'value': this.lastMeasure.air_humidity},
      {'name': 'Light intensity', 'value': this.lastMeasure.light_intensity}
    ];
  }

  pageChanged(event: PageEvent) {
    this.getMeasures(this.route.snapshot.params.id, `${event.pageIndex+1}`);
  }

  requestMeasure(section: any, sensor: string) {
    this.websocket.sendDataRequest(section, sensor, {'act': 1});
  }

  activateServices(section: any, sensor: string) {
    this.websocket.sendDataRequest(section, sensor, {'act': 2, wPump: this.waterPump, led: this.lightSwitch});
  }
}
