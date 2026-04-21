import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductorRoutingModule } from './productor-routing.module';
import { MisPrediosComponent } from './mis-predios/mis-predios.component';
import { SolicitarInspeccionComponent } from './solicitar-inspeccion/solicitar-inspeccion.component';
import { ReportesComponent } from './reportes/reportes.component';
import { CountByEstadoPipe } from '../../shared/pipes/count-by-estado-pipe';

@NgModule({
  declarations: [
    MisPrediosComponent,
    SolicitarInspeccionComponent,
    ReportesComponent,
    CountByEstadoPipe,
  ],
  imports: [CommonModule, FormsModule, ProductorRoutingModule],
})
export class ProductorModule {}
