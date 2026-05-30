import { Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { FitoDataService, Usuario } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { COLOMBIA_DEPARTAMENTOS } from '../../../core/constants/colombia-regions';

/**
 * Gestiona el listado, filtrado y administración de usuarios del sistema FitoGestión.
 * Permite a los administradores crear nuevas cuentas de administrador.
 */
@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.css'],
  standalone: false
})
export class GestionUsuariosComponent implements OnInit {
  private notify = inject(NotificationService);

  public usuarios: Usuario[] = [];
  public filtro: string = '';
  public rolFiltro: string = 'todos';

  public modalVisible = false;
  public modalModo: 'ver' | 'editar' = 'ver';
  public usuarioSeleccionado: Usuario | null = null;
  public editDatos: Partial<Usuario> = {};

  // Catálogo de regionalización
  public departamentosMap = COLOMBIA_DEPARTAMENTOS;

  get departamentos(): string[] {
    return Object.keys(this.departamentosMap);
  }

  // Modal crear admin
  public crearAdminVisible = false;
  public adminForm = {
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    password: '',
    telefono: '',
    departamento: '',
    municipio: '',
    vereda: '',
  };
  public adminCreando = false;
  public adminError = '';
  public adminExito = false;

  constructor(
    private dataService: FitoDataService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    if (this.authService.getUsuarioActual()) {
      this.cargarUsuarios();
    }
  }

  private cargarUsuarios(): void {
    const admin = this.authService.getUsuarioActual();
    if (!admin) return;
    const adminDep = admin?.departamento || '';

    this.dataService.getUsuarios().subscribe(data => {
      // Filtrar usuarios si el admin logueado pertenece a una región específica, pero mostrar siempre a otros admins
      if (adminDep) {
        this.usuarios = data.filter(u => u.departamento === adminDep || u.rol === 'admin');
      } else {
        this.usuarios = data;
      }
    });
  }

  get usuariosFiltrados(): Usuario[] {
    return this.usuarios.filter(u => {
      const termino = this.filtro.toLowerCase().trim();
      const matchTexto = !termino ||
        u.nombre.toLowerCase().includes(termino) ||
        (u.apellido || '').toLowerCase().includes(termino) ||
        (u.email || u.correo || '').toLowerCase().includes(termino) ||
        (u.cedula || u.identificacion || '').includes(termino) ||
        (u.telefono || '').includes(termino);
      const matchRol = this.rolFiltro === 'todos' || u.rol === this.rolFiltro;
      return matchTexto && matchRol;
    });
  }

  public getIniciales(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  public getNombreCompleto(u: Usuario): string {
    return u.apellido ? `${u.nombre} ${u.apellido}` : u.nombre;
  }

  public getEmail(u: Usuario): string {
    return u.email || u.correo || '—';
  }

  public getIdentificacion(u: Usuario): string {
    return u.cedula || u.identificacion || '—';
  }

  public getFechaRegistro(u: Usuario): string {
    if (u.created_at) {
      return new Date(u.created_at as any).toLocaleDateString('es-CO');
    }
    return u.fechaRegistro || '—';
  }

  public getEstado(u: Usuario): string {
    if (u.activo === false) return 'Suspendido';
    if (u.activo === true) return 'Activo';
    return u.estado || 'Activo';
  }

  public getRolLabel(u: Usuario): string {
    switch (u.rol) {
      case 'admin': return 'Administrador';
      case 'tecnico': return 'Técnico ICA';
      case 'productor': return 'Productor';
      default: return u.rol;
    }
  }

  public getRolIcon(u: Usuario): string {
    switch (u.rol) {
      case 'admin': return 'admin_panel_settings';
      case 'tecnico': return 'fact_check';
      case 'productor': return 'agriculture';
      default: return 'person';
    }
  }

  public toggleSuspender(usuario: Usuario): void {
    const estaActivo = this.getEstado(usuario) === 'Activo';
    const accion = estaActivo ? 'suspender' : 'reactivar';
    if (confirm(`¿Deseas ${accion} la cuenta de ${this.getNombreCompleto(usuario)}?`)) {
      this.dataService.suspenderUsuario(usuario.id).subscribe(() => this.cargarUsuarios());
    }
  }

  public eliminar(usuario: Usuario): void {
    if (confirm(`¿Eliminar permanentemente la cuenta de ${this.getNombreCompleto(usuario)}?`)) {
      this.dataService.eliminarUsuario(usuario.id).subscribe(() => this.cargarUsuarios());
    }
  }

  public verDetalle(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.modalModo = 'ver';
    this.modalVisible = true;
  }

  public editarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.editDatos = { ...usuario };
    this.modalModo = 'editar';
    this.modalVisible = true;
  }

