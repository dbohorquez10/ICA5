import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
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
  climaActual = { temp: 26, condicion: 'Parcialmente Nublado', lluvia: 30 };
  statsTecnico = { pendientes: 0, alertas: 0, completadas: 0 };

  solicitudesMapa: Array<{ id: string; predio: string; lat: number; lng: number; prioridad: string }> = [];

  constructor(
    private authService: AuthService,
    private dataService: FitoDataService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
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
          const predioIds = predios.map(p => p.id);
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

          if (isPlatformBrowser(this.platformId) && this.solicitudesMapa.length > 0) {
            setTimeout(() => this.iniciarMapa(), 300);
          }
          this.cdr.detectChanges();
        });
      });

    } else if (rol === 'tecnico') {
      this.dataService.getInspecciones().subscribe(inspecciones => {
        this.statsTecnico = {
          pendientes: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente')).length,
          alertas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('progreso')).length,
          completadas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('completada')).length,
        };

        // Cargar marcadores del mapa para inspecciones pendientes (BATCH — no N+1)
        const pendientes = inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente'));
        if (pendientes.length > 0) {
          const predioIds = pendientes.map(ins => ins.predio_id || ins.predioId || '');
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
            if (isPlatformBrowser(this.platformId) && this.solicitudesMapa.length > 0) {
              setTimeout(() => this.iniciarMapa(), 300);
            }
            this.cdr.detectChanges();
          });
        } else {
          this.cdr.detectChanges();
        }
      });

    } else if (rol === 'admin') {
      forkJoin({
        usuarios: this.dataService.getUsuarios(),
        inspecciones: this.dataService.getInspecciones(),
        predios: this.dataService.getPredios(),
      }).subscribe(({ usuarios, inspecciones, predios }) => {
        this.resumenAgricola = {
          totalPredios: predios.length,
          hectareas: predios.reduce((sum, p) => sum + (p.area_total || 0), 0),
          pendientes: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente')).length,
        };
        this.statsTecnico = {
          pendientes: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('pendiente')).length,
          alertas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('progreso')).length,
          completadas: inspecciones.filter(i => (i.estado || '').toLowerCase().includes('completada')).length,
        };

        // Mapa con todos los predios
        this.solicitudesMapa = predios
          .filter(p => p.latitud && p.longitud)
          .map(p => ({
            id: p.id,
            predio: p.nombre,
            lat: p.latitud!,
            lng: p.longitud!,
            prioridad: 'Normal',
          }));
        if (isPlatformBrowser(this.platformId) && this.solicitudesMapa.length > 0) {
          setTimeout(() => this.iniciarMapa(), 300);
        }
        this.cdr.detectChanges();
      });
    }
  }

  async iniciarMapa() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.L) this.L = await import('leaflet');
      const center = this.solicitudesMapa.length > 0
        ? [this.solicitudesMapa[0].lat, this.solicitudesMapa[0].lng]
        : [7.1193, -73.1227];

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
}
