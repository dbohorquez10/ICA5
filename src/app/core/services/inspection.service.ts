import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap, shareReplay, tap } from 'rxjs/operators';
import { API_CONFIG } from './api.config';

/**
 * PILAR 2: SERVICIO OPTIMIZADO CON DETECCIÓN DE CAMBIOS
 * Usa observables reactivos y shareReplay para evitar cambios sin renderizar
 * Lugar: src/app/core/services/inspection.service.ts
 */
@Injectable({ providedIn: 'root' })
export class InspectionService {
  private coreUrl = API_CONFIG.CORE;
  private insUrl = API_CONFIG.INSPECCIONES;

  // BehaviorSubjects para manejar cambios reactivos
  private prediosSubject = new BehaviorSubject<any[]>([]);
  private inspeccionesSubject = new BehaviorSubject<any[]>([]);
  private usuarioFiltersSubject = new BehaviorSubject<{ rol?: string; deptId?: string }>({});

  // Observables públicos con shareReplay para evitar N+1
  public predios$ = this.prediosSubject.asObservable();
  public inspecciones$ = this.inspeccionesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeReactiveQueries();
  }

  /**
   * Inicializa los observables reactivos
   * Cuando cambia el filtro de usuario, automáticamente recarga datos
   */
  private initializeReactiveQueries(): void {
    this.usuarioFiltersSubject.pipe(
      switchMap(filters =>
        this.http.get<any[]>(`${this.coreUrl}/predios`, { params: filters as any })
      ),
      shareReplay(1)
    ).subscribe(predios => this.prediosSubject.next(predios));

    this.usuarioFiltersSubject.pipe(
      switchMap(filters =>
        this.http.get<any[]>(`${this.insUrl}/inspecciones`, { params: filters as any })
      ),
      shareReplay(1)
    ).subscribe(inspecciones => this.inspeccionesSubject.next(inspecciones));
  }

  /**
   * Actualiza el filtro de usuario (rol, departamento)
   * Automáticamente trigger los switchMap y recarga datos
   */
  setUsuarioFilters(filters: { rol?: string; deptId?: string }): void {
    this.usuarioFiltersSubject.next(filters);
  }

  /**
   * Obtiene inspecciones con la jerarquía completa en UNA consulta
   * Reemplaza múltiples peticiones con una sola
   */
  getInspeccionesOptimizado(filters?: any): Observable<any[]> {
    return this.http.get<any[]>(`${this.insUrl}/inspecciones/optimized`, { params: filters });
  }

  /**
   * Obtiene predios filtrados por rol y departamento
   */
  getPrediosFiltrados(rol?: string, deptId?: string): Observable<any[]> {
    return this.predios$ = this.http.get<any[]>(
      `${this.coreUrl}/predios/filtrados`,
      { params: { ...(rol && { rol }), ...(deptId && { dept_id: deptId }) } }
    ).pipe(shareReplay(1));
  }

  /**
   * Asigna un técnico a un lugar de producción
   */
  asignarTecnico(predioId: string, tecnicoId: string): Observable<any> {
    return this.http.patch(`${this.coreUrl}/predios/${predioId}/asignar-tecnico`, {
      tecnico_id: tecnicoId
    }).pipe(
      tap(() => {
        // Recargar datos después de la asignación
        this.setUsuarioFilters(this.usuarioFiltersSubject.value);
      })
    );
  }
}
