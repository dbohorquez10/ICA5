import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * Interceptor funcional de autenticación (estilo Angular 21).
 *
 * Responsabilidades:
 *  1. Adjunta el token JWT al header `Authorization: Bearer <token>` de cada petición saliente.
 *  2. Maneja errores HTTP globalmente:
 *     - 401 (token expirado/inválido): limpia localStorage y redirige a /auth/login.
 *     - 403 (rol insuficiente): redirige a /unauthorized.
 *     - Otros errores: los propaga hacia el componente para manejo local.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const loadingService = inject(LoadingService);
  let token: string | null = null;

  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('fito_token');
  }

  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expirado o inválido: limpiar sesión local y redirigir al login
        if (isPlatformBrowser(platformId)) {
          localStorage.removeItem('fito_token');
          localStorage.removeItem('fito_user');
        }
        // Resetear el spinner para que no quede bloqueado infinitamente
        loadingService.reset();
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        // Permisos insuficientes: redirigir a la página de acceso no autorizado
        loadingService.reset();
        router.navigate(['/unauthorized']);
      }
      // Propagar el error para que los componentes puedan manejarlo localmente si necesitan
      return throwError(() => error);
    })
  );
};
