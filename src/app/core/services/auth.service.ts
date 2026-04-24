import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap, catchError, of } from 'rxjs';
import { API_CONFIG } from './api.config';

/**
 * Servicio de autenticación conectado al backend real.
 * Usa el endpoint /auth del ms-core-agricola vía el gateway Nginx.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<any>(null);

  private authUrl = `${API_CONFIG.CORE}/auth`;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
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
   * Login real contra el backend.
   * Si falla el backend, cae al login simulado para desarrollo.
   */
  login(rolOEmail: string, password?: string): Observable<any> {
    // Si se provee contraseña → login real
    if (password) {
      return this.http.post<any>(`${this.authUrl}/login`, {
        email: rolOEmail,
        password,
      }).pipe(
        tap((res) => this.guardarSesion(res.access_token, res.user)),
        catchError((err) => {
          console.error('Error de login:', err);
          return of(null);
        }),
      );
    }

    // Fallback: login simulado por rol (para desarrollo sin backend)
    let userData: any = {};
    if (rolOEmail === 'tecnico') {
      userData = { nombre: 'Técnico ICA', rol: 'tecnico', plan: 'Funcionario ICA' };
    } else if (rolOEmail === 'admin') {
      userData = { nombre: 'Administrador FitoGestión', rol: 'admin', plan: 'Administrador' };
    } else {
      userData = { nombre: 'Darwing Jaimes', rol: 'productor', plan: 'Premium Account' };
    }

    this.guardarSesion('sesion_activa_proto', userData);
    return of(userData);
  }

  /**
   * Registro de nuevo usuario contra el backend.
   */
  register(data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    cedula: string;
    rol?: string;
    telefono?: string;
  }): Observable<any> {
    return this.http.post(`${this.authUrl}/register`, data);
  }

  logout(): void {
    this.http.post(`${this.authUrl}/logout`, {}).subscribe({ error: () => {} });
    this.limpiarSesion();
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
  }
}
