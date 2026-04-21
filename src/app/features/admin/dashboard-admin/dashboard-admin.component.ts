import { Component, OnInit } from '@angular/core';
import { FitoDataService, Inspeccion, Predio, Lote } from '../../../core/services/fito-data.service';

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
  standalone: false
})
export class DashboardAdminComponent implements OnInit {

  public metricas = { productores: 0, tecnicos: 0, inspeccionesPendientes: 0, alertas: 0 };
  public solicitudesPendientes: Array<Inspeccion & { predio?: Predio; lotesCount: number }> = [];

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void {
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
    alert(`Abriendo asignación de técnico para inspección ${id} (funcionalidad pendiente de backend).`);
  }
}