  public getEditMunicipiosDisponibles(): string[] {
    const dep = this.editDatos.departamento;
    return dep ? this.departamentosMap[dep] || [] : [];
  }

  public onEditDepartamentoChange(): void {
    this.editDatos.municipio = '';
  }

  public guardarEdicion(): void {
    if (!this.editDatos.nombre?.trim()) { this.notify.showError('El nombre es obligatorio.'); return; }
    if (!this.editDatos.departamento) { this.notify.showError('El departamento es obligatorio.'); return; }
    if (!this.editDatos.municipio) { this.notify.showError('El municipio es obligatorio.'); return; }

    if (this.usuarioSeleccionado) {
      this.dataService.editarUsuario(this.usuarioSeleccionado.id, {
        nombre: this.editDatos.nombre?.trim(),
        email: this.editDatos.email?.trim() || this.editDatos.correo?.trim(),
        telefono: this.editDatos.telefono?.trim(),
        registro_ica: this.editDatos.rol === 'tecnico' ? this.editDatos.registro_ica?.trim() : undefined,
        departamento: this.editDatos.departamento,
        municipio: this.editDatos.municipio,
        vereda: this.editDatos.vereda?.trim() || undefined
      } as any).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModal();
        },
        error: (err) => {
          console.error('Error al guardar edición de usuario:', err);
          this.notify.showError('Hubo un error al guardar los cambios.');
        }
      });
    } else {
      this.cerrarModal();
    }
  }

  public cerrarModal(): void {
    this.modalVisible = false;
    this.usuarioSeleccionado = null;
  }

  // ── Crear Admin ────────────────────────────────────────────────────────────

  public getAdminMunicipiosDisponibles(): string[] {
    const dep = this.adminForm.departamento;
    return dep ? this.departamentosMap[dep] || [] : [];
  }

  public onAdminDepartamentoChange(): void {
    this.adminForm.municipio = '';
  }

  public abrirCrearAdmin(): void {
    this.crearAdminVisible = true;
    this.adminError = '';
    this.adminExito = false;
    this.adminForm = {
      nombre: '',
      apellido: '',
      cedula: '',
      email: '',
      password: '',
      telefono: '',
      departamento: '',
      municipio: '',
      vereda: ''
    };
  }

  public cerrarCrearAdmin(): void {
    this.crearAdminVisible = false;
    this.adminError = '';
    this.adminExito = false;
  }

  public crearAdmin(): void {
    this.adminError = '';

    // Validaciones básicas
    if (!this.adminForm.nombre.trim()) { this.adminError = 'El nombre es obligatorio.'; return; }
    if (!this.adminForm.apellido.trim()) { this.adminError = 'El apellido es obligatorio.'; return; }
    if (!this.adminForm.cedula.trim()) { this.adminError = 'La cédula es obligatoria.'; return; }
    if (!this.adminForm.email.trim()) { this.adminError = 'El correo es obligatorio.'; return; }
    if (!this.adminForm.password || this.adminForm.password.length < 6) {
      this.adminError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (!this.adminForm.departamento) { this.adminError = 'El departamento es obligatorio.'; return; }
    if (!this.adminForm.municipio) { this.adminError = 'El municipio es obligatorio.'; return; }

    this.adminCreando = true;

    this.authService.registerAdmin({
      nombre: this.adminForm.nombre.trim(),
      apellido: this.adminForm.apellido.trim(),
      cedula: this.adminForm.cedula.trim(),
      email: this.adminForm.email.trim(),
      password: this.adminForm.password,
      telefono: this.adminForm.telefono.trim() || undefined,
      departamento: this.adminForm.departamento,
      municipio: this.adminForm.municipio,
      vereda: this.adminForm.vereda.trim() || undefined,
    }).subscribe({
      next: () => {
        this.adminCreando = false;
        this.adminExito = true;
        this.cargarUsuarios();
        // Cerrar automáticamente después de 2s
        setTimeout(() => this.cerrarCrearAdmin(), 2000);
      },
      error: (err) => {
        this.adminCreando = false;
        const detail = err.error?.detail || '';
        if (detail.includes('already') || detail.includes('duplicate') || detail.includes('existe')) {
          this.adminError = 'Ya existe una cuenta con este correo o cédula.';
        } else if (detail.includes('No autorizado') || detail.includes('403') || err.status === 403) {
          this.adminError = 'No tienes permisos para crear administradores.';
        } else {
          this.adminError = detail || 'Error al crear administrador. Intenta nuevamente.';
        }
      },
    });
  }
}
