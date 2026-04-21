import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs'; // <-- Esto es clave para leer Observables

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtenemos qué rol exige la ruta que intentan visitar
  const rolEsperado = route.data['rol'];

  // Leemos el flujo de datos del usuario
  return authService.getUsuario().pipe(
    take(1),
    map((usuario) => {
      // Si hay usuario y su rol coincide con el exigido por la ruta...
      if (usuario && usuario.rol === rolEsperado) {
        return true; // Lo dejamos pasar
      } else {
        // Si intenta entrar a una zona prohibida, lo devolvemos al inicio
        return router.createUrlTree(['/app/inicio']);
      }
    }),
  );
};
