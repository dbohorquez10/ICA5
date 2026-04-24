import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
  activo?: boolean;
  /** Alias de compatibilidad frontend */
  correo?: string;
  estado?: 'Activo' | 'Suspendido';
  fechaRegistro?: string;
  zona?: string;
  identificacion?: string;
  tarjetaProfesional?: string;
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

  getPlagas(): Observable<Plaga[]> {
    return this.http.get<Plaga[]>(`${this.coreUrl}/catalogos/plagas`);
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
    return this.http.get<Predio[]>(`${this.coreUrl}/predios/`);
  }

  getPredio(id: string): Observable<Predio> {
    return this.http.get<Predio>(`${this.coreUrl}/predios/${id}`);
  }

  getPrediosPorProductor(productorId: string): Observable<Predio[]> {
    return this.http.get<Predio[]>(`${this.coreUrl}/predios/productor/${productorId}`);
  }

  agregarPredio(predio: Partial<Predio>): Observable<Predio> {
    return this.http.post<Predio>(`${this.coreUrl}/predios/`, predio);
  }

  actualizarPredio(id: string, datos: Partial<Predio>): Observable<Predio> {
    return this.http.put<Predio>(`${this.coreUrl}/predios/${id}`, datos);
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

  // ── INSPECCIONES ───────────────────────────────────────────────────────────

  getInspecciones(): Observable<Inspeccion[]> {
    return this.http.get<Inspeccion[]>(`${this.insUrl}/inspecciones/`);
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

  asignarTecnicoAInspeccion(inspeccionId: string, tecnicoNombre: string, tecnicoId?: string): Observable<any> {
    return this.http.patch(`${this.insUrl}/inspecciones/${inspeccionId}/asignar-tecnico`, {
      tecnico_id: tecnicoId ?? '',
      tecnico_nombre: tecnicoNombre,
      modo_asignacion: 'preferencia',
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
}
