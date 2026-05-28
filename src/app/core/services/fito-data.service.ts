import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { API_CONFIG } from './api.config';

// =============================================
// INTERFACES DEL MODELO DE DATOS
// =============================================

export interface Cultivo {
  id: string;
  nombre: string;
  nombre_cientifico?: string;
  variedad: string;
  icono?: string;
  color?: string;
  descripcion?: string;
}

export interface Plaga {
  id: string;
  nombre_comun: string;
  nombre_cientifico?: string;
  tipo: string;
  riesgo: 'Alto' | 'Medio' | 'Bajo';
  descripcion: string;
  cultivos_afectados?: string[];
  /** Alias de compatibilidad frontend */
  nombre?: string;
  icon?: string;
  color?: string;
}

export interface Lote {
  id: string;
  predio_id: string;
  nombre: string;
  cultivo_id?: string;
  area?: number;
  plantas_por_hectarea?: number;
  num_plantas?: number;
  estado: string;
  /** Alias de compatibilidad frontend */
  predioId?: string;
  cultivoId?: string;
  hectareas?: number;
  plantasPorHectarea?: number;
}

export interface Predio {
  id: string;
  nombre: string;
  productor_id?: string;
  lugar_id?: string;
  departamento?: string;
  municipio?: string;
  vereda?: string;
  numero_registro_ica?: string;
  latitud?: number;
  longitud?: number;
  area_total?: number;
  /** Alias de compatibilidad frontend */
  ubicacion?: string;
  numeroRegistroIca?: string;
  productorNombre?: string;
}

export interface LugarProduccion {
  id: string;
  productor_id: string;
  nombre: string;
  numero_registro_ica?: string;
  departamento: string;
  municipio: string;
  vereda?: string;
  latitud?: number;
  longitud?: number;
  activo?: boolean;
  created_at?: string;
  predios?: Predio[];
}

export interface RegistroPlanta {
  id?: string;
  sub_inspeccion_id?: string;
  numero_planta: number;
  plaga_id?: string;
  sintoma?: string;
  severidad?: string;
  incidencia?: number;
  estado_planta?: string;
  observaciones?: string;
  /** Alias de compatibilidad */
  numeroPlanta?: number;
  plagasDetectadas?: string[];
}

export interface SubInspeccionLote {
  id?: string;
  inspeccion_id?: string;
  codigo_punto?: string;
  ubicacion_referencia?: string;
  observaciones?: string;
  estado: 'Pendiente' | 'En Progreso' | 'Completada' | 'pendiente' | 'completado';
  /** Campos de compatibilidad frontend */
  loteId?: string;
  plantasEvaluadas?: number;
  plantas_evaluadas?: number;
  registroPlantas?: RegistroPlanta[];
  incidenciasCalculadas?: { plagaId: string; porcentaje: number }[];
}

export interface Inspeccion {
  id: string;
  tecnico_id?: string;
  tecnico_nombre?: string;
  predio_id?: string;
  lote_id?: string;
  fecha_inspeccion?: string;
  tipo_inspeccion?: string;
  estado: 'Pendiente' | 'En Progreso' | 'Completada' | 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  modo_asignacion?: string;
  observaciones?: string;
  resultado_general?: string;
  fecha_cierre?: string;
  sub_inspecciones?: SubInspeccionLote[];
  /** Alias de compatibilidad frontend */
  predioId?: string;
  tecnicoNombre?: string;
  fechaSolicitada?: string;
  modoAsignacion?: string;
  subInspecciones?: SubInspeccionLote[];
  estado_aprobacion?: 'pendiente' | 'aprobado' | 'rechazado';
  razon_rechazo?: string;
  incidencia_global_pct?: number;
  nivel_alerta?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido?: string;
  email?: string;
  cedula?: string;
  rol: 'productor' | 'tecnico' | 'admin';
  telefono?: string;
  registro_ica?: string;
  departamento?: string;
  municipio?: string;
  vereda?: string;
  activo?: boolean;
  created_at?: string;
  /** Alias de compatibilidad frontend */
  correo?: string;
  estado?: 'Activo' | 'Suspendido';
  fechaRegistro?: string;
  zona?: string;
  identificacion?: string;
  tarjetaProfesional?: string;
}

export interface Notificacion {
  id: string;
  usuario_id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  created_at: string;
}

// =============================================
// SERVICIO CENTRAL — CONECTADO AL API GATEWAY
// =============================================

