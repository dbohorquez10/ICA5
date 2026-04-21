import { Component, OnInit } from '@angular/core';
import { FitoDataService, Usuario } from '../../../core/services/fito-data.service';

/**
 * @description
 * Gestiona el listado, filtrado y administración completa de los usuarios del sistema FitoGestión. Renderiza una interfaz que permite listar usuarios, aplicar filtros de búsqueda por texto o rol, ver detalles, editar información básica, suspender/reactivar y eliminar cuentas permanentemente.
 *
 * @usageNotes
 * Componente diseñado principalmente para el rol 'admin'. Requiere la inyección de la dependencia `FitoDataService` para interactuar con el estado global de usuarios y ejecutar operaciones CRUD sobre ellos. Utiliza estados locales para controlar la visibilidad de los modales de detalle y edición.
 */
@Component({
  selector: 'app-gestion-usuarios',
  templateUrl: './gestion-usuarios.component.html',
  styleUrls: ['./gestion-usuarios.component.css'],
  standalone: false
})
export class GestionUsuariosComponent implements OnInit {

  public usuarios: Usuario[] = [];
  public filtro: string = '';
  public rolFiltro: string = 'todos';

  // Modal de detalle / edición
  public modalVisible = false;
  public modalModo: 'ver' | 'editar' = 'ver';
  public usuarioSeleccionado: Usuario | null = null;
  public editDatos: Partial<Usuario> = {};

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void {
    this.usuarios = this.dataService.getUsuarios();
  }

  /** Filtra por nombre, correo, identificación (cédula) */
  get usuariosFiltrados(): Usuario[] {
    return this.usuarios.filter(u => {
      const termino = this.filtro.toLowerCase().trim();
      const matchTexto = !termino ||
        u.nombre.toLowerCase().includes(termino) ||
        u.correo.toLowerCase().includes(termino) ||
        (u.identificacion && u.identificacion.includes(termino)) ||
        (u.telefono && u.telefono.includes(termino));
      const matchRol = this.rolFiltro === 'todos' || u.rol === this.rolFiltro;
      return matchTexto && matchRol;
    });
  }

  public getIniciales(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  public toggleSuspender(usuario: Usuario): void {
    const accion = usuario.estado === 'Activo' ? 'suspender' : 'reactivar';
    if (confirm(`¿Deseas ${accion} la cuenta de ${usuario.nombre}?`)) {
      this.dataService.suspenderUsuario(usuario.id);
      this.usuarios = this.dataService.getUsuarios();
    }
  }

  public eliminar(usuario: Usuario): void {
    if (confirm(`¿Eliminar permanentemente la cuenta de ${usuario.nombre}? Esta acción no se puede deshacer.`)) {
      this.dataService.eliminarUsuario(usuario.id);
      this.usuarios = this.dataService.getUsuarios();
    }
  }

  // --- Ver detalle ---
  public verDetalle(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.modalModo = 'ver';
    this.modalVisible = true;
  }

  // --- Editar usuario ---
  public editarUsuario(usuario: Usuario): void {
    this.usuarioSeleccionado = usuario;
    this.editDatos = { ...usuario };
    this.modalModo = 'editar';
    this.modalVisible = true;
  }

  public guardarEdicion(): void {
    if (!this.editDatos.nombre?.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }
    if (this.usuarioSeleccionado) {
      this.dataService.editarUsuario(this.usuarioSeleccionado.id, {
        nombre: this.editDatos.nombre?.trim(),
        correo: this.editDatos.correo?.trim(),
        zona: this.editDatos.zona?.trim(),
        telefono: this.editDatos.telefono?.trim(),
      });
      this.usuarios = this.dataService.getUsuarios();
    }
    this.cerrarModal();
  }

  public cerrarModal(): void {
    this.modalVisible = false;
    this.usuarioSeleccionado = null;
  }
}
