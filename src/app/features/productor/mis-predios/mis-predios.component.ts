import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FitoDataService, Predio, Lote, Cultivo } from '../../../core/services/fito-data.service';

@Component({
  selector: 'app-mis-predios',
  templateUrl: './mis-predios.component.html',
  styleUrls: ['./mis-predios.component.css'],
  standalone: false
})
export class MisPrediosComponent implements OnInit {

  public predios: Predio[] = [];
  public cultivos: Cultivo[] = [];
  public predioExpandido: string | null = null;
  public lotesDelPredioExpandido: Lote[] = [];

  // Modal de Predio
  public modalPredioVisible = false;
  public modalPredioModo: 'nuevo' | 'editar' = 'nuevo';
  public predioEnEdicion: Partial<Predio> = {};

  // Modal de Lote
  public modalLoteVisible = false;
  public predioActualParaLote: string = '';
  public nuevoLote: Partial<Lote> = {};

  public gpsLoading = false;
  public gpsStatus: 'ok' | 'error' | null = null;
  public erroresPredio: { [key: string]: string } = {};

  private map: any;
  private marker: any;
  private L: any;

  constructor(
    private dataService: FitoDataService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.predios = this.dataService.getPredios();
    this.cultivos = this.dataService.getCultivos();
  }

  public getLotesDe(predioId: string): Lote[] {
    return this.dataService.getLotesPorPredio(predioId);
  }

  public getNombreCultivo(cultivoId: string): string {
    return this.dataService.getCultivoPorId(cultivoId)?.nombre ?? '—';
  }

  public getTotalHectareas(predioId: string): number {
    return this.getLotesDe(predioId).reduce((a, l) => a + l.hectareas, 0);
  }

  public toggleExpandir(predioId: string): void {
    this.predioExpandido = this.predioExpandido === predioId ? null : predioId;
  }

  // === MODAL PREDIO ===

  public abrirModalNuevoPredio(): void {
    this.modalPredioModo = 'nuevo';
    this.predioEnEdicion = { nombre: '', ubicacion: '' };
    this.erroresPredio = {};
    this.modalPredioVisible = true;
    setTimeout(() => this.iniciarMapa(), 200);
  }

  public guardarPredio(): void {
    this.erroresPredio = {};

    if (!this.predioEnEdicion.nombre?.trim()) {
      this.erroresPredio['nombre'] = 'El nombre del lugar de producción es obligatorio.';
    }
    if (!this.predioEnEdicion.ubicacion?.trim()) {
      this.erroresPredio['ubicacion'] = 'La ubicación es obligatoria (ej: Vereda, Municipio, Departamento).';
    }

    if (Object.keys(this.erroresPredio).length > 0) return;

    this.dataService.agregarPredio({
      nombre: this.predioEnEdicion.nombre!,
      ubicacion: this.predioEnEdicion.ubicacion!,
      productorNombre: 'Darwing Jaimes',
      latitud: this.predioEnEdicion.latitud,
      longitud: this.predioEnEdicion.longitud
    });
    this.predios = this.dataService.getPredios();
    this.cerrarModalPredio();
  }

  public cerrarModalPredio(): void {
    this.modalPredioVisible = false;
    this.gpsStatus = null;
    if (this.map) { this.map.remove(); this.map = null; }
  }

  /** Captura la posición GPS del dispositivo y la coloca en el mapa */
  public capturarGPS(): void {
    if (!navigator.geolocation) { this.gpsStatus = 'error'; return; }
    this.gpsLoading = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.predioEnEdicion.latitud = +pos.coords.latitude.toFixed(6);
        this.predioEnEdicion.longitud = +pos.coords.longitude.toFixed(6);
        this.gpsLoading = false;
        this.gpsStatus = 'ok';
        this.colocarMarcadorEnMapa(this.predioEnEdicion.latitud, this.predioEnEdicion.longitud);
      },
      () => { this.gpsLoading = false; this.gpsStatus = 'error'; },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  /** Actualiza el marcador en el mapa cuando el usuario escribe coordenadas manualmente */
  public actualizarMarcadorManual(): void {
    const lat = this.predioEnEdicion.latitud;
    const lng = this.predioEnEdicion.longitud;
    if (lat && lng && this.map) {
      this.colocarMarcadorEnMapa(lat, lng);
      this.map.setView([lat, lng], 13);
    }
  }

  private colocarMarcadorEnMapa(lat: number, lng: number): void {
    if (!this.map || !this.L) return;
    if (this.marker) this.map.removeLayer(this.marker);
    this.marker = this.L.marker([lat, lng]).addTo(this.map);
  }

  // === MODAL LOTE ===

  public abrirModalNuevoLote(predioId: string): void {
    this.predioActualParaLote = predioId;
    const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const existentes = this.getLotesDe(predioId).length;
    this.nuevoLote = {
      predioId,
      nombre: `Lote ${letras[existentes] ?? (existentes + 1)}`,
      cultivoId: this.cultivos[0]?.id ?? '',
      hectareas: 1,
      plantasPorHectarea: 1000,
      estado: 'Óptimo'
    };
    this.modalLoteVisible = true;
  }

  public guardarLote(): void {
    if (!this.nuevoLote.cultivoId || !this.nuevoLote.hectareas) {
      alert('Completa todos los campos');
      return;
    }
    this.dataService.agregarLote(this.nuevoLote as Omit<Lote, 'id'>);
    this.modalLoteVisible = false;
  }

  public eliminarLote(id: string): void {
    if (confirm('¿Eliminar este lote?')) {
      this.dataService.eliminarLote(id);
    }
  }

  // === MAPA ===

  public async iniciarMapa(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.L) this.L = await import('leaflet');
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
