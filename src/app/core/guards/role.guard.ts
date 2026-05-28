import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { map, take, switchMap } from 'rxjs/operators';
import { API_CONFIG } from '../services/api.config';

/**
 * PILAR 4: ROLE GUARD OPTIMIZADO
 * Valida roles y acceso a recursos específicos
 * Soporta: admin, tecnico, productor
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  // Roles permitidos en la ruta
  const rolesPermitidos = route.data['roles'] as string[] || [];
  
  return authService.getUsuario().pipe(
    take(1),
    map((usuario) => {
      if (!usuario) {
        return router.createUrlTree(['/login']);
      }

      // Verificar si el rol está permitido
      if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
        console.warn(`[ROLE GUARD] Usuario rol '${usuario.rol}' no tiene acceso. Roles permitidos: ${rolesPermitidos.join(', ')}`);
        return router.createUrlTree(['/unauthorized']);
      }

      return true;
    })
  );
};

/**
 * Guard para verificar acceso a recurso específico
 * PILAR 4: Verifica que el usuario tenga acceso al predio/inspeccion
 */
export const resourceAccessGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  const recursoId = route.paramMap.get('id');
  const recursoTipo = route.data['recursoTipo'] || 'predio';

  if (!recursoId) {
    return router.createUrlTree(['/not-found']);
  }

  return authService.getUsuario().pipe(
    take(1),
    switchMap((usuario) => {
      if (!usuario) {
        return Promise.resolve(router.createUrlTree(['/login']));
      }

      // Si es admin, tiene acceso a todo
      if (usuario.rol === 'admin') {
        return Promise.resolve(true);
      }

      // Verificar acceso específico al recurso
      return http.get<any>(
        `${API_CONFIG.CORE}/roles/verificar-acceso/${recursoId}?recurso_tipo=${recursoTipo}`
      ).pipe(
        map(response => {
          if (response.tiene_acceso) {
            return true;
          }
          console.warn(`[RESOURCE GUARD] Acceso denegado a ${recursoTipo}:${recursoId}. Razón: ${response.razon}`);
          return router.createUrlTree(['/unauthorized']);
        })
      );
    })
  );
};
