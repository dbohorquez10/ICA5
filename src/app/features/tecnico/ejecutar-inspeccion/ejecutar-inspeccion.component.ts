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

  public vista: Vista = 'ficha-predio';
  public inspeccion!: Inspeccion;
  public predio!: Predio;
  public lotesDePredio: Lote[] = [];
  public loteActual!: Lote;
  public subActual!: SubInspeccionLote;
  public plagasDelLote: Plaga[] = [];
  public plagasMarcadas: Set<string> = new Set();
  public plantaActual: number = 1;
  public observacionesGenerales: string = '';
  public cultivosMap: { [id: string]: string } = {};

  constructor(public dataService: FitoDataService, private router: Router) {}

  /** Resolves cultivo name from local cache */
  public getCultivoNombre(lote: any): string {
    const id = lote?.cultivo_id || lote?.cultivoId || '';
    return this.cultivosMap[id] || '—';
  }

  public guardarParcial(): void {
    // Progress is auto-saved on completarLote
  }

  ngOnInit(): void {
    this.dataService.getInspecciones().subscribe(inspecciones => {
      const pendientes = inspecciones.filter(i => !(i.estado || '').toLowerCase().includes('completada'));
      if (!pendientes.length) {
        alert('No hay inspecciones asignadas pendientes.');
        this.router.navigate(['/app/tecnico/inspecciones']);
        return;
      }
      this.inspeccion = pendientes[0];
      const predioId = this.inspeccion.predio_id || this.inspeccion.predioId || '';

      this.dataService.getPredio(predioId).subscribe(p => this.predio = p);
      this.dataService.getLotesPorPredio(predioId).subscribe(l => this.lotesDePredio = l);
      this.dataService.getCultivos().subscribe(cultivos => {
        cultivos.forEach(c => this.cultivosMap[c.id] = c.nombre);
      });
    });
  }

  public navegarAlPredio(): void {
    const destino = this.predio?.latitud
      ? `${this.predio.latitud},${this.predio.longitud}`
      : encodeURIComponent(this.predio?.ubicacion ?? '');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origen = `${pos.coords.latitude},${pos.coords.longitude}`;
          window.open(`https://www.google.com/maps/dir/${origen}/${destino}`, '_blank');
        },
        () => window.open(`https://www.google.com/maps/search/?api=1&query=${destino}`, '_blank')
      );
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${destino}`, '_blank');
    }
  }

  public getSubInspeccion(loteId: string): SubInspeccionLote | undefined {
    const subs = this.inspeccion.sub_inspecciones || this.inspeccion.subInspecciones || [];
    return subs.find(s => s.loteId === loteId || s.id === loteId);
  }

  public getLoteName(loteId: string): string {
    return this.lotesDePredio.find(l => l.id === loteId)?.nombre ?? '—';
  }

  public get progresoGlobal(): number {
    const subs = this.inspeccion.sub_inspecciones || this.inspeccion.subInspecciones || [];
    const total = subs.length;
    const completos = subs.filter(s => (s.estado || '').toLowerCase().includes('completad')).length;
    return total ? Math.round((completos / total) * 100) : 0;
  }

  public get todosLotesCompletos(): boolean {
    const subs = this.inspeccion.sub_inspecciones || this.inspeccion.subInspecciones || [];
    return subs.every(s => (s.estado || '').toLowerCase().includes('completad'));
  }

  public iniciarInspeccion(): void {
    this.vista = 'lista-lotes';
  }

  public seleccionarLote(lote: Lote): void {
    const sub = this.getSubInspeccion(lote.id);
    if (sub && (sub.estado || '').toLowerCase().includes('completad')) return;

    this.loteActual = lote;
    this.subActual = sub ? { ...sub } : {
      loteId: lote.id, estado: 'En Progreso', plantasEvaluadas: 0, registroPlantas: []
    };
    this.subActual.estado = 'En Progreso';
    this.plantaActual = (this.subActual.plantasEvaluadas || 0) + 1;
    this.plagasMarcadas = new Set();
    const cultivoId = lote.cultivo_id || lote.cultivoId || '';
    this.dataService.getPlagasByPrediosCultivos(cultivoId).subscribe(p => this.plagasDelLote = p);
    this.vista = 'inspeccion-lote';
  }

  public togglePlaga(plagaId: string): void {
    this.plagasMarcadas.has(plagaId) ? this.plagasMarcadas.delete(plagaId) : this.plagasMarcadas.add(plagaId);
  }

  public hasPlaga(plagaId: string): boolean {
    return this.plagasMarcadas.has(plagaId);
  }

  public siguientePlanta(): void {
    if (!this.subActual.registroPlantas) this.subActual.registroPlantas = [];
    this.subActual.registroPlantas.push({
      numeroPlanta: this.plantaActual,
      numero_planta: this.plantaActual,
      plagasDetectadas: Array.from(this.plagasMarcadas)
    });
    this.subActual.plantasEvaluadas = this.plantaActual;
    this.plantaActual++;
    this.plagasMarcadas.clear();
  }

  public completarLote(): void {
    if (!confirm(`¿Marcar la sub-inspección del ${this.loteActual.nombre} como completada?`)) return;

    if (!this.subActual.registroPlantas) this.subActual.registroPlantas = [];
    if (this.plagasMarcadas.size > 0 || this.plantaActual > 1) {
      this.subActual.registroPlantas.push({
        numeroPlanta: this.plantaActual,
        numero_planta: this.plantaActual,
        plagasDetectadas: Array.from(this.plagasMarcadas)
      });
      this.subActual.plantasEvaluadas = this.plantaActual;
    }

    this.subActual.estado = 'Completada';

    // Si el sub tiene id del backend, actualizarlo
    if (this.subActual.id) {
      this.dataService.actualizarSubInspeccion(this.subActual.id, {
        estado: 'completado', observaciones: ''
      }).subscribe();
    }

    this.vista = 'lista-lotes';
  }

  public volverALotes(): void {
    this.vista = 'lista-lotes';
  }

  public finalizarInspeccionCompleta(): void {
    if (confirm(`¿Finalizar la inspección del predio "${this.predio.nombre}"?`)) {
      this.dataService.finalizarInspeccion(this.inspeccion.id, this.observacionesGenerales)
        .subscribe(() => {
          alert('¡Inspección completada exitosamente!');
          this.router.navigate(['/app/tecnico/inspecciones']);
        });
    }
  }
}
