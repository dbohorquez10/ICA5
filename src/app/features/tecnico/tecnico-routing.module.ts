import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Solo importamos inspecciones. ¡Adiós al dashboard del técnico!
import { InspeccionesComponent } from './inspecciones/inspecciones.component';
import { EjecutarInspeccionComponent } from './ejecutar-inspeccion/ejecutar-inspeccion.component';
import { HistorialInspeccionesComponent } from './historial-inspecciones/historial-inspecciones.component';

const routes: Routes = [
  { path: 'inspecciones', component: InspeccionesComponent },
  { path: 'ejecutar-inspeccion', component: EjecutarInspeccionComponent },
  { path: 'historial-inspecciones', component: HistorialInspeccionesComponent },
  // Si alguien intenta entrar a dashboard o a la raíz, lo mandamos a inspecciones
  { path: 'dashboard', redirectTo: 'inspecciones', pathMatch: 'full' },
  { path: '', redirectTo: 'inspecciones', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TecnicoRoutingModule {}
