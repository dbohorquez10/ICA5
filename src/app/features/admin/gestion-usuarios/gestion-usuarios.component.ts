import { Component, OnInit } from '@angular/core';
import { FitoDataService, Usuario } from '../../../core/services/fito-data.service';

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

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void {
    this.usuarios = this.dataService.getUsuarios();
  }

  get usuariosFiltrados(): Usuario[] {
    return this.usuarios.filter(u => {
      const matchNombre = u.nombre.toLowerCase().includes(this.filtro.toLowerCase());
      const matchRol = this.rolFiltro === 'todos' || u.rol === this.rolFiltro;
      return matchNombre && matchRol;
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
}
