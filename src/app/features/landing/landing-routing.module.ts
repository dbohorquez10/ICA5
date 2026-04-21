import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

/**
 * @description
 * Configuración de rutas exclusivas para el módulo público (Landing).
 * Implementa el patrón de carga perezosa (Lazy Loading) desde el enrutador principal.
 */
const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LandingRoutingModule {}
