import { Component, OnInit } from '@angular/core';
import { FitoDataService, Usuario } from '../../../core/services/fito-data.service';

/**
 * Gestiona el listado, filtrado y administración de usuarios del sistema FitoGestión.
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

  public modalVisible = false;
  public modalModo: 'ver' | 'editar' = 'ver';
  public usuarioSeleccionado: Usuario | null = null;
  public editDatos: Partial<Usuario> = {};

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private cargarUsuarios(): void {
    this.dataService.getUsuarios().subscribe(data => this.usuarios = data);
  }

  get usuariosFiltrados(): Usuario[] {
    return this.usuarios.filter(u => {
      const termino = this.filtro.toLowerCase().trim();
      const matchTexto = !termino ||
        u.nombre.toLowerCase().includes(termino) ||
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

  public toggleSuspender(usuario: Usuario): void {
    const accion = usuario.activo !== false ? 'suspender' : 'reactivar';
    if (confirm(`¿Deseas ${accion} la cuenta de ${usuario.nombre}?`)) {
      this.dataService.suspenderUsuario(usuario.id).subscribe(() => this.cargarUsuarios());
    }
  }

  public eliminar(usuario: Usuario): void {
    if (confirm(`¿Eliminar permanentemente la cuenta de ${usuario.nombre}?`)) {
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

  public guardarEdicion(): void {
    if (!this.editDatos.nombre?.trim()) { alert('El nombre es obligatorio.'); return; }
    if (this.usuarioSeleccionado) {
      this.dataService.editarUsuario(this.usuarioSeleccionado.id, {
        nombre: this.editDatos.nombre?.trim(),
        email: this.editDatos.email?.trim() || this.editDatos.correo?.trim(),
        telefono: this.editDatos.telefono?.trim(),
      } as any).subscribe(() => this.cargarUsuarios());
    }
    this.cerrarModal();
  }

  public cerrarModal(): void {
    this.modalVisible = false;
    this.usuarioSeleccionado = null;
  }
}
