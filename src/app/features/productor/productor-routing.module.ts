import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importaciones EXACTAS
import { MisPrediosComponent } from './mis-predios/mis-predios.component';
import { SolicitarInspeccionComponent } from './solicitar-inspeccion/solicitar-inspeccion.component';
import { ReportesComponent } from '../../shared/components/reportes/reportes.component';

const routes: Routes = [
  { path: 'mis-predios', component: MisPrediosComponent },
  { path: 'solicitar', component: SolicitarInspeccionComponent },
  { path: 'reportes', component: ReportesComponent },
  { path: '', redirectTo: 'mis-predios', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductorRoutingModule {}
