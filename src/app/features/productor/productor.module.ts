import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductorRoutingModule } from './productor-routing.module';
import { MisPrediosComponent } from './mis-predios/mis-predios.component';
import { SolicitarInspeccionComponent } from './solicitar-inspeccion/solicitar-inspeccion.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    MisPrediosComponent,
    SolicitarInspeccionComponent,
  ],
  imports: [CommonModule, FormsModule, ProductorRoutingModule, SharedModule],
})
export class ProductorModule {}
