import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { ApiService } from 'src/app/services/api/api.service';
import { Garden } from 'src/app/models/garden';

@Component({
  selector: 'app-gardens',
  templateUrl: './gardens.component.html',
  styleUrls: ['./gardens.component.scss']
})
export class GardensComponent implements OnInit {

  constructor(private api: ApiService, private router: Router) { }

  private gardens: Garden[];
  private inProgress: boolean;

  // pagination
  private totalItems: number;
  private itemsPerPage = 8;

  // TODO: Implement it in the correct way
  setImages() {
    for (let garden of this.gardens) {
      garden.img = `../../assets/images/garden${garden.id}.jpg`;
    }
  }

  ngOnInit() {
    this.getGardens();
  }

  getGardens(page?: string) {
    this.inProgress = true;
    this.api.getGardens(page).subscribe(response => {
      this.gardens = response.gardens;
      this.setImages();
      this.totalItems = 8*response.total_pages;
      this.inProgress = false;
    });
  }

  pageChanged(event) {
    this.getGardens(event.page);
  }

  getGarden(id: number) {
    this.router.navigate([`garden/${id}`]);
  }

  gardensForm = new FormGroup({
    name: new FormControl(''),
    description: new FormControl(''),
    latitude: new FormControl(''),
    longitude: new FormControl('')
  });

  createGarden(name: string, description: string, latitude: number, longitude: number) {
    this.api.createGarden(name, description, latitude, longitude).subscribe(response => {
      this.getGardens();
      this.gardensForm.reset();
    });
  }
}
