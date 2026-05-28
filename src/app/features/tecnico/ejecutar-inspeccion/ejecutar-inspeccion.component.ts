import { Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FitoDataService, Inspeccion, Predio, Lote, Plaga, SubInspeccionLote, RegistroPlanta } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';

type Vista = 'ficha-predio' | 'lista-lotes' | 'inspeccion-lote';

@Component({
  selector: 'app-ejecutar-inspeccion',
  templateUrl: './ejecutar-inspeccion.component.html',
  styleUrls: ['./ejecutar-inspeccion.component.css'],
  standalone: false
})
export class EjecutarInspeccionComponent implements OnInit {
  private notify = inject(NotificationService);

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

  constructor(
    public dataService: FitoDataService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  /** Resolves cultivo name from local cache */
  public getCultivoNombre(lote: any): string {
    const id = lote?.cultivo_id || lote?.cultivoId || '';
    return this.cultivosMap[id] || '—';
  }

  public guardarParcial(): void {
    // Progress is auto-saved on completarLote
  }

  ngOnInit(): void {
    const user = this.authService.getUsuarioActual();
    if (!user) {
      this.router.navigate(['/app/tecnico/inspecciones']);
      return;
    }

    const inspeccionId = this.route.snapshot.paramMap.get('inspeccionId');
    if (!inspeccionId) {
      this.notify.showInfo('No se especificó la inspección a ejecutar.');
      this.router.navigate(['/app/tecnico/inspecciones']);
      return;
    }

    this.dataService.getInspeccionPorId(inspeccionId).subscribe(ins => {
      this.inspeccion = ins;
      const predioId = this.inspeccion.predio_id || this.inspeccion.predioId || '';

      // Cargar sub-inspecciones existentes
      this.dataService.getSubInspeccionesPorInspeccion(inspeccionId).subscribe(subs => {
        this.inspeccion.sub_inspecciones = subs;
      });

      this.dataService.getPredio(predioId).subscribe(p => this.predio = p);
      this.dataService.getLotesPorPredio(predioId).subscribe(l => this.lotesDePredio = l);
      this.dataService.getCultivos().subscribe(cultivos => {
        cultivos.forEach(c => this.cultivosMap[c.id] = c.nombre);
      });
    }, err => {
      this.notify.showError('No se pudo cargar la inspección.');
      this.router.navigate(['/app/tecnico/inspecciones']);
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
    this.plantaActual = 1;
    this.plagasMarcadas = new Set();
    
    if (sub) {
      this.subActual = { ...sub };
      this.subActual.estado = 'En Progreso';
      this.plantaActual = (this.subActual.plantasEvaluadas || 0) + 1;
      this.iniciarLoteView(lote);
    } else {
      // Crear en el backend primero
      this.dataService.crearSubInspeccion({
        inspeccion_id: this.inspeccion.id,
        codigo_punto: lote.id, // Using lote ID as codigo_punto to map it
        ubicacion_referencia: lote.nombre,
        estado: 'en_progreso' as any
      }).subscribe(newSub => {
        this.subActual = newSub;
        this.subActual.loteId = lote.id; // local tracking
        this.subActual.estado = 'En Progreso';
        this.subActual.registroPlantas = [];
        this.subActual.plantasEvaluadas = 0;
        
        if (!this.inspeccion.sub_inspecciones) this.inspeccion.sub_inspecciones = [];
        this.inspeccion.sub_inspecciones.push(this.subActual);
        
        this.iniciarLoteView(lote);
      });
    }
  }

  private iniciarLoteView(lote: Lote): void {
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
        numero_planta: this.plantaActual,
        plagasDetectadas: Array.from(this.plagasMarcadas)
      });
      this.subActual.plantasEvaluadas = this.plantaActual;
    }

    this.subActual.estado = 'Completada';

    // Construir los registros de plantas para el backend
    if (this.subActual.id && this.subActual.registroPlantas.length > 0) {
      const recordsToSave: Partial<RegistroPlanta>[] = [];
      
      this.subActual.registroPlantas.forEach(rp => {
        if (rp.plagasDetectadas && rp.plagasDetectadas.length > 0) {
          rp.plagasDetectadas.forEach(plagaId => {
            recordsToSave.push({
              sub_inspeccion_id: this.subActual.id,
              numero_planta: rp.numero_planta || rp.numeroPlanta || 1,
              plaga_id: plagaId,
              sintoma: 'Detectado en inspección',
              severidad: 'leve',
              incidencia: 10,
              estado_planta: 'enferma'
            });
          });
        } else {
          recordsToSave.push({
            sub_inspeccion_id: this.subActual.id,
            numero_planta: rp.numero_planta || rp.numeroPlanta || 1,
            estado_planta: 'sana'
          });
        }
      });

      this.dataService.registrarPlantasBulk(recordsToSave).subscribe({
        next: () => {
          this.dataService.actualizarSubInspeccion(this.subActual.id!, {
            estado: 'completado' as any, 
            observaciones: '',
            plantas_evaluadas: this.subActual.plantasEvaluadas
          }).subscribe(() => this.vista = 'lista-lotes');
        },
        error: (err) => {
          console.error("Error al registrar plantas", err);
          this.notify.showError("Hubo un error al guardar los registros de las plantas.");
        }
      });
    } else if (this.subActual.id) {
      this.dataService.actualizarSubInspeccion(this.subActual.id, {
        estado: 'completado' as any, 
        observaciones: '',
        plantas_evaluadas: this.subActual.plantasEvaluadas || 0
      }).subscribe(() => this.vista = 'lista-lotes');
    } else {
      this.vista = 'lista-lotes';
    }
  }

  public volverALotes(): void {
    this.vista = 'lista-lotes';
  }

  public finalizarInspeccionCompleta(): void {
    if (confirm(`¿Finalizar la inspección del predio "${this.predio.nombre}"?`)) {
      this.dataService.finalizarInspeccion(this.inspeccion.id, this.observacionesGenerales)
        .subscribe(() => {
          this.notify.showSuccess('¡Inspección completada exitosamente!');
          this.router.navigate(['/app/tecnico/inspecciones']);
        });
    }
  }
}
