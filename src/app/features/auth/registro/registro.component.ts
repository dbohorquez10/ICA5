import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { COLOMBIA_DEPARTAMENTOS } from '../../../core/constants/colombia-regions';

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
  apellido: string = '';
  correo: string = '';
  telefono: string = '';
  tarjetaProfesional: string = '';
  contrasena: string = '';

  // Errores de validación
  errores: { [key: string]: string } = {};

  // Regionalización
  departamentoSeleccionado: string = '';
  municipioSeleccionado: string = '';
  vereda: string = '';

  departamentosMap = COLOMBIA_DEPARTAMENTOS;

  get departamentos(): string[] {
    return Object.keys(this.departamentosMap);
  }

  get municipiosDisponibles(): string[] {
    return this.departamentoSeleccionado ? this.departamentosMap[this.departamentoSeleccionado] : [];
  }

  onDepartamentoChange(): void {
    this.municipioSeleccionado = '';
  }

  // Estado
  registroExitoso: boolean = false;
  cargando: boolean = false;
  errorServidor: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  cambiarRol(rol: string): void {
    this.rolSeleccionado = rol;
    this.errores = {};
    this.errorServidor = '';
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
    } else if (this.nombre.trim().length < 2) {
      this.errores['nombre'] = 'Mínimo 2 caracteres.';
    }

    // Apellido: solo letras, mínimo 2 caracteres
    if (!this.apellido.trim()) {
      this.errores['apellido'] = 'El apellido es obligatorio.';
    } else if (!this.soloLetras(this.apellido.trim())) {
      this.errores['apellido'] = 'El apellido solo puede contener letras y espacios.';
    } else if (this.apellido.trim().length < 2) {
      this.errores['apellido'] = 'Mínimo 2 caracteres.';
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

    // Departamento
    if (!this.departamentoSeleccionado) {
      this.errores['departamento'] = 'El departamento es obligatorio.';
    }

    // Municipio
    if (!this.municipioSeleccionado) {
      this.errores['municipio'] = 'El municipio es obligatorio.';
    }

    return Object.keys(this.errores).length === 0;
  }

  registrarUsuario(event: Event): void {
    event.preventDefault();
    this.errorServidor = '';

    if (!this.validarFormulario()) {
      return;
    }

    this.cargando = true;

    // Registrar el usuario real en Supabase Auth + tabla usuarios
    this.authService.register({
      email: this.correo.trim(),
      password: this.contrasena,
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      cedula: this.identificacion.trim(),
      rol: this.rolSeleccionado,
      telefono: this.telefono.trim(),
      registro_ica: this.rolSeleccionado === 'tecnico' ? this.tarjetaProfesional.trim() : undefined,
      departamento: this.departamentoSeleccionado,
      municipio: this.municipioSeleccionado,
      vereda: this.vereda.trim() || undefined
    }).subscribe({
      next: () => {
        this.cargando = false;
        this.registroExitoso = true;

        // Redirigir al login después de 2.5 segundos
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2500);
      },
      error: (err) => {
        this.cargando = false;
        const detail = err.error?.detail || '';
        if (detail.includes('already') || detail.includes('duplicate') || detail.includes('existe')) {
          this.errorServidor = 'Ya existe una cuenta con este correo electrónico.';
        } else if (detail.includes('cedula')) {
          this.errorServidor = 'Ya existe una cuenta con esta cédula.';
        } else if (err.status === 0) {
          this.errorServidor = 'No se pudo conectar al servidor. Verifica que el backend esté activo.';
        } else {
          this.errorServidor = detail || 'Error al registrar. Intenta nuevamente.';
        }
      },
    });
  }
}
