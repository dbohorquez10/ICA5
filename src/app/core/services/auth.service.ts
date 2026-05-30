import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap, catchError, of, throwError } from 'rxjs';
import { API_CONFIG } from './api.config';
import { InspectionService } from './inspection.service';

/**
 * Servicio de autenticación conectado al backend real.
 * Usa el endpoint /auth del ms-core-agricola vía el gateway Nginx.
 * Autentica contra Supabase Auth y gestiona la sesión local (JWT + perfil).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<any>(null);

  private authUrl = `${API_CONFIG.CORE}/auth`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private inspectionService: InspectionService,
  ) {
    // Restaurar sesión desde localStorage al iniciar
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('fito_token');
      const savedUser = localStorage.getItem('fito_user');
      if (token && savedUser) {
        try {
          this.currentUserSubject.next(JSON.parse(savedUser));
          this.loggedIn.next(true);
        } catch {
          this.limpiarSesion();
        }
      }
    }
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  getUsuario(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  getUsuarioActual(): any {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('fito_token');
    }
    return null;
  }

  /**
   * Login real contra el backend con email y contraseña.
   * Autentica vía Supabase Auth y retorna el JWT + perfil del usuario.
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.authUrl}/login`, {
      email,
      password,
    }).pipe(
      tap((res) => {
        if (res && res.access_token) {
          this.guardarSesion(res.access_token, res.user);
        }
      }),
      catchError((err) => {
        console.error('Error de login:', err);
        // Retornar throwError para que el componente lo capture en el callback de error
        return throwError(() => err);
      }),
    );
  }

  /**
   * Registro de nuevo usuario contra el backend.
   * Crea el usuario en Supabase Auth + tabla usuarios.
   */
  register(data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    cedula: string;
    rol?: string;
    telefono?: string;
    registro_ica?: string;
    departamento?: string;
    municipio?: string;
    vereda?: string;
  }): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, data);
  }

  /**
   * Registro de un administrador. Requiere que el usuario actual sea admin.
   * Envía el JWT del admin actual en el header para autorización.
   */
  registerAdmin(data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    cedula: string;
    telefono?: string;
    departamento?: string;
    municipio?: string;
    vereda?: string;
  }): Observable<any> {
    // No se pasan headers manuales — el authInterceptor adjunta el token automáticamente
    return this.http.post(`${this.authUrl}/register`, {
      ...data,
      rol: 'admin',
    });
  }

  logout(): void {
    // 1. Capturar el token ANTES de limpiar la sesión local
    const token = this.getToken();
    // 2. Limpiar sesión local inmediatamente para respuesta ágil en la UI
    this.limpiarSesion();
    // 3. Revocar el JWT en el servidor usando el token capturado (en header manual)
    if (token) {
      this.http.post(`${this.authUrl}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).subscribe({ error: () => {} });
    }
  }

  private guardarSesion(token: string, user: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('fito_token', token);
      localStorage.setItem('fito_user', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
    this.loggedIn.next(true);
  }

  private limpiarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('fito_token');
      localStorage.removeItem('fito_user');
    }
    this.currentUserSubject.next(null);
    this.loggedIn.next(false);
    // Limpiar datos cacheados del InspectionService para evitar stale data en la próxima sesión
    this.inspectionService.resetState();
  }
}
