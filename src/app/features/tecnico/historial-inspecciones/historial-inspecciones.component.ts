import { Component, OnInit } from '@angular/core';
import { FitoDataService, Inspeccion, Predio, Lote } from '../../../core/services/fito-data.service';

@Component({
  selector: 'app-historial-inspecciones',
  standalone: false,
  templateUrl: './historial-inspecciones.component.html',
  styleUrl: './historial-inspecciones.component.css',
})
export class HistorialInspeccionesComponent implements OnInit {

  public historial: Array<{
    id: string; fecha: string; predio: string; ubicacion: string;
    lotes: number; totalPlantas: number; plagasDetectadas: number;
    estado: string; tecnico: string;
  }> = [];

  public filtro = '';

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void {
    // Construimos el historial a partir de las inspecciones completadas
    const inspecciones = this.dataService.getInspecciones();
    this.historial = inspecciones.map(ins => {
      const predio = this.dataService.getPredio(ins.predioId);
      const lotes = this.dataService.getLotesPorPredio(ins.predioId);
      const totalPlantas = lotes.reduce((a, l) => a + (l.hectareas * l.plantasPorHectarea), 0);
      const plagasDetectadas = ins.subInspecciones.reduce(
        (a, s) => a + s.registroPlantas.filter(p => p.plagasDetectadas.length > 0).length, 0
      );
      return {
        id: ins.id,
        fecha: ins.fechaSolicitada,
        predio: predio?.nombre ?? '—',
        ubicacion: predio?.ubicacion ?? '—',
        lotes: lotes.length,
        totalPlantas: Math.round(totalPlantas),
        plagasDetectadas,
        estado: ins.estado,
        tecnico: ins.tecnicoNombre
      };
    });
  }

  get historialFiltrado() {
    if (!this.filtro) return this.historial;
    const q = this.filtro.toLowerCase();
    return this.historial.filter(h =>
      h.predio.toLowerCase().includes(q) || h.id.toLowerCase().includes(q)
    );
  }
}
