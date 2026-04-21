import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FitoDataService, Inspeccion, Predio, Lote, Plaga, SubInspeccionLote } from '../../../core/services/fito-data.service';

type Vista = 'ficha-predio' | 'lista-lotes' | 'inspeccion-lote';

@Component({
  selector: 'app-ejecutar-inspeccion',
  templateUrl: './ejecutar-inspeccion.component.html',
  styleUrls: ['./ejecutar-inspeccion.component.css'],
  standalone: false
})
export class EjecutarInspeccionComponent implements OnInit {

  // ── Estado de navegación interna ──
  public vista: Vista = 'ficha-predio';

  // ── Datos de la inspección ──
  public inspeccion!: Inspeccion;
  public predio!: Predio;
  public lotesDePredio: Lote[] = [];

  // ── Sub-inspección activa (por lote) ──
  public loteActual!: Lote;
  public subActual!: SubInspeccionLote;
  public plagasDelLote: Plaga[] = [];
  public plagasMarcadas: Set<string> = new Set();
  public plantaActual: number = 1;

  constructor(public dataService: FitoDataService, private router: Router) {}

  ngOnInit(): void {
    // Usamos la primera inspección pendiente como mock
    const inspecciones = this.dataService.getInspecciones().filter(i => i.estado !== 'Completada');
    if (!inspecciones.length) {
      alert('No hay inspecciones asignadas pendientes.');
      this.router.navigate(['/app/tecnico/inspecciones']);
      return;
    }
    this.inspeccion = inspecciones[0];
    this.predio = this.dataService.getPredio(this.inspeccion.predioId)!;
    this.lotesDePredio = this.dataService.getLotesPorPredio(this.predio.id);
  }

  /**
   * Abre Google Maps con ruta desde la posición GPS actual del técnico hasta el predio.
   * Si el predio tiene coordenadas, las usa directamente; si no, usa la dirección textual.
   */
  public navegarAlPredio(): void {
    const destino = this.predio?.latitud
      ? `${this.predio.latitud},${this.predio.longitud}`
      : encodeURIComponent(this.predio?.ubicacion ?? '');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origen = `${pos.coords.latitude},${pos.coords.longitude}`;
          window.open(
            `https://www.google.com/maps/dir/${origen}/${destino}`,
            '_blank'
          );
        },
        () => {
          // Si no hay permiso de GPS, abre Maps solo con el destino
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${destino}`,
            '_blank'
          );
        }
      );
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${destino}`, '_blank');
    }
  }

  // ── Getters de progreso ──

  public getSubInspeccion(loteId: string): SubInspeccionLote | undefined {
    return this.inspeccion.subInspecciones.find(s => s.loteId === loteId);
  }

  public getLoteName(loteId: string): string {
    return this.dataService.getLotePorId(loteId)?.nombre ?? '—';
  }

  public get progresoGlobal(): number {
    const total = this.inspeccion.subInspecciones.length;
    const completos = this.inspeccion.subInspecciones.filter(s => s.estado === 'Completada').length;
    return total ? Math.round((completos / total) * 100) : 0;
  }

  public get todosLotesCompletos(): boolean {
    return this.inspeccion.subInspecciones.every(s => s.estado === 'Completada');
  }

  // ── Navegación ──

  public iniciarInspeccion(): void {
    this.vista = 'lista-lotes';
  }

  public seleccionarLote(lote: Lote): void {
    const sub = this.getSubInspeccion(lote.id);
    if (sub?.estado === 'Completada') return;

    this.loteActual = lote;
    this.subActual = sub ? { ...sub } : {
      loteId: lote.id, estado: 'En Progreso', plantasEvaluadas: 0, registroPlantas: []
    };
    this.subActual.estado = 'En Progreso';
    this.plantaActual = (this.subActual.plantasEvaluadas || 0) + 1;
    this.plagasMarcadas = new Set();
    this.plagasDelLote = this.dataService.getPlagasByPrediosCultivos(lote.cultivoId);
    this.vista = 'inspeccion-lote';

    // Guardar estado "En Progreso"
    this.dataService.actualizarSubInspeccion(this.inspeccion.id, this.subActual);
    this.inspeccion = this.dataService.getInspeccionPorId(this.inspeccion.id)!;
  }

  public togglePlaga(plagaId: string): void {
    this.plagasMarcadas.has(plagaId) ? this.plagasMarcadas.delete(plagaId) : this.plagasMarcadas.add(plagaId);
  }

  public hasPlaga(plagaId: string): boolean {
    return this.plagasMarcadas.has(plagaId);
  }

  public siguientePlanta(): void {
    this.subActual.registroPlantas.push({
      numeroPlanta: this.plantaActual,
      plagasDetectadas: Array.from(this.plagasMarcadas)
    });
    this.subActual.plantasEvaluadas = this.plantaActual;
    this.plantaActual++;
    this.plagasMarcadas.clear();
    this.guardarProgresoParcial();
  }

  public completarLote(): void {
    if (!confirm(`¿Marcar la sub-inspección del ${this.loteActual.nombre} como completada?`)) return;

    // Guardar última planta si hay algo marcado
    if (this.plagasMarcadas.size > 0 || this.plantaActual > 1) {
      this.subActual.registroPlantas.push({
        numeroPlanta: this.plantaActual,
        plagasDetectadas: Array.from(this.plagasMarcadas)
      });
      this.subActual.plantasEvaluadas = this.plantaActual;
    }

    this.subActual.estado = 'Completada';
    this.dataService.actualizarSubInspeccion(this.inspeccion.id, this.subActual);
    this.inspeccion = this.dataService.getInspeccionPorId(this.inspeccion.id)!;
    this.vista = 'lista-lotes';
  }

  public volverALotes(): void {
    this.vista = 'lista-lotes';
  }

  public finalizarInspeccionCompleta(): void {
    if (confirm(`¿Finalizar y cerrar la inspección completa del predio "${this.predio.nombre}"?`)) {
      // Asegurar que todas las sub-inspecciones queden marcadas como completadas
      this.inspeccion.subInspecciones.forEach(sub => {
        if (sub.estado !== 'Completada') {
          sub.estado = 'Completada';
          this.dataService.actualizarSubInspeccion(this.inspeccion.id, sub);
        }
      });

      // Refrescar el estado local de la inspección desde el servicio
      this.inspeccion = this.dataService.getInspeccionPorId(this.inspeccion.id)!;

      alert('¡Inspección del predio completada exitosamente! Los datos han sido actualizados.');
      this.router.navigate(['/app/tecnico/inspecciones']);
    }
  }

  public guardarProgresoParcial(): void {
    this.dataService.actualizarSubInspeccion(this.inspeccion.id, this.subActual);
  }
}
