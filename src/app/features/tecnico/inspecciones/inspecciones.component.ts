import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
    pendientes: 4,
    alertas: 1,
    enProgreso: 2,
    completadas: 15,
  };

  /**
   * Listado de inspecciones mockeadas para la interfaz.
   */
  public listaInspecciones = [
    {
      id: 'INS-001',
      productor: 'Darwing Jaimes',
      predio: 'Finca La Esmeralda',
      estado: 'Pendiente',
      prioridad: 'Alta',
      lat: 7.1193,
      lng: -73.1227,
    },
    {
      id: 'INS-002',
      productor: 'Luisa H.',
      predio: 'Hacienda El Recreo',
      estado: 'En Progreso',
      prioridad: 'Media',
      lat: 7.068,
      lng: -73.169,
    },
    {
      id: 'INS-003',
      productor: 'Carlos G.',
      predio: 'Cultivos El Sol',
      estado: 'Completada',
      prioridad: 'Baja',
      lat: 7.125,
      lng: -73.15,
    },
  ];

  /** Instancia del mapa de Leaflet */
  private map: any;

  /** Referencia a la librería asíncrona de Leaflet */
  private L: any;

  /**
   * Inicializa el componente.
   * @param platformId Identificador de la plataforma para validar ejecución en el navegador.
   */
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

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
   * Desencadena la renderización del mapa si se ejecuta en el navegador.
   */
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.iniciarMapa(), 300);
    }
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
