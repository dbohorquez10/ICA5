import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FitoDataService, Inspeccion, Predio } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Panel de inspecciones del técnico con mapa interactivo.
 */
@Component({
  selector: 'app-inspecciones',
  templateUrl: './inspecciones.component.html',
  styleUrls: ['./inspecciones.component.css'],
  standalone: false,
})
export class InspeccionesComponent implements OnInit {

  public stats = { pendientes: 0, alertas: 0, enProgreso: 0, completadas: 0 };
  public listaInspecciones: Array<{
    id: string; productor: string; predio: string;
    estado: string; prioridad: string; lat: number; lng: number;
  }> = [];

  private map: any;
  private L: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private dataService: FitoDataService,
    private authService: AuthService
  ) {}

  private mapCoordinates: Record<string, [number, number]> = {
    'Amazonas': [-1.565, -71.558], 'Antioquia': [6.537, -75.334], 'Arauca': [6.611, -70.762],
    'Atlántico': [10.669, -74.960], 'Bolívar': [8.406, -74.341], 'Boyacá': [5.727, -72.934],
    'Caldas': [5.295, -75.467], 'Caquetá': [1.139, -73.682], 'Casanare': [5.332, -71.603],
    'Cauca': [2.404, -76.615], 'Cesar': [9.444, -73.616], 'Chocó': [5.556, -76.757],
    'Córdoba': [8.305, -75.870], 'Cundinamarca': [4.789, -73.963], 'Guainía': [2.477, -68.802],
    'Guaviare': [2.012, -71.745], 'Huila': [2.551, -75.438], 'La Guajira': [11.530, -72.639],
    'Magdalena': [10.320, -74.208], 'Meta': [3.513, -72.697], 'Nariño': [1.609, -77.899],
    'Norte de Santander': [8.016, -72.977], 'Putumayo': [0.551, -75.601], 'Quindío': [4.499, -75.666],
    'Risaralda': [5.088, -75.981], 'San Andrés': [12.569, -81.714], 'Santander': [7.1193, -73.1227],
    'Sucre': [9.068, -74.881], 'Tolima': [3.896, -75.250], 'Valle del Cauca': [3.811, -76.541],
    'Vaupés': [0.814, -70.612], 'Vichada': [4.698, -69.418]
  };

  private centerLat = 7.1193;
  private centerLng = -73.1227;

  ngOnInit(): void {
    this.cargarDatos();
  }

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

  private cargarDatos(): void {
    const user = this.authService.getUsuarioActual();
    if (!user) return;

    this.dataService.getInspeccionesPorTecnico(user.id).subscribe(inspecciones => {
      // Set map center based on technician department
      if (user.departamento && this.mapCoordinates[user.departamento]) {
        [this.centerLat, this.centerLng] = this.mapCoordinates[user.departamento];
      }

      this.stats = {
        pendientes: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente')).length,
        alertas: 0,
        enProgreso: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('progreso')).length,
        completadas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('completada')).length,
      };

      if (inspecciones.length === 0) {
        this.listaInspecciones = [];
        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.iniciarMapa(), 300);
        }
        return;
      }

      // ── BATCH: Cargar TODOS los predios en UNA sola petición (elimina N+1) ──
      const predioIds = inspecciones.map(ins => ins.predio_id || ins.predioId || '');
      this.dataService.getPrediosBatch(predioIds).subscribe(predios => {
        const predioMap = new Map(predios.map(p => [p.id, p]));

        // BATCH: Load all producers
        const productorIds = [...new Set(predios.map(p => p.productor_id).filter(id => !!id))] as string[];
        
        // As a fallback if we can't batch fetch producers easily without a new method, we'll iterate or use the predio's productorNombre
        
        this.listaInspecciones = inspecciones.map(ins => {
          const predio = predioMap.get(ins.predio_id || ins.predioId || '');
          const normalizedState = (ins.estado || '').toLowerCase();
          const displayState = normalizedState.includes('completada') ? 'Completada' 
                             : normalizedState.includes('progreso') ? 'En Progreso' 
                             : 'Pendiente';

          return {
            id: ins.id, // Remove .toUpperCase() so it matches the route param accurately
            productor: predio?.productorNombre || predio?.nombre || '—',
            predio: predio?.nombre || '—',
            estado: displayState,
            prioridad: displayState === 'Pendiente' ? 'Alta'
              : displayState === 'En Progreso' ? 'Media' : 'Baja',
            lat: predio?.latitud || this.centerLat,
            lng: predio?.longitud || this.centerLng,
          };
        });

        // Try to fetch real producer names
        productorIds.forEach(pid => {
          this.dataService.getUsuarioPorId(pid).subscribe(prod => {
            if (prod) {
              this.listaInspecciones.forEach(i => {
                const p = predioMap.get(inspecciones.find(ins => ins.id === i.id)?.predio_id || '');
                if (p && p.productor_id === pid) {
                  i.productor = `${prod.nombre} ${prod.apellido || ''}`.trim();
                }
              });
            }
          });
        });

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.iniciarMapa(), 300);
        }
      });
    });
  }

  public get listaCoordenadas(): any[] {
    return this.listaInspecciones;
  }

  private async iniciarMapa(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.listaCoordenadas || !Array.isArray(this.listaCoordenadas)) return;
    const container = document.getElementById('mapaTecnico');
    if (!container) return;

    if (!this.L) {
      const leaflet = await import('leaflet');
      this.L = leaflet.default && typeof leaflet.default.map === 'function' ? leaflet.default : leaflet;
    }

    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        console.warn('Error removing map:', e);
      }
      this.map = null;
    }

    try {
      this.map = this.L.map('mapaTecnico').setView([this.centerLat, this.centerLng], 9);
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      this.listaInspecciones.forEach((item) => {
        const color = item.prioridad === 'Alta' ? '#ef4444' : '#1b2610';
        const icon = this.L.divIcon({
          html: `<span class="material-icons" style="color: ${color}; font-size: 32px;">location_on</span>`,
          className: 'custom-pin', iconSize: [32, 32],
        });
        this.L.marker([item.lat, item.lng], { icon })
          .bindPopup(`<b>${item.predio}</b><br>${item.productor}`)
          .addTo(this.map);
      });
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }
}