@Injectable({ providedIn: 'root' })
export class FitoDataService {

  private coreUrl = API_CONFIG.CORE;
  private insUrl = API_CONFIG.INSPECCIONES;

  constructor(private http: HttpClient) {}

  // ── CULTIVOS ───────────────────────────────────────────────────────────────

  getCultivos(): Observable<Cultivo[]> {
    return this.http.get<Cultivo[]>(`${this.coreUrl}/catalogos/cultivos`);
  }

  getCultivoPorId(id: string): Observable<Cultivo> {
    return this.http.get<Cultivo>(`${this.coreUrl}/catalogos/cultivos/${id}`);
  }

  agregarCultivo(cultivo: Partial<Cultivo>): Observable<Cultivo> {
    return this.http.post<Cultivo>(`${this.coreUrl}/catalogos/cultivos`, cultivo);
  }

  editarCultivo(id: string, datos: Partial<Cultivo>): Observable<Cultivo> {
    return this.http.put<Cultivo>(`${this.coreUrl}/catalogos/cultivos/${id}`, datos);
  }

  eliminarCultivo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.coreUrl}/catalogos/cultivos/${id}`);
  }

  // ── PLAGAS ─────────────────────────────────────────────────────────────────

  /** Normaliza la respuesta del backend añadiendo alias de compatibilidad frontend. */
  private normalizarPlaga(p: any): Plaga {
    return {
      ...p,
      nombre: p.nombre_comun || p.nombre,
      icon: p.icon || 'bug_report',
      color: p.color || '#64748b',
      riesgo: p.riesgo || 'Medio',
    };
  }

  /** Normaliza un predio añadiendo el campo `ubicacion` compuesto. */
  private normalizarPredio(p: any): Predio {
    return {
      ...p,
      ubicacion: p.ubicacion || [p.vereda, p.municipio, p.departamento].filter(Boolean).join(', ') || '—',
    };
  }

  getPlagas(): Observable<Plaga[]> {
    return this.http.get<any[]>(`${this.coreUrl}/catalogos/plagas`).pipe(
      map(plagas => plagas.map(p => this.normalizarPlaga(p)))
    );
  }

  getPlagasByPrediosCultivos(cultivoId: string): Observable<Plaga[]> {
    return this.http.get<Plaga[]>(`${this.coreUrl}/catalogos/plagas/por-cultivo/${cultivoId}`);
  }

  agregarPlaga(plaga: Partial<Plaga>): Observable<Plaga> {
    return this.http.post<Plaga>(`${this.coreUrl}/catalogos/plagas`, plaga);
  }

  editarPlaga(id: string, datos: Partial<Plaga>): Observable<Plaga> {
    return this.http.put<Plaga>(`${this.coreUrl}/catalogos/plagas/${id}`, datos);
  }

  eliminarPlaga(id: string): Observable<void> {
    return this.http.delete<void>(`${this.coreUrl}/catalogos/plagas/${id}`);
  }

  // ── PREDIOS ────────────────────────────────────────────────────────────────

  getPredios(): Observable<Predio[]> {
    return this.http.get<any[]>(`${this.coreUrl}/predios/`).pipe(
      map(predios => predios.map(p => this.normalizarPredio(p)))
    );
  }

  getPredio(id: string): Observable<Predio> {
    return this.http.get<any>(`${this.coreUrl}/predios/${id}`).pipe(
      map(p => this.normalizarPredio(p))
    );
  }

  getPrediosPorProductor(productorId: string): Observable<Predio[]> {
    return this.http.get<any[]>(`${this.coreUrl}/predios/productor/${productorId}`).pipe(
      map(predios => predios.map(p => this.normalizarPredio(p)))
    );
  }

  /**
   * Obtiene múltiples predios por sus IDs en UNA sola petición.
   * Elimina el problema N+1 de llamar getPredio() en un loop.
   */
  getPrediosBatch(ids: string[]): Observable<Predio[]> {
    if (!ids.length) return of([]);
    // Deduplicar IDs
    const uniqueIds = [...new Set(ids.filter(id => !!id))];
    if (!uniqueIds.length) return of([]);
    return this.http.post<any[]>(`${this.coreUrl}/predios/batch`, { ids: uniqueIds }).pipe(
      map(predios => predios.map(p => this.normalizarPredio(p))),
      catchError(() => of([]))
    );
  }

  agregarPredio(predio: Partial<Predio>): Observable<Predio> {
    return this.http.post<any>(`${this.coreUrl}/predios/`, predio).pipe(
      map(p => this.normalizarPredio(p))
    );
  }

  actualizarPredio(id: string, datos: Partial<Predio>): Observable<Predio> {
    return this.http.put<any>(`${this.coreUrl}/predios/${id}`, datos).pipe(
      map(p => this.normalizarPredio(p))
    );
  }

  // ── LUGARES DE PRODUCCIÓN ───────────────────────────────────────────────────

  getLugaresPorProductor(productorId: string): Observable<LugarProduccion[]> {
    return this.http.get<LugarProduccion[]>(`${this.coreUrl}/lugares/productor/${productorId}`);
  }

  getLugar(id: string): Observable<LugarProduccion> {
    return this.http.get<LugarProduccion>(`${this.coreUrl}/lugares/${id}`);
  }

  agregarLugar(lugar: Partial<LugarProduccion>): Observable<LugarProduccion> {
    return this.http.post<LugarProduccion>(`${this.coreUrl}/lugares/`, lugar);
  }

  actualizarLugar(id: string, datos: Partial<LugarProduccion>): Observable<LugarProduccion> {
    return this.http.put<LugarProduccion>(`${this.coreUrl}/lugares/${id}`, datos);
  }

  eliminarLugar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.coreUrl}/lugares/${id}`);
  }

  eliminarPredio(id: string): Observable<void> {
    return this.http.delete<void>(`${this.coreUrl}/predios/${id}`);
  }

  // ── LOTES ──────────────────────────────────────────────────────────────────

  getLotesPorPredio(predioId: string): Observable<Lote[]> {
    return this.http.get<Lote[]>(`${this.coreUrl}/lotes/predio/${predioId}`);
  }

  getLotePorId(id: string): Observable<Lote> {
    return this.http.get<Lote>(`${this.coreUrl}/lotes/${id}`);
  }

  agregarLote(lote: Partial<Lote>): Observable<Lote> {
    return this.http.post<Lote>(`${this.coreUrl}/lotes/`, lote);
  }

  editarLote(id: string, datos: Partial<Lote>): Observable<Lote> {
    return this.http.put<Lote>(`${this.coreUrl}/lotes/${id}`, datos);
  }

  eliminarLote(id: string): Observable<void> {
    return this.http.delete<void>(`${this.coreUrl}/lotes/${id}`);
  }

  // ── USUARIOS ───────────────────────────────────────────────────────────────

  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.coreUrl}/usuarios/`);
  }

  getUsuarioPorId(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.coreUrl}/usuarios/${id}`);
  }

  agregarUsuario(usuario: Partial<Usuario>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.coreUrl}/usuarios/`, usuario);
  }

  editarUsuario(id: string, datos: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.coreUrl}/usuarios/${id}`, datos);
  }

  eliminarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.coreUrl}/usuarios/${id}`);
  }

  suspenderUsuario(id: string): Observable<any> {
    return this.http.patch(`${this.coreUrl}/usuarios/${id}/toggle-estado`, {});
  }

  getTecnicosActivos(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.coreUrl}/usuarios/tecnicos/activos`);
  }

  getPreferenciasUsuario(id: string): Observable<any> {
    return this.http.get<any>(`${this.coreUrl}/usuarios/${id}/preferencias`);
  }

  actualizarPreferenciasUsuario(id: string, preferencias: any): Observable<any> {
    return this.http.put<any>(`${this.coreUrl}/usuarios/${id}/preferencias`, preferencias);
  }

  // ── NOTIFICACIONES ──────────────────────────────────────────────────────────

  getNotificaciones(usuarioId: string): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.coreUrl}/notificaciones/usuario/${usuarioId}`);
  }

  marcarNotificacionComoLeida(notificacionId: string): Observable<any> {
    return this.http.put(`${this.coreUrl}/notificaciones/${notificacionId}/leer`, {});
  }

  // ── INSPECCIONES ───────────────────────────────────────────────────────────

  getInspecciones(tecnicoId?: string): Observable<Inspeccion[]> {
    let params = new HttpParams();
    if (tecnicoId) {
      params = params.set('tecnico_id', tecnicoId);
    }
    return this.http.get<Inspeccion[]>(`${this.insUrl}/inspecciones/`, { params });
  }

  getInspeccionPorId(id: string): Observable<Inspeccion> {
    return this.http.get<Inspeccion>(`${this.insUrl}/inspecciones/${id}`);
  }

  getInspeccionesPendientes(): Observable<Inspeccion[]> {
    return this.http.get<Inspeccion[]>(`${this.insUrl}/inspecciones/estado/pendientes`);
  }

  getInspeccionesPorTecnico(tecnicoId: string): Observable<Inspeccion[]> {
    return this.http.get<Inspeccion[]>(`${this.insUrl}/inspecciones/tecnico/${tecnicoId}`);
  }

  getInspeccionesPorPredio(predioId: string): Observable<Inspeccion[]> {
    return this.http.get<Inspeccion[]>(`${this.insUrl}/inspecciones/predio/${predioId}`);
  }

  agregarInspeccion(inspeccion: Partial<Inspeccion>): Observable<Inspeccion> {
    return this.http.post<Inspeccion>(`${this.insUrl}/inspecciones/`, inspeccion);
  }

  actualizarInspeccion(id: string, datos: Partial<Inspeccion>): Observable<Inspeccion> {
    return this.http.put<Inspeccion>(`${this.insUrl}/inspecciones/${id}`, datos);
  }

  asignarTecnicoAInspeccion(inspeccionId: string, tecnicoIdOrNombre: string, tecnicoId?: string): Observable<any> {
    return this.http.patch(`${this.insUrl}/inspecciones/${inspeccionId}/asignar-tecnico`, {
      tecnico_id: tecnicoId || tecnicoIdOrNombre,
    });
  }

  finalizarInspeccion(inspeccionId: string, observaciones?: string): Observable<any> {
    return this.http.patch(`${this.insUrl}/inspecciones/${inspeccionId}/finalizar`, null, {
      params: observaciones ? { observaciones } : {},
    });
  }

  // ── SUB-INSPECCIONES ───────────────────────────────────────────────────────

  getSubInspeccionesPorInspeccion(inspeccionId: string): Observable<SubInspeccionLote[]> {
    return this.http.get<SubInspeccionLote[]>(`${this.insUrl}/sub-inspecciones/inspeccion/${inspeccionId}`);
  }

  crearSubInspeccion(sub: Partial<SubInspeccionLote>): Observable<SubInspeccionLote> {
    return this.http.post<SubInspeccionLote>(`${this.insUrl}/sub-inspecciones/`, sub);
  }

  actualizarSubInspeccion(subId: string, datos: Partial<SubInspeccionLote>): Observable<SubInspeccionLote> {
    return this.http.put<SubInspeccionLote>(`${this.insUrl}/sub-inspecciones/${subId}`, datos);
  }

  // ── REGISTRO DE PLANTAS ────────────────────────────────────────────────────

  getRegistrosPorSubInspeccion(subInspeccionId: string): Observable<RegistroPlanta[]> {
    return this.http.get<RegistroPlanta[]>(`${this.insUrl}/registro-plantas/sub-inspeccion/${subInspeccionId}`);
  }

  registrarPlanta(registro: Partial<RegistroPlanta>): Observable<RegistroPlanta> {
    return this.http.post<RegistroPlanta>(`${this.insUrl}/registro-plantas/`, registro);
  }

  registrarPlantasBulk(registros: Partial<RegistroPlanta>[]): Observable<any> {
    return this.http.post(`${this.insUrl}/registro-plantas/bulk`, registros);
  }

  getResumenFitosanitario(subInspeccionId: string): Observable<any> {
    return this.http.get(`${this.insUrl}/registro-plantas/resumen/sub-inspeccion/${subInspeccionId}`);
  }

  descargarInformePDF(inspeccionId: string): Observable<Blob> {
    return this.http.get(`${this.insUrl}/inspecciones/${inspeccionId}/informe/pdf`, {
      responseType: 'blob'
    });
  }

  evaluarAprobacion(inspeccionId: string, estadoAprobacion: string, justificacion?: string): Observable<any> {
    return this.http.patch(`${this.insUrl}/inspecciones/${inspeccionId}/aprobacion`, {
      estado_aprobacion: estadoAprobacion,
      justificacion: justificacion
    });
  }

  descargarCertificadoPDF(inspeccionId: string): Observable<Blob> {
    return this.http.get(`${this.insUrl}/inspecciones/${inspeccionId}/certificado/pdf`, {
      responseType: 'blob'
    });
  }
}
