import { NgModule } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';

import { LayoutRoutingModule } from './layout-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PanelGeneralComponent } from '../shared/components/panel-general/panel-general.component';

@NgModule({
  declarations: [DashboardComponent, PanelGeneralComponent],
  imports: [CommonModule, RouterModule, LayoutRoutingModule],
  providers: [TitleCasePipe],
})
export class LayoutModule {}
