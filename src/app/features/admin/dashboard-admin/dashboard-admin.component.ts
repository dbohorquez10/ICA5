import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { FitoDataService, Inspeccion, Predio, Lote, Usuario } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin, of, Subject } from 'rxjs';
import { map, catchError, takeUntil, switchMap } from 'rxjs/operators';

/**
 * Panel de control central para administradores.
 * Implementa OnDestroy con el patrón destroy$ para cancelar
 * todas las suscripciones al desmontar el componente (evita memory leaks).
 */
@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css'],
  standalone: false
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  private notify = inject(NotificationService);

  /** Subject que emite al destruir el componente para cancelar todas las suscripciones. */
  private destroy$ = new Subject<void>();

   public metricas = { productores: 0, tecnicos: 0, inspeccionesPendientes: 0, alertas: 0 };
  public solicitudesPendientes: Array<any> = [];

  public modalAsignacionVisible = false;
  public inspeccionSeleccionada: string = '';
  public tecnicosDisponibles: Usuario[] = [];
  public tecnicoSeleccionado: string = '';
  
  public modalRechazoVisible = false;
  public justificacionRechazo = '';

  constructor(
    private dataService: FitoDataService,
    private authService: AuthService
  ) {}

  ngOnInit(): void { this.recargar(); }

  ngOnDestroy(): void {
    // Emitir y completar el Subject cancela automáticamente TODOS los takeUntil encadenados
    this.destroy$.next();
    this.destroy$.complete();
  }

  private recargar(): void {
    const admin = this.authService.getUsuarioActual();
    const adminDep = admin?.departamento || '';

    forkJoin({
      usuarios: this.dataService.getUsuarios().pipe(catchError(() => of([] as Usuario[]))),
      inspecciones: this.dataService.getInspecciones().pipe(catchError(() => of([] as Inspeccion[]))),
      pendientes: this.dataService.getInspeccionesPendientes().pipe(catchError(() => of([] as Inspeccion[]))),
    }).pipe(
      takeUntil(this.destroy$),
      // --- Aplanar con switchMap: reemplaza el subscribe anidado de getPrediosBatch ---
      switchMap(({ usuarios, inspecciones, pendientes }) => {
        const usuariosFiltrados = adminDep
          ? usuarios.filter((u: Usuario) => u.departamento === adminDep)
          : usuarios;

        const predioIds = Array.from(new Set([
          ...inspecciones.map((ins: Inspeccion) => ins.predio_id || ins.predioId || ''),
          ...pendientes.map((ins: Inspeccion) => ins.predio_id || ins.predioId || '')
        ].filter(Boolean)));

        if (predioIds.length === 0) {
          // Sin inspecciones: devolver los datos base sin query adicional
          return of({ usuariosFiltrados, inspecciones, pendientes, prediosMap: new Map<string, Predio>() });
        }

        return this.dataService.getPrediosBatch(predioIds).pipe(
          catchError(() => of([] as Predio[])),
          map((prediosBatch: Predio[]) => {
            const prediosMap = new Map<string, Predio>();
            prediosBatch.forEach((p: Predio) => prediosMap.set(p.id, p));
            return { usuariosFiltrados, inspecciones, pendientes, prediosMap };
          })
        );
      }),
      // --- Segundo switchMap: aplanar forkJoin de lotes (antes era el 3.er subscribe anidado) ---
      switchMap(({ usuariosFiltrados, inspecciones, pendientes, prediosMap }) => {
        const inspeccionesFiltradas = adminDep
          ? inspecciones.filter((i: Inspeccion) => prediosMap.get(i.predio_id || i.predioId || '')?.departamento === adminDep)
          : inspecciones;

        const pendientesFiltradas = adminDep
          ? pendientes.filter((i: Inspeccion) => prediosMap.get(i.predio_id || i.predioId || '')?.departamento === adminDep)
          : pendientes;

        const uniquePredioIdsPendientes = [...new Set(
          pendientesFiltradas.map((ins: Inspeccion) => ins.predio_id || ins.predioId || '').filter(Boolean)
        )];

        const lotesObservables = uniquePredioIdsPendientes.map((pId: string) =>
          this.dataService.getLotesPorPredio(pId).pipe(
            map((lotes: Lote[]) => ({ predioId: pId, count: lotes.length })),
            catchError(() => of({ predioId: pId, count: 0 }))
          )
        );

        const lotes$ = lotesObservables.length > 0
          ? forkJoin(lotesObservables)
          : of([] as Array<{ predioId: string; count: number }>);

        return lotes$.pipe(
          map(lotesCounts => ({
            usuariosFiltrados, inspeccionesFiltradas, pendientesFiltradas, prediosMap, lotesCounts
          }))
        );
      })
    ).subscribe(({ usuariosFiltrados, inspeccionesFiltradas, pendientesFiltradas, prediosMap, lotesCounts }) => {
      // Actualizar métricas
      this.metricas = {
        productores: usuariosFiltrados.filter((u: Usuario) => u.rol === 'productor').length,
        tecnicos: usuariosFiltrados.filter((u: Usuario) => u.rol === 'tecnico').length,
        inspeccionesPendientes: inspeccionesFiltradas.filter((i: Inspeccion) => (i.estado || '').toLowerCase().includes('pendiente')).length,
        alertas: inspeccionesFiltradas.filter((i: Inspeccion) => (i.estado || '').toLowerCase().includes('progreso')).length,
      };

      const countsMap = new Map<string, number>();
      lotesCounts.forEach((item) => countsMap.set(item.predioId, item.count));

      // Mapear las solicitudes pendientes con datos enriquecidos
      this.solicitudesPendientes = pendientesFiltradas.map((ins: Inspeccion) => {
        const predioId = ins.predio_id || ins.predioId || '';
        const predioObj = prediosMap.get(predioId);
        const loc = predioObj
          ? [predioObj.vereda, predioObj.municipio, predioObj.departamento].filter(Boolean).join(', ')
          : '—';

        return {
          ...ins,
          predioId,
          predioNombre: predioObj?.nombre || 'Predio Desconocido',
          departamento: predioObj?.departamento || '',
          ubicacion: loc || '—',
          tecnicoNombre: ins.tecnico_nombre || ins.tecnicoNombre || 'Sin asignar',
          fechaSolicitada: ins.fecha_inspeccion || ins.fechaSolicitada,
          modoAsignacion: ins.modo_asignacion || ins.modoAsignacion || 'automatica',
          lotesCount: countsMap.get(predioId) || 0
        };
      });
    });
  }

  public asignarTecnico(id: string): void {
    this.inspeccionSeleccionada = id;
    const sol = this.solicitudesPendientes.find(s => s.id === id);
    const dep = sol?.departamento || '';

    this.modalRechazoVisible = sol?.modoAsignacion === 'preferencia';
    this.justificacionRechazo = '';

    this.dataService.getTecnicosActivos().pipe(
      takeUntil(this.destroy$)
    ).subscribe(t => {
      this.tecnicosDisponibles = dep ? t.filter(x => x.departamento === dep) : t;
      this.tecnicoSeleccionado = '';
      this.modalAsignacionVisible = true;
    });
  }

  public aprobarPreferencia(id: string): void {
    this.dataService.actualizarInspeccion(id, { estado: 'en_progreso' }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notify.showSuccess('Inspección con técnico preferido aprobada exitosamente.');
        this.recargar();
      },
      error: () => this.notify.showError('No se pudo aprobar la inspección.')
    });
  }

  public confirmarAsignacion(): void {
    if (!this.tecnicoSeleccionado) { this.notify.showError('Selecciona un técnico.'); return; }
    
    if (this.modalRechazoVisible) {
      if (!this.justificacionRechazo || !this.justificacionRechazo.trim()) {
        this.notify.showError('Debes ingresar la justificación por la cual reasignas la visita.');
        return;
      }
      this.dataService.actualizarInspeccion(this.inspeccionSeleccionada, {
        tecnico_id: this.tecnicoSeleccionado,
        razon_rechazo: this.justificacionRechazo.trim(),
        estado: 'en_progreso'
      }).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.modalAsignacionVisible = false;
          this.notify.showSuccess('Inspección reasignada exitosamente.');
          this.recargar();
        },
        error: () => this.notify.showError('No se pudo reasignar la inspección.')
      });
    } else {
      this.dataService.asignarTecnicoAInspeccion(this.inspeccionSeleccionada, this.tecnicoSeleccionado)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.modalAsignacionVisible = false;
          this.notify.showSuccess('Técnico asignado exitosamente.');
          this.recargar();
        });
    }
  }

  public rechazarPreferencia(id: string): void {
    const motivo = prompt('Por favor, indique el motivo de rechazo de la asignación del técnico de preferencia:');
    if (motivo === null) return;
    if (!motivo.trim()) {
      this.notify.showError('El motivo de rechazo es obligatorio.');
      return;
    }

    this.dataService.actualizarEstadoInspeccion(id, 'rechazada', motivo.trim()).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.notify.showSuccess('Solicitud de asignación rechazada exitosamente.');
        this.recargar();
      },
      error: (err) => {
        const errorDetail = err?.error?.detail || 'No se pudo rechazar la solicitud.';
        this.notify.showError(errorDetail);
      }
    });
  }

  public cerrarModalAsignacion(): void {
    this.modalAsignacionVisible = false;
    this.modalRechazoVisible = false;
    this.justificacionRechazo = '';
  }
}
