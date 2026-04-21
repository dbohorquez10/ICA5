import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FitoDataService, Inspeccion, Predio } from '../../../core/services/fito-data.service';

/**
 * Componente principal para el módulo de inspecciones del técnico.
 * Encargado de mostrar un resumen estadístico, un listado de inspecciones
 * y su respectiva ubicación geográfica mediante un mapa interactivo.
 */
@Component({
  selector: 'app-inspecciones',
  templateUrl: './inspecciones.component.html',
  styleUrls: ['./inspecciones.component.css'],
  standalone: false,
})
export class InspeccionesComponent implements OnInit {
  /**
   * Estadísticas generales de las inspecciones asignadas.
   */
  public stats = {
    pendientes: 0,
    alertas: 0,
    enProgreso: 0,
    completadas: 0,
  };

  /**
   * Listado de inspecciones conectado al servicio de datos central.
   */
  public listaInspecciones: Array<{
    id: string;
    productor: string;
    predio: string;
    estado: string;
    prioridad: string;
    lat: number;
    lng: number;
  }> = [];

  /** Instancia del mapa de Leaflet */
  private map: any;

  /** Referencia a la librería asíncrona de Leaflet */
  private L: any;

  /**
   * Inicializa el componente.
   * @param platformId Identificador de la plataforma para validar ejecución en el navegador.
   * @param dataService Servicio central de datos.
   */
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: FitoDataService
  ) {}

  /**
   * Abre Google Maps con ruta desde la posición actual del técnico hasta el predio.
   */
  public navegarAPredio(lat: number, lng: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const origen = `${pos.coords.latitude},${pos.coords.longitude}`;
          window.open(`https://www.google.com/maps/dir/${origen}/${lat},${lng}`, '_blank');
        },
        () => window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank')
      );
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
  }

  /**
   * Hook de ciclo de vida invocado tras la inicialización del componente.
   * Carga datos desde el servicio central y renderiza el mapa.
   */
  ngOnInit(): void {
    this.cargarDatos();
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.iniciarMapa(), 300);
    }
  }

  /**
   * Recarga los datos de inspecciones desde el servicio central de datos.
   */
  private cargarDatos(): void {
    const inspecciones = this.dataService.getInspecciones();

    // Calcular estadísticas
    this.stats = {
      pendientes: inspecciones.filter(i => i.estado === 'Pendiente').length,
      alertas: inspecciones.filter(i => i.subInspecciones.some(s => s.registroPlantas.some(r => r.plagasDetectadas.length > 0))).length,
      enProgreso: inspecciones.filter(i => i.estado === 'En Progreso').length,
      completadas: inspecciones.filter(i => i.estado === 'Completada').length,
    };

    // Construir lista de inspecciones con datos del predio
    this.listaInspecciones = inspecciones.map(ins => {
      const predio = this.dataService.getPredio(ins.predioId);
      return {
        id: ins.id.toUpperCase(),
        productor: predio?.productorNombre || '—',
        predio: predio?.nombre || '—',
        estado: ins.estado,
        prioridad: ins.estado === 'Pendiente' ? 'Alta' : ins.estado === 'En Progreso' ? 'Media' : 'Baja',
        lat: predio?.latitud || 7.1193,
        lng: predio?.longitud || -73.1227,
      };
    });
  }

  /**
   * Carga de forma asíncrona la librería Leaflet y dibuja el mapa interactivo
   * junto con los marcadores correspondientes a las inspecciones en curso.
   * @private
   */
  private async iniciarMapa(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.L) {
      this.L = await import('leaflet');
    }

    this.map = this.L.map('mapaTecnico').setView([7.1193, -73.1227], 11);
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    this.listaInspecciones.forEach((item) => {
      const color = item.prioridad === 'Alta' ? '#ef4444' : '#1b2610';
      const icon = this.L.divIcon({
        html: `<span class="material-icons" style="color: ${color}; font-size: 32px; drop-shadow: 2px 2px 4px rgba(0,0,0,0.3);">location_on</span>`,
        className: 'custom-pin',
        iconSize: [32, 32],
      });

      this.L.marker([item.lat, item.lng], { icon })
        .bindPopup(`<b>${item.predio}</b><br>${item.productor}`)
        .addTo(this.map);
    });
  }
}
