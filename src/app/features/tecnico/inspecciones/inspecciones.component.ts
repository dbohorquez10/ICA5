import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FitoDataService, Inspeccion, Predio } from '../../../core/services/fito-data.service';
import { forkJoin } from 'rxjs';

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
    private dataService: FitoDataService
  ) {}

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
    this.dataService.getInspecciones().subscribe(inspecciones => {
      this.stats = {
        pendientes: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente')).length,
        alertas: 0,
        enProgreso: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('progreso')).length,
        completadas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('completada')).length,
      };

      // Para cada inspección, cargar datos del predio
      const predioRequests = inspecciones.map(ins => {
        const predioId = ins.predio_id || ins.predioId || '';
        return this.dataService.getPredio(predioId);
      });

      if (predioRequests.length === 0) {
        this.listaInspecciones = [];
        return;
      }

      forkJoin(predioRequests).subscribe(predios => {
        this.listaInspecciones = inspecciones.map((ins, i) => {
          const predio = predios[i];
          return {
            id: ins.id.toUpperCase(),
            productor: predio?.productorNombre || predio?.nombre || '—',
            predio: predio?.nombre || '—',
            estado: ins.estado,
            prioridad: (ins.estado || '').toLowerCase().includes('pendiente') ? 'Alta'
              : (ins.estado || '').toLowerCase().includes('progreso') ? 'Media' : 'Baja',
            lat: predio?.latitud || 7.1193,
            lng: predio?.longitud || -73.1227,
          };
        });

        if (isPlatformBrowser(this.platformId)) {
          setTimeout(() => this.iniciarMapa(), 300);
        }
      });
    });
  }

  private async iniciarMapa(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.L) this.L = await import('leaflet');

    this.map = this.L.map('mapaTecnico').setView([7.1193, -73.1227], 11);
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
  }
}
