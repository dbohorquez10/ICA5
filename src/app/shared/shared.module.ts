import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InformeFitosanitarioComponent } from './components/informe-fitosanitario/informe-fitosanitario.component';
import { ReportesComponent } from './components/reportes/reportes.component';
import { CountByEstadoPipe } from './pipes/count-by-estado-pipe';

@NgModule({
  declarations: [
    InformeFitosanitarioComponent,
    ReportesComponent,
    CountByEstadoPipe
  ],
  imports: [CommonModule],
  exports: [
    InformeFitosanitarioComponent,
    ReportesComponent,
    CountByEstadoPipe
  ]
})
export class SharedModule {}
