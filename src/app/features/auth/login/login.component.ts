import { Component, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Componente de inicio de sesión real con email y contraseña.
 * Autentica contra Supabase Auth vía el backend y redirige según el rol del usuario.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  mostrarPassword: boolean = false;
  cargando: boolean = false;
  errorMensaje: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  /**
   * Ejecuta el login real contra el backend.
   */
  iniciarSesion(): void {
    this.errorMensaje = '';

    if (!this.email.trim() || !this.password) {
      this.errorMensaje = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: (res) => {
        this.cargando = false;

        if (!res) {
          this.errorMensaje = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
          return;
        }

        // Redirigir según el rol del usuario
        const rol = res.user?.rol || res.rol || '';
        console.log('Login exitoso. Rol detectado:', rol);
        
        let navPromise;
        if (rol === 'admin') {
          console.log('Navegando a dashboard admin...');
          navPromise = this.router.navigate(['/app/admin/dashboard']);
        } else {
          console.log('Navegando a inicio...');
          navPromise = this.router.navigate(['/app/inicio']);
        }
        
        navPromise.then(success => {
          console.log('Navegación exitosa:', success);
          if (!success) {
          this.errorMensaje = 'La navegación fue cancelada por un guard u otra razón.';
            this.cdr.detectChanges();
          }
        }).catch(err => {
          console.error('Error en router.navigate:', err);
          this.errorMensaje = 'Error de enrutamiento: ' + err.message;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.cargando = false;
        if (err.status === 401 || err.status === 400) {
          this.errorMensaje = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
        } else if (err.status === 0) {
          this.errorMensaje = 'No se pudo conectar al servidor. Verifica que el backend esté activo.';
        } else {
          this.errorMensaje = 'Error inesperado. Intenta nuevamente.';
        }
        this.cdr.detectChanges();
      },
    });
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }
}
