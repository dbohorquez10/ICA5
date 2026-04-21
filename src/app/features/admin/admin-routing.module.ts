import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { GestionUsuariosComponent } from './gestion-usuarios/gestion-usuarios.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { GestionCatalogosComponent } from './gestion-catalogos/gestion-catalogos.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardAdminComponent },
  { path: 'usuarios', component: GestionUsuariosComponent },
  { path: 'catalogos', component: GestionCatalogosComponent },
  { path: 'configuracion', component: ConfiguracionComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
