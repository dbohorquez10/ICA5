import { Component, OnInit } from '@angular/core';
import { FitoDataService, Inspeccion, Predio, Lote } from '../../../core/services/fito-data.service';
import { forkJoin } from 'rxjs';

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
    this.dataService.getInspecciones().subscribe(inspecciones => {
      if (!inspecciones.length) { this.historial = []; return; }

      const predioRequests = inspecciones.map(ins =>
        this.dataService.getPredio(ins.predio_id || ins.predioId || '')
      );

      forkJoin(predioRequests).subscribe(predios => {
        this.historial = inspecciones.map((ins, i) => {
          const predio = predios[i];
          return {
            id: ins.id,
            fecha: ins.fecha_inspeccion || ins.fechaSolicitada || '—',
            predio: predio?.nombre ?? '—',
            ubicacion: predio?.ubicacion || `${predio?.municipio || ''}, ${predio?.departamento || ''}`,
            lotes: 0,
            totalPlantas: 0,
            plagasDetectadas: 0,
            estado: ins.estado,
            tecnico: ins.tecnico_nombre || ins.tecnicoNombre || '—',
          };
        });
      });
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
