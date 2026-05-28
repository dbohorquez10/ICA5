import { Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { FitoDataService, Inspeccion, Predio, Lote } from '../../../core/services/fito-data.service';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-historial-inspecciones',
  standalone: false,
  templateUrl: './historial-inspecciones.component.html',
  styleUrl: './historial-inspecciones.component.css',
})
export class HistorialInspeccionesComponent implements OnInit {
  private notify = inject(NotificationService);

  public historial: Array<{
    id: string; fecha: string; predio: string; ubicacion: string;
    lotes: number; totalPlantas: number; plagasDetectadas: number;
    estado: string; tecnico: string;
  }> = [];

  public filtro = '';

  constructor(
    private dataService: FitoDataService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUsuarioActual();
    const isTecnico = user?.rol === 'tecnico';
    const tecnicoId = isTecnico ? user.id : undefined;

    this.dataService.getInspecciones(tecnicoId).subscribe(inspecciones => {
      if (!inspecciones.length) { this.historial = []; return; }

      // ── BATCH: Cargar TODOS los predios en UNA sola petición (elimina N+1) ──
      const predioIds = inspecciones.map(ins => ins.predio_id || ins.predioId || '');
      this.dataService.getPrediosBatch(predioIds).subscribe(predios => {
        const predioMap = new Map(predios.map(p => [p.id, p]));

        this.historial = inspecciones.map(ins => {
          const predio = predioMap.get(ins.predio_id || ins.predioId || '');
          
          const subs = ins.sub_inspecciones || [];
          const loteIds = new Set(subs.map((s: any) => s.lote_id || s.codigo_punto || s.loteId).filter(Boolean));
          
          let totalPlantas = 0;
          const plagaIds = new Set<string>();
          
          subs.forEach((s: any) => {
            const regs = s.registro_plantas || [];
            totalPlantas += regs.length;
            regs.forEach((r: any) => {
              if (r.plaga_id) plagaIds.add(r.plaga_id);
            });
          });

          return {
            id: ins.id,
            fecha: ins.fecha_inspeccion || ins.fechaSolicitada || '—',
            predio: predio?.nombre ?? '—',
            ubicacion: predio?.ubicacion || `${predio?.vereda || ''}, ${predio?.municipio || ''}`.replace(/^,\s*/, '') || '—',
            lotes: loteIds.size,
            totalPlantas: totalPlantas,
            plagasDetectadas: plagaIds.size,
            estado: ins.estado,
            tecnico: ins.tecnico_nombre || ins.tecnicoNombre || (isTecnico ? `${user?.nombre || ''} ${user?.apellido || ''}`.trim() : '—'),
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

  public informeSeleccionadoId: string | null = null;

  public verInforme(id: string): void {
    this.informeSeleccionadoId = id;
  }

  public cerrarInforme(): void {
    this.informeSeleccionadoId = null;
  }

  public descargarPDF(id: string): void {
    this.dataService.descargarInformePDF(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_${id.substring(0, 6).toUpperCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando el PDF:', err);
        this.notify.showError('Hubo un error al generar o descargar el PDF del informe.');
      }
    });
  }
}
