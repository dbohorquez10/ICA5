import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { FitoDataService, Notificacion } from '../../core/services/fito-data.service';

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
  private notify = inject(NotificationService);

  /**
   * Estado visual de la barra lateral.
   * `true` si la barra está colapsada (minimizada).
   */
  public sidebarColapsada: boolean = true;

  public showNotificaciones = false;
  public notificaciones: Notificacion[] = [];
  public noLeidas: number = 0;

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
    private dataService: FitoDataService
  ) {}

  /**
   * Hook de inicialización.
   * Se suscribe al estado del usuario en el servicio de autenticación.
   */
  ngOnInit(): void {
    this.authService.getUsuario().subscribe((user) => {
      this.usuarioActual = user;
      if (user && user.id) {
        this.cargarNotificaciones();
      }
    });
  }

  public cargarNotificaciones(): void {
    if (!this.usuarioActual?.id) return;
    this.dataService.getNotificaciones(this.usuarioActual.id).subscribe({
      next: (nots) => {
        this.notificaciones = nots || [];
        this.noLeidas = this.notificaciones.filter(n => !n.leido).length;
      },
      error: (err) => console.error('Error cargando notificaciones:', err)
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
   */
  public toggleNotificaciones(): void {
    this.showNotificaciones = !this.showNotificaciones;
    if (this.showNotificaciones) {
      this.cargarNotificaciones();
    }
  }

  public marcarComoLeida(notif: Notificacion, event: Event): void {
    event.stopPropagation();
    if (notif.leido) return;
    this.dataService.marcarNotificacionComoLeida(notif.id).subscribe({
      next: () => {
        notif.leido = true;
        this.noLeidas = this.notificaciones.filter(n => !n.leido).length;
      }
    });
  }

  /**
   * Cierra la sesión activa del usuario y redirige a la vista de autenticación.
   */
  public cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
