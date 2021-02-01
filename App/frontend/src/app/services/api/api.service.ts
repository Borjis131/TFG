import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { AuthenticationService } from 'src/app/services/authentication/authentication.service';
import { URLS } from 'src/environments/environment';
import { User } from 'src/app/models/user';

const httpOptions = {
  headers: new HttpHeaders({'Content-Type': 'application/json'})
};

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  private extractData(res: Response) {
    let body = res;
    return body || {};
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('Client error ocurred: ', error.error.message)
    } else {
      `Backend error ocurred code ${error.status}, body ${error.error}`;
    }
    return throwError(error);
  }

  getGardens(page?: string): Observable<any> {
    return this.http.get(`${URLS.gardens}?page=${page}`);
  }

  createGarden(name: string, description: string, latitude: number, longitude: number): Observable<any> {
    return this.http.post(`${URLS.gardens}`, {'name': name, 'description': description, 'latitude': latitude, 'longitude': longitude});
  }

  getGarden(id: number, page?: string): Observable<any> {
    return this.http.get(`${URLS.gardens}/${id}?page=${page}`);
  }

  getSection(id: number, page?: string): Observable<any> {
    return this.http.get(`${URLS.sections}/${id}?page=${page}`);
  }

  createSection(name: string, description: string, garden_id: number) {
    return this.http.post(`${URLS.sections}`, {'name': name, 'description': description, 'garden_id': garden_id});
  }

  getSensor(id: number, page?: string): Observable<any> {
    return this.http.get(`${URLS.sensors}/${id}?page=${page}`);
  }

  createSensor(name: string, location: string, section_id: number) {
    return this.http.post(`${URLS.sensors}`, {'name': name, 'location': location, 'section_id': section_id});
  }

  deleteSensor(id: number) {
    return this.http.delete(`${URLS.sensors}/${id}`);
  }

  getCoordinates(): Observable<any> {
    return this.http.get(`${URLS.coordinates}`);
  }

  getAnalytics(page?: string): Observable<any> {
    return this.http.get(`${URLS.analytics}?page=${page}`);
  }
}
