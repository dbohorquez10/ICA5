import { Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FitoDataService, Inspeccion, Predio, Lote, Plaga, SubInspeccionLote, RegistroPlanta, Cultivo } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

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
  public cultivosFullMap: { [id: string]: Cultivo } = {};

  // Estados adicionales y modales
  public isLoading: boolean = false;
  public modalInfoVisible: boolean = false;
  public modalInfoData: { titulo: string, detalles: { etiqueta: string, valor: string }[] } = { titulo: '', detalles: [] };
  
  public modalSugerirVisible: boolean = false;
  public nuevaSugerenciaPlaga = {
    nombre_comun: '',
    nombre_cientifico: '',
    tipo: 'insecto',
    descripcion: ''
  };

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
    this.guardarDraftLocal();
    this.notify.showSuccess('Borrador guardado localmente.');
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

    this.dataService.getInspeccionPorId(inspeccionId).subscribe({
      next: (ins) => {
        this.inspeccion = ins;
        const predioId = this.inspeccion.predio_id || this.inspeccion.predioId || '';

        forkJoin({
          subs: this.dataService.getSubInspeccionesPorInspeccion(inspeccionId),
          predio: this.dataService.getPredio(predioId),
          lotes: this.dataService.getLotesPorPredio(predioId),
          cultivos: this.dataService.getCultivos()
        }).subscribe({
          next: ({ subs, predio, lotes, cultivos }) => {
            this.inspeccion.sub_inspecciones = subs;
            this.predio = predio;
            this.lotesDePredio = lotes;
            cultivos.forEach(c => {
              this.cultivosMap[c.id] = c.nombre;
              this.cultivosFullMap[c.id] = c;
            });

            // Cargar observaciones generales iniciales si ya existen
            if (this.inspeccion.observaciones) {
              this.observacionesGenerales = this.inspeccion.observaciones;
            }

            // Restaurar borrador local si existe
            const draftKey = `draft_inspeccion_${inspeccionId}`;
            const draftStr = localStorage.getItem(draftKey);
            if (draftStr) {
              try {
                const draft = JSON.parse(draftStr);
                this.inspeccion = draft.inspeccion;
                this.observacionesGenerales = draft.observacionesGenerales || '';
                this.vista = draft.vista || 'ficha-predio';
                if (draft.loteActualId) {
                  const matchedLote = this.lotesDePredio.find(l => l.id === draft.loteActualId);
                  if (matchedLote) this.loteActual = matchedLote;
                }
                this.subActual = draft.subActual;
                this.plantaActual = draft.plantaActual || 1;
                this.plagasMarcadas = new Set(draft.plagasMarcadas || []);
                
                // Si el lote actual estaba cargado, aseguramos plagas cargadas
                if (this.loteActual) {
                  this.iniciarLoteView(this.loteActual);
                }
                
                this.notify.showInfo('Se ha restaurado el borrador guardado localmente.');
              } catch (e) {
                console.error('Error al restaurar borrador local:', e);
              }
            }
          },
          error: (err) => {
            console.error("Error al cargar datos de la inspección:", err);
            this.notify.showError('No se pudieron cargar todos los metadatos de la inspección.');
            this.router.navigate(['/app/tecnico/inspecciones']);
          }
        });
      },
      error: (err) => {
        console.error("Error al cargar inspección:", err);
        this.notify.showError('No se pudo cargar la inspección.');
        this.router.navigate(['/app/tecnico/inspecciones']);
      }
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
    return subs.find(s => s.loteId === loteId || s.codigo_punto === loteId || s.id === loteId);
  }

  public getLoteName(loteId: string): string {
    return this.lotesDePredio.find(l => l.id === loteId)?.nombre ?? '—';
  }

  public get progresoGlobal(): number {
    const total = this.lotesDePredio.length;
    if (total === 0) return 0;
    let completos = 0;
    for (const lote of this.lotesDePredio) {
      const sub = this.getSubInspeccion(lote.id);
      if (sub && (sub.estado || '').toLowerCase().includes('completad')) {
        completos++;
      }
    }
    return Math.round((completos / total) * 100);
  }

  public get todosLotesCompletos(): boolean {
    if (this.lotesDePredio.length === 0) return false;
    return this.lotesDePredio.every(lote => {
      const sub = this.getSubInspeccion(lote.id);
      return !!(sub && (sub.estado || '').toLowerCase().includes('completad'));
    });
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
    this.dataService.getPlagasByPrediosCultivos(cultivoId).subscribe({
      next: (p) => {
        this.plagasDelLote = p;
        // Asegurar guardar el estado inicial del lote en borrador
        this.guardarDraftLocal();
      },
      error: (err) => {
        console.error('Error al obtener plagas del cultivo:', err);
      }
    });
    this.vista = 'inspeccion-lote';
  }

  public togglePlaga(plagaId: string): void {
    this.plagasMarcadas.has(plagaId) ? this.plagasMarcadas.delete(plagaId) : this.plagasMarcadas.add(plagaId);
    this.guardarDraftLocal();
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
    this.guardarDraftLocal();
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
    this.isLoading = true;

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
          }).subscribe({
            next: () => {
              this.isLoading = false;
              // Actualizar el estado en el arreglo local
              if (this.inspeccion && this.inspeccion.sub_inspecciones) {
                const idx = this.inspeccion.sub_inspecciones.findIndex(s => s.id === this.subActual.id);
                if (idx !== -1) {
                  this.inspeccion.sub_inspecciones[idx] = {
                    ...this.inspeccion.sub_inspecciones[idx],
                    estado: 'completado',
                    plantas_evaluadas: this.subActual.plantasEvaluadas
                  };
                }
              }
              this.vista = 'lista-lotes';
              this.guardarDraftLocal();
              this.notify.showSuccess('Lote guardado con éxito.');
            },
            error: (err) => {
              this.isLoading = false;
              console.error("Error al actualizar estado del lote", err);
              this.notify.showError("Hubo un error al actualizar el estado de la sub-inspección.");
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error("Error al registrar plantas", err);
          this.notify.showError("Hubo un error al guardar los registros de las plantas.");
        }
      });
    } else if (this.subActual.id) {
      this.dataService.actualizarSubInspeccion(this.subActual.id, {
        estado: 'completado' as any, 
        observaciones: '',
        plantas_evaluadas: this.subActual.plantasEvaluadas || 0
      }).subscribe({
        next: () => {
          this.isLoading = false;
          // Actualizar el estado en el arreglo local
          if (this.inspeccion && this.inspeccion.sub_inspecciones) {
            const idx = this.inspeccion.sub_inspecciones.findIndex(s => s.id === this.subActual.id);
            if (idx !== -1) {
              this.inspeccion.sub_inspecciones[idx] = {
                ...this.inspeccion.sub_inspecciones[idx],
                estado: 'completado',
                plantas_evaluadas: this.subActual.plantasEvaluadas || 0
              };
            }
          }
          this.vista = 'lista-lotes';
          this.guardarDraftLocal();
          this.notify.showSuccess('Lote completado.');
        },
        error: (err) => {
          this.isLoading = false;
          console.error("Error al completar lote sin plantas", err);
          this.notify.showError("Error al completar la sub-inspección.");
        }
      });
    } else {
      this.isLoading = false;
      this.vista = 'lista-lotes';
    }
  }

  public volverALotes(): void {
    this.vista = 'lista-lotes';
  }

  public finalizarInspeccionCompleta(): void {
    if (confirm(`¿Finalizar la inspección del predio "${this.predio.nombre}"?`)) {
      this.isLoading = true;
      this.dataService.finalizarInspeccion(this.inspeccion.id, this.observacionesGenerales)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.limpiarDraftLocal();
            this.notify.showSuccess('¡Inspección completada exitosamente!');
            this.router.navigate(['/app/tecnico/inspecciones']);
          },
          error: (err) => {
            this.isLoading = false;
            console.error("Error al finalizar inspección:", err);
            this.notify.showError(err.error?.detail || 'Hubo un error al finalizar la inspección.');
          }
        });
    }
  }

  // --- MÉTODOS DE BORRADOR LOCAL ---
  public guardarDraftLocal(): void {
    if (!this.inspeccion) return;
    const draftData = {
      inspeccion: this.inspeccion,
      observacionesGenerales: this.observacionesGenerales,
      vista: this.vista,
      loteActualId: this.loteActual?.id || null,
      subActual: this.subActual || null,
      plantaActual: this.plantaActual,
      plagasMarcadas: Array.from(this.plagasMarcadas)
    };
    localStorage.setItem(`draft_inspeccion_${this.inspeccion.id}`, JSON.stringify(draftData));
  }

  public limpiarDraftLocal(): void {
    if (this.inspeccion) {
      localStorage.removeItem(`draft_inspeccion_${this.inspeccion.id}`);
    }
  }

  // --- MÉTODOS DE DETALLES (INFO MODAL) ---
  public verDetallesCultivo(lote: Lote, event: Event): void {
    event.stopPropagation();
    const cultivoId = lote.cultivo_id || lote.cultivoId || '';
    const cultivo = this.cultivosFullMap[cultivoId];
    if (cultivo) {
      this.modalInfoData = {
        titulo: `Cultivo: ${cultivo.nombre}`,
        detalles: [
          { etiqueta: 'Nombre Científico', valor: cultivo.nombre_cientifico || '—' },
          { etiqueta: 'Variedad', valor: cultivo.variedad || '—' },
          { etiqueta: 'Descripción', valor: cultivo.descripcion || '—' }
        ]
      };
      this.modalInfoVisible = true;
    } else {
      this.notify.showInfo('No se encontraron detalles para este cultivo.');
    }
  }

  public verDetallesPlaga(plaga: Plaga, event: Event): void {
    event.stopPropagation();
    this.modalInfoData = {
      titulo: `Plaga: ${plaga.nombre_comun || plaga.nombre}`,
      detalles: [
        { etiqueta: 'Nombre Científico', valor: plaga.nombre_cientifico || '—' },
        { etiqueta: 'Tipo', valor: plaga.tipo || '—' },
        { etiqueta: 'Riesgo', valor: plaga.riesgo || 'Medio' },
        { etiqueta: 'Estado', valor: plaga.estado || 'aprobado' },
        { etiqueta: 'Descripción', valor: plaga.descripcion || '—' }
      ]
    };
    this.modalInfoVisible = true;
  }

  public cerrarModalInfo(): void {
    this.modalInfoVisible = false;
  }

  // --- MÉTODOS DE SUGERENCIA DE PLAGA ---
  public abrirModalSugerir(): void {
    this.nuevaSugerenciaPlaga = {
      nombre_comun: '',
      nombre_cientifico: '',
      tipo: 'insecto',
      descripcion: ''
    };
    this.modalSugerirVisible = true;
  }

  public cerrarModalSugerir(): void {
    this.modalSugerirVisible = false;
  }

  public enviarSugerenciaPlaga(): void {
    if (!this.nuevaSugerenciaPlaga.nombre_comun.trim()) {
      this.notify.showError('El nombre común es obligatorio.');
      return;
    }
    if (!this.nuevaSugerenciaPlaga.descripcion.trim()) {
      this.notify.showError('La descripción es obligatoria.');
      return;
    }

    const cultivoId = this.loteActual.cultivo_id || this.loteActual.cultivoId || '';
    const payload = {
      ...this.nuevaSugerenciaPlaga,
      cultivo_id: cultivoId
    };

    this.isLoading = true;
    this.dataService.sugerirPlaga(payload).subscribe({
      next: (nuevaPlaga) => {
        this.isLoading = false;
        this.plagasDelLote.push(nuevaPlaga);
        this.cerrarModalSugerir();
        this.guardarDraftLocal();
        this.notify.showSuccess(`Se sugirió la plaga "${nuevaPlaga.nombre}" correctamente y está disponible para este predio.`);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al sugerir plaga:', err);
        this.notify.showError(err.error?.detail || 'No se pudo sugerir la plaga.');
      }
    });
  }
}
