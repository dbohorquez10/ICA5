import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// =============================================
// INTERFACES DEL MODELO DE DATOS
// =============================================

export interface Cultivo {
  id: string;
  nombre: string;
  variedad: string;
  icono: string;
  color: string;
}

export interface Plaga {
  id: string;
  nombre: string;
  icon: string;
  riesgo: 'Alto' | 'Medio' | 'Bajo';
  color: string;
  descripcion: string;
  cultivosAfectados: string[]; // IDs de cultivos
}

export interface Lote {
  id: string;
  predioId: string;
  nombre: string; // Lote A, Lote B, etc.
  cultivoId: string;
  hectareas: number;
  plantasPorHectarea: number;
  estado: 'Óptimo' | 'Alerta' | 'Crítico';
}

export interface Predio {
  id: string;
  nombre: string;
  ubicacion: string;
  productorNombre: string;
  latitud?: number;
  longitud?: number;
}

export interface RegistroPlanta {
  numeroPlanta: number;
  plagasDetectadas: string[]; // IDs de plagas
}

export interface SubInspeccionLote {
  loteId: string;
  estado: 'Pendiente' | 'En Progreso' | 'Completada';
  plantasEvaluadas: number;
  registroPlantas: RegistroPlanta[];
}

export interface Inspeccion {
  id: string;
  predioId: string;
  tecnicoNombre: string;
  fechaSolicitada: string;
  estado: 'Pendiente' | 'En Progreso' | 'Completada';
  modoAsignacion: 'automatica' | 'preferencia';
  subInspecciones: SubInspeccionLote[];
}

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: 'productor' | 'tecnico';
  estado: 'Activo' | 'Suspendido';
  fechaRegistro: string;
  zona?: string;
}

// =============================================
// SERVICIO CENTRAL DE DATOS SIMULADOS
// =============================================

@Injectable({ providedIn: 'root' })
export class FitoDataService {

  // --- CATÁLOGOS (gestionados por Admin) ---

  private _cultivos: Cultivo[] = [
    { id: 'c1', nombre: 'Cacao', variedad: 'CCN-51, Criollo', icono: 'eco', color: '#92400e' },
    { id: 'c2', nombre: 'Café', variedad: 'Arábica, Castillo', icono: 'local_cafe', color: '#78350f' },
    { id: 'c3', nombre: 'Cítricos', variedad: 'Naranja, Limón Tahití', icono: 'nutrition', color: '#d97706' },
    { id: 'c4', nombre: 'Aguacate', variedad: 'Hass, Lorena', icono: 'grass', color: '#15803d' },
  ];

  private _plagas: Plaga[] = [
    { id: 'p1', nombre: 'Moniliasis', icon: 'coronavirus', riesgo: 'Alto', color: '#ef4444', descripcion: 'Hongo que pudre mazorcas del cacao', cultivosAfectados: ['c1'] },
    { id: 'p2', nombre: 'Escoba de Bruja', icon: 'psychiatry', riesgo: 'Medio', color: '#f97316', descripcion: 'Afecta brotes y frutos del cacao', cultivosAfectados: ['c1'] },
    { id: 'p3', nombre: 'Mazorca Negra', icon: 'lens_blur', riesgo: 'Alto', color: '#64748b', descripcion: 'Phytophthora palmivora, causa pudrición', cultivosAfectados: ['c1'] },
    { id: 'p4', nombre: 'Roya del Café', icon: 'blur_on', riesgo: 'Alto', color: '#b45309', descripcion: 'Hongo foliar Hemileia vastatrix', cultivosAfectados: ['c2'] },
    { id: 'p5', nombre: 'Broca del Café', icon: 'bug_report', riesgo: 'Alto', color: '#7c3aed', descripcion: 'Hypothenemus hampei, taladra el grano', cultivosAfectados: ['c2'] },
    { id: 'p6', nombre: 'Mancha Grasienta', icon: 'water_drop', riesgo: 'Medio', color: '#0e7490', descripcion: 'Bacteriosis de los cítricos', cultivosAfectados: ['c3'] },
    { id: 'p7', nombre: 'Minador de Hoja', icon: 'pest_control', riesgo: 'Bajo', color: '#65a30d', descripcion: 'Phyllocnistis citrella en cítricos', cultivosAfectados: ['c3'] },
    { id: 'p8', nombre: 'Antracnosis', icon: 'bubble_chart', riesgo: 'Medio', color: '#16a34a', descripcion: 'Colletotrichum gloeosporioides en aguacate', cultivosAfectados: ['c4'] },
    { id: 'p9', nombre: 'Phytophthora Raíz', icon: 'device_hub', riesgo: 'Alto', color: '#dc2626', descripcion: 'Pudrición de raíz en aguacate', cultivosAfectados: ['c4'] },
  ];

