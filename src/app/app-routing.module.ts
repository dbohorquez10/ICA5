import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// 1. IMPORTANTE: Traemos a nuestro "portero"
import { authGuard } from './core/guards/auth.guard';
import { UnauthorizedComponent } from './shared/components/unauthorized.component';
import { NotFoundComponent } from './shared/components/not-found.component';

const routes: Routes = [
  // Rutas públicas (Cualquiera puede entrar)
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'landing',
    loadChildren: () => import('./features/landing/landing.module').then((m) => m.LandingModule),
  },

  // Ruta principal protegida (Delega al LayoutModule pero pasando por el filtro)
  {
    path: 'app',
    canActivate: [authGuard], // 2. LA MAGIA: Si no hay token, no pasas de aquí
    loadChildren: () => import('./layout/layout.module').then((m) => m.LayoutModule),
  },

  // Rutas de error
  { path: 'unauthorized', component: UnauthorizedComponent },
  { path: 'not-found', component: NotFoundComponent },

  // Redirecciones por defecto
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  // Ruta comodín apunta al NotFoundComponent
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
