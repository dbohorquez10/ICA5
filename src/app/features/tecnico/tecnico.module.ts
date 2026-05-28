import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TecnicoRoutingModule } from './tecnico-routing.module';
import { SharedModule } from '../../shared/shared.module';

// Componentes del Técnico
import { InspeccionesComponent } from './inspecciones/inspecciones.component';
import { EjecutarInspeccionComponent } from './ejecutar-inspeccion/ejecutar-inspeccion.component';
import { HistorialInspeccionesComponent } from './historial-inspecciones/historial-inspecciones.component';

@NgModule({
  declarations: [
    InspeccionesComponent,
    EjecutarInspeccionComponent,
    HistorialInspeccionesComponent,
  ],
  imports: [CommonModule, FormsModule, TecnicoRoutingModule, SharedModule],
})
export class TecnicoModule {}