  // --- PREDIOS Y LOTES ---

  private _predios: Predio[] = [
    { id: 'pr1', nombre: 'Finca La Esmeralda', ubicacion: 'Lebrija, Santander', productorNombre: 'Darwing Jaimes', latitud: 7.111, longitud: -73.167 },
    { id: 'pr2', nombre: 'Hacienda El Recreo', ubicacion: 'Girón, Santander', productorNombre: 'Darwing Jaimes', latitud: 7.068, longitud: -73.169 },
  ];

  private _lotes: Lote[] = [
    { id: 'l1', predioId: 'pr1', nombre: 'Lote A', cultivoId: 'c1', hectareas: 2.5, plantasPorHectarea: 1100, estado: 'Óptimo' },
    { id: 'l2', predioId: 'pr1', nombre: 'Lote B', cultivoId: 'c3', hectareas: 3.0, plantasPorHectarea: 200, estado: 'Alerta' },
    { id: 'l3', predioId: 'pr1', nombre: 'Lote C', cultivoId: 'c1', hectareas: 1.5, plantasPorHectarea: 1100, estado: 'Óptimo' },
    { id: 'l4', predioId: 'pr2', nombre: 'Lote A', cultivoId: 'c4', hectareas: 5.0, plantasPorHectarea: 150, estado: 'Crítico' },
    { id: 'l5', predioId: 'pr2', nombre: 'Lote B', cultivoId: 'c2', hectareas: 8.0, plantasPorHectarea: 5000, estado: 'Alerta' },
  ];

  // --- INSPECCIONES ---

  private _inspecciones: Inspeccion[] = [
    {
      id: 'ins1', predioId: 'pr1',
      tecnicoNombre: 'Téc. Carlos Gómez', fechaSolicitada: '2026-04-20',
      estado: 'Pendiente', modoAsignacion: 'preferencia',
      subInspecciones: [
        { loteId: 'l1', estado: 'Pendiente', plantasEvaluadas: 0, registroPlantas: [] },
        { loteId: 'l2', estado: 'Pendiente', plantasEvaluadas: 0, registroPlantas: [] },
        { loteId: 'l3', estado: 'Pendiente', plantasEvaluadas: 0, registroPlantas: [] },
      ]
    },
    {
      id: 'ins2', predioId: 'pr2',
      tecnicoNombre: 'Asignación Automática', fechaSolicitada: '2026-04-18',
      estado: 'Pendiente', modoAsignacion: 'automatica',
      subInspecciones: [
        { loteId: 'l4', estado: 'Pendiente', plantasEvaluadas: 0, registroPlantas: [] },
        { loteId: 'l5', estado: 'Pendiente', plantasEvaluadas: 0, registroPlantas: [] },
      ]
    }
  ];

  // --- USUARIOS (para Admin) ---

  private _usuarios: Usuario[] = [
    { id: 'u1', nombre: 'Carlos Gómez', correo: 'cgomez@ica.gov.co', rol: 'tecnico', estado: 'Activo', fechaRegistro: '2025-01-10', zona: 'Lebrija, Girón' },
    { id: 'u2', nombre: 'Luisa Herrera', correo: 'lherrera@ica.gov.co', rol: 'tecnico', estado: 'Activo', fechaRegistro: '2025-03-15', zona: 'Bucaramanga' },
    { id: 'u3', nombre: 'Andrés Felipe', correo: 'afelipe@ica.gov.co', rol: 'tecnico', estado: 'Suspendido', fechaRegistro: '2024-11-02', zona: 'San Gil' },
    { id: 'u4', nombre: 'Darwing Jaimes', correo: 'djaimes@campo.co', rol: 'productor', estado: 'Activo', fechaRegistro: '2025-02-20' },
    { id: 'u5', nombre: 'María Castellanos', correo: 'mcastellanos@campo.co', rol: 'productor', estado: 'Activo', fechaRegistro: '2025-04-01' },
  ];

