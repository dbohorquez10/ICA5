import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio encargado de gestionar la autenticación de la aplicación,
 * manejando el estado de la sesión, los tokens y la información del usuario actual.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /**
   * Sujeto reactivo que mantiene el estado de conexión del usuario.
   * @private
   */
  private loggedIn = new BehaviorSubject<boolean>(false);

  /**
   * Sujeto reactivo que almacena la información del usuario en sesión.
   * Inicialmente nulo.
   * @private
   */
  private currentUserSubject = new BehaviorSubject<any>(null);

  /**
   * Inicializa el servicio de autenticación y restaura la sesión si existe en el almacenamiento local.
   * @param platformId Identificador de la plataforma provisto por Angular (Browser/Server).
   */
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('fito_token');
      const savedUser = localStorage.getItem('fito_user');

      if (token && savedUser) {
        try {
          this.currentUserSubject.next(JSON.parse(savedUser));
          this.loggedIn.next(true);
        } catch (error) {
          console.error('Error al parsear el usuario del almacenamiento local', error);
        }
      }
    }
  }

  /**
   * Obtiene un observable que emite el estado actual de autenticación.
   * @returns Un observable booleano (`true` si está autenticado).
   */
  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  /**
   * Obtiene un observable con la información del usuario actualmente autenticado.
   * @returns Un observable con el objeto de usuario o nulo.
   */
  getUsuario(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Inicia sesión simulada basándose en el rol proporcionado.
   * Actualiza el almacenamiento local y notifica a los suscriptores.
   *
   * @param rolSeleccionado El rol con el cual se desea iniciar sesión (ej. 'tecnico', 'productor').
   */
  login(rolSeleccionado: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('fito_token', 'sesion_activa_proto');

      let userData = {};
      if (rolSeleccionado === 'tecnico') {
        userData = { nombre: 'Técnico ICA', rol: 'tecnico', plan: 'Funcionario ICA' };
      } else if (rolSeleccionado === 'admin') {
        userData = { nombre: 'Administrador FitoGestión', rol: 'admin', plan: 'Administrador' };
      } else {
        userData = { nombre: 'Darwing Jaimes', rol: 'productor', plan: 'Premium Account' };
      }

      localStorage.setItem('fito_user', JSON.stringify(userData));
      this.currentUserSubject.next(userData);
    }

    this.loggedIn.next(true);
  }

  /**
   * Cierra la sesión activa, limpiando el almacenamiento local
   * y reseteando los estados reactivos.
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('fito_token');
      localStorage.removeItem('fito_user');
    }
    this.currentUserSubject.next(null);
    this.loggedIn.next(false);
  }
}
