import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Componente responsable de la vista de inicio de sesión.
 * Permite a los usuarios autenticarse en el sistema seleccionando su rol.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent {
  /**
   * Inicializa el componente e inyecta los servicios requeridos.
   * @param authService Servicio central de autenticación.
   * @param router Servicio de enrutamiento para navegar tras un login exitoso.
   */
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  /**
   * Ejecuta el proceso de inicio de sesión simulado utilizando un rol específico.
   * Si es exitoso, redirige al usuario a la página principal de la aplicación.
   *
   * @param rol Identificador del rol ('tecnico' | 'productor' | 'admin').
   */
  public iniciarSesionComo(rol: string): void {
    this.authService.login(rol);
    
    if (rol === 'admin') {
      this.router.navigate(['/app/admin/dashboard']);
    } else {
      this.router.navigate(['/app/inicio']); 
    }
  }
}
