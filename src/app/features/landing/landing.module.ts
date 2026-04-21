import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // IMPORTANTE
import { LandingRoutingModule } from './landing-routing.module';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [HomeComponent],
  imports: [
    CommonModule,
    RouterModule, // DEBE ESTAR AQUÍ
    LandingRoutingModule,
  ],
})
export class LandingModule {}
