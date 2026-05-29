import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { FitoDataService, Predio } from '../../../core/services/fito-data.service';
import { forkJoin, Subscription } from 'rxjs';

/**
 * @description
 * Renderiza el panel principal o dashboard de bienvenida para el usuario autenticado en FitoGestión. Muestra resúmenes métricos relevantes y despliega un mapa interactivo (Leaflet) con la geolocalización de las solicitudes de inspección activas.
 *
 * @usageNotes
 * Componente transversal que se adapta a distintos roles (admin, tecnico, productor). Requiere inyección de `AuthService` para obtener la sesión del usuario. Depende de `PLATFORM_ID` para asegurar la inicialización del mapa Leaflet exclusivamente en el cliente (navegador).
 */
@Component({
  selector: 'app-panel-general',
  templateUrl: './panel-general.component.html',
  styleUrls: ['./panel-general.component.css'],
  standalone: false,
})
export class PanelGeneralComponent implements OnInit, OnDestroy {
  usuarioActual: any = null;
  private map: any;
  private L: any;
  private sub: Subscription | null = null;

  resumenAgricola = { totalPredios: 0, hectareas: 0, pendientes: 0 };
  climaActual = { temp: 0, condicion: 'Cargando...', lluvia: 0 };
  statsTecnico = { pendientes: 0, alertas: 0, completadas: 0 };

  solicitudesMapa: Array<{ id: string; predio: string; lat: number; lng: number; prioridad: string }> = [];

  constructor(
    private authService: AuthService,
    private dataService: FitoDataService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    // ── Carga INMEDIATA usando valor sincrónico (soluciona "toca pulsar algo") ──
    const user = this.authService.getUsuarioActual();
    if (user) {
      this.usuarioActual = user;
      this.cargarDatosReales();
    } else {
      // Fallback: si el usuario aún no se ha resuelto, suscribirse al observable
      this.sub = this.authService.getUsuario().subscribe((u) => {
        if (u && !this.usuarioActual) {
          this.usuarioActual = u;
          this.cargarDatosReales();
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.map) { this.map.remove(); this.map = null; }
  }

  private cargarDatosReales(): void {
    const rol = this.usuarioActual?.rol;

    if (rol === 'productor') {
      // Cargar predios del productor
      this.dataService.getPrediosPorProductor(this.usuarioActual.id).subscribe(predios => {
        this.resumenAgricola.totalPredios = predios.length;
        this.resumenAgricola.hectareas = predios.reduce((sum, p) => sum + (p.area_total || 0), 0);

        // Cargar inspecciones pendientes de sus predios
        this.dataService.getInspecciones().subscribe(inspecciones => {
          const predioIds = (predios || []).map(p => p.id);
          const misPendientes = inspecciones.filter(i =>
            predioIds.includes(i.predio_id || i.predioId || '') &&
            (i.estado || '').toLowerCase().includes('pendiente')
          );
          this.resumenAgricola.pendientes = misPendientes.length;

          // Preparar marcadores del mapa
          this.solicitudesMapa = predios
            .filter(p => p.latitud && p.longitud)
            .map(p => ({
              id: p.id,
              predio: p.nombre,
              lat: p.latitud!,
              lng: p.longitud!,
              prioridad: 'Normal',
            }));

          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.iniciarMapa(), 300);
          }
          this.cdr.detectChanges();
        });
      });

    } else if (rol === 'tecnico') {
      this.dataService.getInspeccionesPorTecnico(this.usuarioActual.id).subscribe(inspecciones => {
        this.statsTecnico = {
          pendientes: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente')).length,
          alertas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('progreso')).length,
          completadas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('completada')).length,
        };

        // Cargar marcadores del mapa para inspecciones pendientes (BATCH — no N+1)
        const pendientes = inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente'));
        if (pendientes.length > 0) {
          const predioIds = (pendientes || []).map(ins => ins.predio_id || ins.predioId || '');
          this.dataService.getPrediosBatch(predioIds).subscribe(predios => {
            const predioMap = new Map(predios.map(p => [p.id, p]));
            this.solicitudesMapa = pendientes
              .map(ins => {
                const p = predioMap.get(ins.predio_id || ins.predioId || '');
                return p && p.latitud && p.longitud ? {
                  id: ins.id,
                  predio: p.nombre,
                  lat: p.latitud!,
                  lng: p.longitud!,
                  prioridad: 'Alta',
                } : null;
              })
              .filter((x): x is NonNullable<typeof x> => !!x);
            if (isPlatformBrowser(this.platformId)) {
              setTimeout(() => this.iniciarMapa(), 300);
            }
            this.cdr.detectChanges();
          });
        } else {
          this.solicitudesMapa = [];
          if (isPlatformBrowser(this.platformId)) {
            setTimeout(() => this.iniciarMapa(), 300);
          }
          this.cdr.detectChanges();
        }
      });

    } else if (rol === 'admin') {
      // Redirigir admin directamente a su panel funcional
      this.router.navigate(['/app/admin/dashboard']);
      return;
    }
  }

  async iniciarMapa() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.map) {
        try {
          this.map.remove();
        } catch (e) {
          console.warn('Error removing map:', e);
        }
        this.map = null;
      }

      if (!this.L) {
        const leaflet = await import('leaflet');
        this.L = leaflet.default || leaflet;
      }
      const center = this.solicitudesMapa.length > 0
        ? [this.solicitudesMapa[0].lat, this.solicitudesMapa[0].lng]
        : [7.1193, -73.1227];

      this.cargarClima(center[0] as number, center[1] as number);

      this.map = this.L.map('mapaGeneral').setView(center as any, 11);
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

  private cargarClima(lat: number, lng: number): void {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation,weather_code`;
    fetch(url).then(res => res.json()).then(data => {
      if (data && data.current) {
        this.climaActual.temp = Math.round(data.current.temperature_2m);
        this.climaActual.lluvia = data.current.precipitation || 0;
        const code = data.current.weather_code;
        if (code === 0) this.climaActual.condicion = 'Despejado';
        else if (code >= 1 && code <= 3) this.climaActual.condicion = 'Parcialmente Nublado';
        else if (code >= 45 && code <= 48) this.climaActual.condicion = 'Niebla';
        else if (code >= 51 && code <= 67) this.climaActual.condicion = 'Lluvia';
        else if (code >= 71 && code <= 77) this.climaActual.condicion = 'Nieve';
        else if (code >= 80 && code <= 82) this.climaActual.condicion = 'Aguaceros';
        else if (code >= 95) this.climaActual.condicion = 'Tormenta';
        else this.climaActual.condicion = 'Variable';
        this.cdr.detectChanges();
      }
    }).catch(err => {
      console.error('Error fetching weather:', err);
      this.climaActual = { temp: 26, condicion: 'Desconocido', lluvia: 0 };
    });
  }
}
