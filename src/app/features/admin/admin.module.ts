import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminRoutingModule } from './admin-routing.module';
import { GestionUsuariosComponent } from './gestion-usuarios/gestion-usuarios.component';
import { DashboardAdminComponent } from './dashboard-admin/dashboard-admin.component';
import { ConfiguracionComponent } from './configuracion/configuracion.component';
import { GestionCatalogosComponent } from './gestion-catalogos/gestion-catalogos.component';

@NgModule({
  declarations: [
    GestionUsuariosComponent,
    DashboardAdminComponent,
    ConfiguracionComponent,
    GestionCatalogosComponent,
  ],
  imports: [CommonModule, FormsModule, AdminRoutingModule],
})
export class AdminModule {}
