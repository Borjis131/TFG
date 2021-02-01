import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from 'src/app/guards/auth.guard';
import { LoginComponent } from 'src/app/components/login/login.component';
import { GardensComponent } from 'src/app/components/gardens/gardens.component';
import { HomeComponent } from 'src/app/components/home/home.component';
import { SectionsComponent } from 'src/app/components/sections/sections.component';
import { SensorsComponent } from 'src/app/components/sensors/sensors.component';
import { MeasuresComponent } from './components/measures/measures.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { MapsComponent } from './components/maps/maps.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'gardens', component: GardensComponent, canActivate: [AuthGuard] },
  { path: 'garden/:id', component: SectionsComponent, canActivate: [AuthGuard] },
  { path: 'maps', component: MapsComponent, canActivate: [AuthGuard] },
  { path: 'section/:id', component: SensorsComponent, canActivate: [AuthGuard] },
  { path: 'sensor/:id', component: MeasuresComponent, canActivate: [AuthGuard] },
  { path: 'analytics', component: AnalyticsComponent },
  { path: '**', redirectTo: ''}
]

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule { }
