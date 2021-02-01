import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ApiService } from 'src/app/services/api/api.service';
import { Garden } from 'src/app/models/garden';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss']
})
export class MapsComponent implements OnInit {

  lat: number = 39.2899782;
  lng: number = -3.8303582;

  private gardens: Garden [];

  constructor(private api: ApiService, private router: Router) { }

  ngOnInit() {
    this.getCoordinates();
  }

  getCoordinates() {
    this.api.getCoordinates().subscribe(response => {
      this.gardens = response.gardens;
    });
  }

  navigateTo(id: number) {
    this.router.navigate([`garden/${id}`]);
  }

}
