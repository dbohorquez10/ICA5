import { Component, OnInit } from '@angular/core';
import { FitoDataService, Inspeccion, Predio, Lote, Usuario } from '../../../core/services/fito-data.service';

/**
 * @description
 * Controla el panel de control central para administradores en FitoGestión. Renderiza las métricas globales de la plataforma (productores, técnicos e inspecciones) y permite gestionar y asignar formalmente las solicitudes de inspección pendientes a los técnicos disponibles.
 *
 * @usageNotes
 * Componente de uso exclusivo para el rol 'admin'. Depende directamente de la inyección de `FitoDataService` para obtener indicadores métricos agregados, consultar técnicos activos y ejecutar la acción de asignación de inspecciones.
 */
@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
  standalone: false
})
export class DashboardAdminComponent implements OnInit {

  public metricas = { productores: 0, tecnicos: 0, inspeccionesPendientes: 0, alertas: 0 };
  public solicitudesPendientes: Array<Inspeccion & { predio?: Predio; lotesCount: number }> = [];

  // Modal de asignación
  public modalAsignacionVisible = false;
  public inspeccionSeleccionada: string = '';
  public tecnicosDisponibles: Usuario[] = [];
  public tecnicoSeleccionado: string = '';

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void {
    this.recargar();
  }

  private recargar(): void {
    const usuarios = this.dataService.getUsuarios();
    const inspecciones = this.dataService.getInspecciones();

    this.metricas = {
      productores: usuarios.filter(u => u.rol === 'productor').length,
      tecnicos: usuarios.filter(u => u.rol === 'tecnico').length,
      inspeccionesPendientes: inspecciones.filter(i => i.estado === 'Pendiente').length,
      alertas: inspecciones.filter(i => i.estado === 'En Progreso').length
    };

    this.solicitudesPendientes = this.dataService.getInspeccionesPendientes().map(ins => ({
      ...ins,
      predio: this.dataService.getPredio(ins.predioId),
      lotesCount: this.dataService.getLotesPorPredio(ins.predioId).length
    }));
  }

  public asignarTecnico(id: string): void {
    this.inspeccionSeleccionada = id;
    this.tecnicosDisponibles = this.dataService.getTecnicosActivos();
    this.tecnicoSeleccionado = '';
    this.modalAsignacionVisible = true;
  }

  public confirmarAsignacion(): void {
    if (!this.tecnicoSeleccionado) {
      alert('Selecciona un técnico para asignar.');
      return;
    }
    this.dataService.asignarTecnicoAInspeccion(this.inspeccionSeleccionada, this.tecnicoSeleccionado);
    this.modalAsignacionVisible = false;
    this.recargar();
  }

  public cerrarModalAsignacion(): void {
    this.modalAsignacionVisible = false;
  }
}
