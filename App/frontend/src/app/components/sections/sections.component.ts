import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';

import { ApiService } from 'src/app/services/api/api.service';
import { Section } from 'src/app/models/section';


@Component({
  selector: 'app-sections',
  templateUrl: './sections.component.html',
  styleUrls: ['./sections.component.scss']
})
export class SectionsComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) { }

  private sections: Section[];
  private garden: string;
  private garden_id: number;
  private inProgress: boolean;

  // pagination
  private totalItems: number;
  private itemsPerPage = 8;

  // TODO: Implement it in the correct way
  setImages() {
    for (let section of this.sections) {
      section.img = `../../assets/images/section${section.id}.jpg`;
    }
  }

  ngOnInit() {
    this.getSections(this.route.snapshot.params.id);
  }

  getSections(id: number, page?: string) {
    this.inProgress = true;
    this.api.getGarden(id, page).subscribe(response => {
      this.sections = response.sections;
      this.setImages();
      this.garden = response.garden;
      this.garden_id = response.garden_id;
      this.totalItems = 8*response.total_pages;
      this.inProgress = false;
    });
  }

  pageChanged(event) {
    this.getSections(this.route.snapshot.params.id, event.page);
  }

  getSection(id: number) {
    this.router.navigate([`section/${id}`]);
  }

  sectionsForm = new FormGroup({
    name: new FormControl(''),
    description: new FormControl('')
  });

  createSection(name: string, description: string, garden_id: number){
    this.api.createSection(name, description, garden_id).subscribe(response => {
      this.getSections(this.route.snapshot.params.id);
      this.sectionsForm.reset();
    });
  }
}