  // =============================================
  // GETTERS (ACCESO REACTIVO)
  // =============================================

  getCultivos(): Cultivo[] { return [...this._cultivos]; }
  getPlagas(): Plaga[] { return [...this._plagas]; }
  getPlagasByPrediosCultivos(cultivoId: string): Plaga[] {
    return this._plagas.filter(p => p.cultivosAfectados.includes(cultivoId));
  }
  getCultivoPorId(id: string): Cultivo | undefined {
    return this._cultivos.find(c => c.id === id);
  }

  getPredios(): Predio[] { return [...this._predios]; }
  getLotesPorPredio(predioId: string): Lote[] {
    return this._lotes.filter(l => l.predioId === predioId);
  }
  getLotePorId(id: string): Lote | undefined {
    return this._lotes.find(l => l.id === id);
  }

  getInspecciones(): Inspeccion[] { return [...this._inspecciones]; }
  getInspeccionPorId(id: string): Inspeccion | undefined {
    return this._inspecciones.find(i => i.id === id);
  }
  getInspeccionesPendientes(): Inspeccion[] {
    return this._inspecciones.filter(i => i.estado === 'Pendiente');
  }

  getUsuarios(): Usuario[] { return [...this._usuarios]; }
  getPredio(id: string): Predio | undefined { return this._predios.find(p => p.id === id); }

  // =============================================
  // MUTACIONES
  // =============================================

  agregarLote(lote: Omit<Lote, 'id'>): void {
    const id = 'l' + (this._lotes.length + 1);
    this._lotes.push({ ...lote, id });
  }

  eliminarLote(id: string): void {
    this._lotes = this._lotes.filter(l => l.id !== id);
  }

  agregarCultivo(cultivo: Omit<Cultivo, 'id'>): void {
    const id = 'c' + (this._cultivos.length + 1);
    this._cultivos.push({ ...cultivo, id });
  }

  agregarPlaga(plaga: Omit<Plaga, 'id'>): void {
    const id = 'p' + (this._plagas.length + 1);
    this._plagas.push({ ...plaga, id });
  }

  eliminarPlaga(id: string): void {
    this._plagas = this._plagas.filter(p => p.id !== id);
  }

  eliminarCultivo(id: string): void {
    this._cultivos = this._cultivos.filter(c => c.id !== id);
  }

  agregarPredio(predio: Omit<Predio, 'id'>): void {
    const id = 'pr' + (this._predios.length + 1);
    this._predios.push({ ...predio, id });
  }

  actualizarSubInspeccion(inspeccionId: string, sub: SubInspeccionLote): void {
    const ins = this._inspecciones.find(i => i.id === inspeccionId);
    if (!ins) return;
    const idx = ins.subInspecciones.findIndex(s => s.loteId === sub.loteId);
    if (idx > -1) ins.subInspecciones[idx] = { ...sub };
    // Verificar si todos los lotes están completos
    const todosCompletos = ins.subInspecciones.every(s => s.estado === 'Completada');
    if (todosCompletos) ins.estado = 'Completada';
    else ins.estado = 'En Progreso';
  }

  suspenderUsuario(id: string): void {
    const u = this._usuarios.find(u => u.id === id);
    if (u) u.estado = u.estado === 'Activo' ? 'Suspendido' : 'Activo';
  }

  eliminarUsuario(id: string): void {
    this._usuarios = this._usuarios.filter(u => u.id !== id);
  }

  agregarInspeccion(ins: Omit<Inspeccion, 'id'>): void {
    const id = 'ins' + (this._inspecciones.length + 1);
    this._inspecciones.push({ ...ins, id });
  }
}
