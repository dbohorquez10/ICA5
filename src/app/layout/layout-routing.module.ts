import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PanelGeneralComponent } from '../shared/components/panel-general/panel-general.component';
import { roleGuard } from '../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: 'inicio', component: PanelGeneralComponent },
      {
        path: 'productor',
        canActivate: [roleGuard],
        data: { rol: 'productor' },
        loadChildren: () =>
          import('../features/productor/productor.module').then((m) => m.ProductorModule),
      },
      {
        path: 'tecnico',
        canActivate: [roleGuard],
        data: { rol: 'tecnico' },
        loadChildren: () =>
          import('../features/tecnico/tecnico.module').then((m) => m.TecnicoModule),
      },
      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { rol: 'admin' },
        loadChildren: () =>
          import('../features/admin/admin.module').then((m) => m.AdminModule),
      },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
