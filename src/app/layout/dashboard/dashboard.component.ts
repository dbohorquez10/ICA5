import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Componente principal de la interfaz de usuario (Layout/Dashboard).
 * Gestiona el estado visual de la barra lateral, las notificaciones
 * y proporciona acceso rápido a las acciones globales como cerrar sesión.
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: false,
})
export class DashboardComponent implements OnInit {
  /**
   * Estado visual de la barra lateral.
   * `true` si la barra está colapsada (minimizada).
   */
  public sidebarColapsada: boolean = true;

  /**
   * Objeto que contiene la información del usuario autenticado en sesión.
   */
  public usuarioActual: any = null;

  /**
   * Inicializa el componente e inyecta los servicios requeridos.
   * @param authService Servicio de autenticación para obtener el estado del usuario.
   * @param router Servicio de enrutamiento para redirecciones.
   */
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Hook de inicialización.
   * Se suscribe al estado del usuario en el servicio de autenticación.
   */
  ngOnInit(): void {
    this.authService.getUsuario().subscribe((user) => {
      this.usuarioActual = user;
    });
  }

  /**
   * Alterna el estado de visibilidad (colapsado/expandido) de la barra lateral.
   */
  public toggleSidebar(): void {
    this.sidebarColapsada = !this.sidebarColapsada;
  }

  /**
   * Despliega u oculta el panel de notificaciones.
   * (Lógica pendiente de implementación).
   */
  public toggleNotificaciones(): void {
    // Lógica futura
  }

  /**
   * Cierra la sesión activa del usuario y redirige a la vista de autenticación.
   */
  public cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
