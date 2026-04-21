import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-panel-general',
  templateUrl: './panel-general.component.html',
  styleUrls: ['./panel-general.component.css'],
  standalone: false,
})
export class PanelGeneralComponent implements OnInit {
  usuarioActual: any = null;
  private map: any;
  private L: any;

  resumenAgricola = { totalPredios: 2, hectareas: 57, pendientes: 1 };
  climaActual = { temp: 26, condicion: 'Parcialmente Nublado', lluvia: 30 };
  statsTecnico = { pendientes: 4, alertas: 1, completadas: 15 };

  solicitudesMapa = [
    { id: 1, predio: 'Finca La Esmeralda', lat: 7.1193, lng: -73.1227, prioridad: 'Normal' },
    { id: 2, predio: 'Hacienda El Recreo', lat: 7.068, lng: -73.169, prioridad: 'Alta' },
  ];

  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.authService.getUsuario().subscribe((user) => {
      this.usuarioActual = user;
      if (this.usuarioActual?.rol === 'tecnico') {
        setTimeout(() => this.iniciarMapa(), 300);
      }
    });
  }

  async iniciarMapa() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.L) this.L = await import('leaflet');
      this.map = this.L.map('mapaGeneral').setView([7.1193, -73.1227], 11);
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      this.solicitudesMapa.forEach((sol) => {
        const color = sol.prioridad === 'Alta' ? '#ff5e57' : '#1b2610';
        const icon = this.L.divIcon({
          html: `<span class="material-icons" style="color: ${color}; font-size: 32px; drop-shadow: 2px 2px 4px rgba(0,0,0,0.4);">location_on</span>`,
          className: 'custom-pin',
          iconSize: [32, 32],
        });
        this.L.marker([sol.lat, sol.lng], { icon })
          .bindPopup(`<b>${sol.predio}</b>`)
          .addTo(this.map);
      });
    }
  }
}
