import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// 1. IMPORTANTE: Traemos a nuestro "portero"
import { authGuard } from './core/guards/auth.guard';

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

  // Redirecciones por defecto
  { path: '', redirectTo: 'landing', pathMatch: 'full' },

  // Ruta comodín (Si alguien escribe una URL que no existe, lo mandamos al landing)
  { path: '**', redirectTo: 'landing' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
