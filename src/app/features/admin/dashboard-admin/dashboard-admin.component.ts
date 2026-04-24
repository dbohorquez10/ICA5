import { Component, OnInit } from '@angular/core';
import { FitoDataService, Inspeccion, Predio, Lote, Usuario } from '../../../core/services/fito-data.service';
import { forkJoin } from 'rxjs';

/**
 * Panel de control central para administradores.
 */
@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
  standalone: false
})
export class DashboardAdminComponent implements OnInit {

  public metricas = { productores: 0, tecnicos: 0, inspeccionesPendientes: 0, alertas: 0 };
  public solicitudesPendientes: Array<any> = [];

  public modalAsignacionVisible = false;
  public inspeccionSeleccionada: string = '';
  public tecnicosDisponibles: Usuario[] = [];
  public tecnicoSeleccionado: string = '';

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void { this.recargar(); }

  private recargar(): void {
    forkJoin({
      usuarios: this.dataService.getUsuarios(),
      inspecciones: this.dataService.getInspecciones(),
      pendientes: this.dataService.getInspeccionesPendientes(),
    }).subscribe(({ usuarios, inspecciones, pendientes }) => {
      this.metricas = {
        productores: usuarios.filter(u => u.rol === 'productor').length,
        tecnicos: usuarios.filter(u => u.rol === 'tecnico').length,
        inspeccionesPendientes: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente')).length,
        alertas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('progreso')).length,
      };
      this.solicitudesPendientes = pendientes.map(ins => ({
        ...ins,
        predioId: ins.predio_id || ins.predioId,
        tecnicoNombre: ins.tecnico_nombre || ins.tecnicoNombre || 'Sin asignar',
      }));
    });
  }

  public asignarTecnico(id: string): void {
    this.inspeccionSeleccionada = id;
    this.dataService.getTecnicosActivos().subscribe(t => {
      this.tecnicosDisponibles = t;
      this.tecnicoSeleccionado = '';
      this.modalAsignacionVisible = true;
    });
  }

  public confirmarAsignacion(): void {
    if (!this.tecnicoSeleccionado) { alert('Selecciona un técnico.'); return; }
    this.dataService.asignarTecnicoAInspeccion(this.inspeccionSeleccionada, this.tecnicoSeleccionado)
      .subscribe(() => { this.modalAsignacionVisible = false; this.recargar(); });
  }

  public cerrarModalAsignacion(): void {
    this.modalAsignacionVisible = false;
  }
}
