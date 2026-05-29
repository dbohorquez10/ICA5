import { Component, OnInit, Inject, PLATFORM_ID, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { isPlatformBrowser } from '@angular/common';
import { FitoDataService, Predio, Lote, Cultivo } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { COLOMBIA_DEPARTAMENTOS } from '../../../core/constants/colombia-regions';

@Component({
  selector: 'app-mis-predios',
  templateUrl: './mis-predios.component.html',
  styleUrls: ['./mis-predios.component.css'],
  standalone: false
})
export class MisPrediosComponent implements OnInit {
  private notify = inject(NotificationService);

  public predios: Predio[] = [];
  public cultivos: Cultivo[] = [];
  public predioExpandido: string | null = null;
  public lotesCache: { [predioId: string]: Lote[] } = {};

  public modalPredioVisible = false;
  public modalPredioModo: 'nuevo' | 'editar' = 'nuevo';
  public predioEnEdicion: Partial<Predio> = {};

  public modalLoteVisible = false;
  public modalLoteModo: 'crear' | 'editar' = 'crear';
  public predioActualParaLote: string = '';
  public loteEnEdicionId: string = '';
  public nuevoLote: Partial<Lote> = {};

  public departamentos = Object.keys(COLOMBIA_DEPARTAMENTOS);
  public municipiosDisponibles: string[] = [];

  public gpsLoading = false;
  public gpsStatus: 'ok' | 'error' | null = null;
  public erroresPredio: { [key: string]: string } = {};

  private map: any;
  private marker: any;
  private L: any;
  private productorId: string = '';

  constructor(
    private dataService: FitoDataService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUsuarioActual();
    this.productorId = user?.id || '';
    this.cargarPredios();
    this.dataService.getCultivos().subscribe(c => this.cultivos = c);
  }

  private cargarPredios(): void {
    const loadPredios = this.productorId
      ? this.dataService.getPrediosPorProductor(this.productorId)
      : this.dataService.getPredios();

    loadPredios.subscribe(p => {
      this.predios = Array.isArray(p) ? p : [];
      // Auto-cargar lotes de cada predio para que se vean de inmediato
      this.predios.forEach(predio => this.cargarLotes(predio.id));
    });
  }

  public getLotesDe(predioId: string): Lote[] {
    return this.lotesCache[predioId] || [];
  }

  public cargarLotes(predioId: string): void {
    this.dataService.getLotesPorPredio(predioId).subscribe(l => {
      this.lotesCache[predioId] = Array.isArray(l) ? l : [];
    });
  }

  public getNombreCultivo(cultivoId: string): string {
    return this.cultivos.find(c => c.id === cultivoId)?.nombre ?? '—';
  }

  public getTotalHectareas(predioId: string): number {
    return this.getLotesDe(predioId).reduce((a, l) => a + (l.area || l.hectareas || 0), 0);
  }

  public toggleExpandir(predioId: string): void {
    if (this.predioExpandido === predioId) {
      this.predioExpandido = null;
    } else {
      this.predioExpandido = predioId;
      this.cargarLotes(predioId);
    }
  }

  // === MODAL PREDIO ===
  public abrirModalNuevoPredio(): void {
    this.modalPredioModo = 'nuevo';
    this.predioEnEdicion = {
      nombre: '', departamento: '', municipio: '', vereda: '',
      numero_registro_ica: 'ICA-' + Math.floor(100000 + Math.random() * 900000)
    };
    this.municipiosDisponibles = [];
    this.erroresPredio = {};
    this.modalPredioVisible = true;
    setTimeout(() => this.iniciarMapa(), 200);
  }

  public onDepartamentoChange(): void {
    const depto = this.predioEnEdicion.departamento;
    this.municipiosDisponibles = depto ? COLOMBIA_DEPARTAMENTOS[depto] || [] : [];
    this.predioEnEdicion.municipio = '';
  }

  public guardarPredio(): void {
    this.erroresPredio = {};
    if (!this.predioEnEdicion.nombre?.trim()) {
      this.erroresPredio['nombre'] = 'El nombre del lugar de producción es obligatorio.';
    }
    if (!this.predioEnEdicion.departamento?.trim() || !this.predioEnEdicion.municipio?.trim() || !this.predioEnEdicion.vereda?.trim()) {
      this.erroresPredio['ubicacion'] = 'La ubicación completa es obligatoria.';
    }
    if (Object.keys(this.erroresPredio).length > 0) return;

    this.dataService.agregarPredio({
      nombre: this.predioEnEdicion.nombre!,
      productor_id: this.productorId,
      departamento: this.predioEnEdicion.departamento,
      municipio: this.predioEnEdicion.municipio,
      vereda: this.predioEnEdicion.vereda,
      numero_registro_ica: this.predioEnEdicion.numero_registro_ica || this.predioEnEdicion.numeroRegistroIca,
      latitud: this.predioEnEdicion.latitud,
      longitud: this.predioEnEdicion.longitud,
    }).subscribe(() => {
      this.cargarPredios();
      this.cerrarModalPredio();
    });
  }

  public cerrarModalPredio(): void {
    this.modalPredioVisible = false;
    this.gpsStatus = null;
    if (this.map) { this.map.remove(); this.map = null; }
  }

  public capturarGPS(): void {
    if (!navigator.geolocation) { this.gpsStatus = 'error'; return; }
    this.gpsLoading = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.predioEnEdicion.latitud = +pos.coords.latitude.toFixed(6);
        this.predioEnEdicion.longitud = +pos.coords.longitude.toFixed(6);
        this.gpsLoading = false; this.gpsStatus = 'ok';
        this.colocarMarcadorEnMapa(this.predioEnEdicion.latitud, this.predioEnEdicion.longitud);
      },
      () => { this.gpsLoading = false; this.gpsStatus = 'error'; },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  public actualizarMarcadorManual(): void {
    const lat = this.predioEnEdicion.latitud;
    const lng = this.predioEnEdicion.longitud;
    if (lat && lng && this.map) { this.colocarMarcadorEnMapa(lat, lng); this.map.setView([lat, lng], 13); }
  }

  private colocarMarcadorEnMapa(lat: number, lng: number): void {
    if (!this.map || !this.L) return;
    if (this.marker) this.map.removeLayer(this.marker);
    this.marker = this.L.marker([lat, lng]).addTo(this.map);
  }

  // === MODAL LOTE ===
  public abrirModalNuevoLote(predioId: string): void {
    this.modalLoteModo = 'crear';
    this.predioActualParaLote = predioId;
    const letras = ['A','B','C','D','E','F','G'];
    const existentes = this.getLotesDe(predioId).length;
    this.nuevoLote = {
      predio_id: predioId,
      nombre: `Lote ${letras[existentes] ?? (existentes + 1)}`,
      cultivo_id: this.cultivos[0]?.id ?? '',
      area: 1,
      num_plantas: 1000,
      estado: 'Óptimo'
    };
    this.modalLoteVisible = true;
  }

  public abrirModalEditarLote(lote: Lote): void {
    this.modalLoteModo = 'editar';
    this.loteEnEdicionId = lote.id;
    this.predioActualParaLote = lote.predio_id || lote.predioId || '';
    this.nuevoLote = { ...lote };
    this.modalLoteVisible = true;
  }

  public guardarLote(): void {
    if (!this.nuevoLote.cultivo_id || !this.nuevoLote.area) {
      this.notify.showError('Completa todos los campos'); return;
    }
    if (this.modalLoteModo === 'crear') {
      this.dataService.agregarLote(this.nuevoLote).subscribe(() => {
        this.modalLoteVisible = false;
        // Limpiar caché antes de recargar para evitar duplicados visuales
        delete this.lotesCache[this.predioActualParaLote];
        this.cargarLotes(this.predioActualParaLote);
      });
    } else {
      this.dataService.editarLote(this.loteEnEdicionId, this.nuevoLote).subscribe(() => {
        this.modalLoteVisible = false;
        // Limpiar caché antes de recargar para evitar duplicados visuales
        delete this.lotesCache[this.predioActualParaLote];
        this.cargarLotes(this.predioActualParaLote);
      });
    }
  }

  public eliminarLote(id: string | undefined, predioId: string): void {
    if (!id) return;
    if (confirm('¿Estás seguro de que deseas eliminar este lote de forma permanente?')) {
      this.dataService.eliminarLote(id).subscribe({
        next: () => {
          this.cargarLotes(predioId);
          this.notify.showSuccess("Lote eliminado correctamente.");
        },
        error: (err) => {
          console.error("Error al eliminar lote", err);
          this.notify.showError("Hubo un error al intentar eliminar el lote.");
        }
      });
    }
  }

  public eliminarPredio(id: string | undefined): void {
    if (!id) return;
    if (confirm('¿Estás seguro de que deseas eliminar este lugar de producción de forma permanente? Se eliminarán todos los lotes e inspecciones asociadas.')) {
      this.dataService.eliminarPredio(id).subscribe({
        next: () => {
          this.cargarPredios();
          this.notify.showSuccess("Lugar de producción eliminado correctamente.");
        },
        error: (err) => {
          console.error("Error al eliminar predio", err);
          this.notify.showError("Hubo un error al intentar eliminar el lugar de producción.");
        }
      });
    }
  }

  // === MAPA ===
  public async iniciarMapa(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.L) {
      const leaflet = await import('leaflet');
      this.L = leaflet.default || leaflet;
    }
    setTimeout(() => {
      if (this.map) return;
      this.map = this.L.map('mapaFito').setView([7.1193, -73.1227], 11);
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
      this.map.on('click', (e: any) => {
        this.predioEnEdicion.latitud = e.latlng.lat;
        this.predioEnEdicion.longitud = e.latlng.lng;
        if (this.marker) this.map.removeLayer(this.marker);
        this.marker = this.L.marker([e.latlng.lat, e.latlng.lng]).addTo(this.map);
      });
    }, 200);
  }
}
