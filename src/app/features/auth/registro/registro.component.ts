import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FitoDataService } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
  standalone: false,
})
export class RegistroComponent {
  rolSeleccionado: string = 'productor';

  // Campos del formulario
  identificacion: string = '';
  nombre: string = '';
  correo: string = '';
  telefono: string = '';
  tarjetaProfesional: string = '';
  contrasena: string = '';

  // Errores de validación
  errores: { [key: string]: string } = {};

  // Estado
  registroExitoso: boolean = false;

  constructor(
    private dataService: FitoDataService,
    private authService: AuthService,
    private router: Router
  ) {}

  cambiarRol(rol: string): void {
    this.rolSeleccionado = rol;
    this.errores = {};
  }

  /** Valida que un valor contenga solo letras y espacios */
  private soloLetras(valor: string): boolean {
    return /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(valor);
  }

  /** Valida que un valor contenga solo números */
  private soloNumeros(valor: string): boolean {
    return /^[0-9]+$/.test(valor);
  }

  /** Valida formato de correo */
  private correoValido(valor: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
  }

  /** Ejecuta todas las validaciones y retorna true si pasa */
  validarFormulario(): boolean {
    this.errores = {};

    // Identificación: solo números, mínimo 6 dígitos
    if (!this.identificacion.trim()) {
      this.errores['identificacion'] = 'La identificación es obligatoria.';
    } else if (!this.soloNumeros(this.identificacion.trim())) {
      this.errores['identificacion'] = 'La identificación debe contener solo números.';
    } else if (this.identificacion.trim().length < 6) {
      this.errores['identificacion'] = 'Mínimo 6 dígitos.';
    }

    // Nombre: solo letras, mínimo 3 caracteres
    if (!this.nombre.trim()) {
      this.errores['nombre'] = 'El nombre es obligatorio.';
    } else if (!this.soloLetras(this.nombre.trim())) {
      this.errores['nombre'] = 'El nombre solo puede contener letras y espacios.';
    } else if (this.nombre.trim().length < 3) {
      this.errores['nombre'] = 'Mínimo 3 caracteres.';
    }

    // Correo: formato válido
    if (!this.correo.trim()) {
      this.errores['correo'] = 'El correo es obligatorio.';
    } else if (!this.correoValido(this.correo.trim())) {
      this.errores['correo'] = 'Ingresa un correo electrónico válido.';
    }

    // Teléfono: solo números, entre 7 y 10 dígitos
    if (!this.telefono.trim()) {
      this.errores['telefono'] = 'El teléfono es obligatorio.';
    } else if (!this.soloNumeros(this.telefono.trim())) {
      this.errores['telefono'] = 'El teléfono debe contener solo números.';
    } else if (this.telefono.trim().length < 7 || this.telefono.trim().length > 10) {
      this.errores['telefono'] = 'El teléfono debe tener entre 7 y 10 dígitos.';
    }

    // Tarjeta profesional (solo para técnicos)
    if (this.rolSeleccionado === 'tecnico') {
      if (!this.tarjetaProfesional.trim()) {
        this.errores['tarjetaProfesional'] = 'La tarjeta profesional es obligatoria para técnicos.';
      } else if (this.tarjetaProfesional.trim().length < 4) {
        this.errores['tarjetaProfesional'] = 'Mínimo 4 caracteres.';
      }
    }

    // Contraseña: mínimo 6 caracteres
    if (!this.contrasena) {
      this.errores['contrasena'] = 'La contraseña es obligatoria.';
    } else if (this.contrasena.length < 6) {
      this.errores['contrasena'] = 'La contraseña debe tener al menos 6 caracteres.';
    }

    return Object.keys(this.errores).length === 0;
  }

  registrarUsuario(event: Event): void {
    event.preventDefault();

    if (!this.validarFormulario()) {
      return;
    }

    // Registrar el usuario en el servicio de datos (mock)
    this.dataService.agregarUsuario({
      nombre: this.nombre.trim(),
      correo: this.correo.trim(),
      rol: this.rolSeleccionado as 'productor' | 'tecnico',
      estado: 'Activo',
      fechaRegistro: new Date().toISOString().split('T')[0],
      zona: this.rolSeleccionado === 'tecnico' ? 'Por asignar' : undefined,
      identificacion: this.identificacion.trim(),
      telefono: this.telefono.trim(),
      tarjetaProfesional: this.rolSeleccionado === 'tecnico' ? this.tarjetaProfesional.trim() : undefined,
    });

    // Mostrar mensaje de éxito
    this.registroExitoso = true;

    // Redirigir al login después de 2 segundos
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 2500);
  }
}
