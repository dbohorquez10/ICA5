import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// =============================================
// INTERFACES DEL MODELO DE DATOS
// =============================================

/**
 * @interface Cultivo
 * @description Representa un tipo de cultivo agrícola administrado dentro del sistema FitoGestión.
 */
export interface Cultivo {
  /** Identificador único del cultivo (PK). */
  id: string;
  /** Nombre común del cultivo (ej. Cacao, Café). */
  nombre: string;
  /** Variedades específicas asociadas a este cultivo. */
  variedad: string;
  /** Nombre del icono de Material Design representativo del cultivo. */
  icono: string;
  /** Código de color en formato hexadecimal asignado al cultivo para la interfaz. */
  color: string;
}

/**
 * @interface Plaga
 * @description Representa una plaga o enfermedad fitosanitaria que puede afectar a los cultivos registrados.
 */
export interface Plaga {
  /** Identificador único de la plaga (PK). */
  id: string;
  /** Nombre científico o común de la plaga. */
  nombre: string;
  /** Nombre del icono representativo en la interfaz. */
  icon: string;
  /** Nivel de riesgo asociado a la plaga ('Alto', 'Medio', 'Bajo'). */
  riesgo: 'Alto' | 'Medio' | 'Bajo';
  /** Código de color hexadecimal para categorizar visualmente la plaga. */
  color: string;
  /** Descripción técnica o biológica detallada de la plaga. */
  descripcion: string;
  /** Arreglo de identificadores de cultivos (FK apunta a Cultivo) que son susceptibles a esta plaga. */
  cultivosAfectados: string[]; // IDs de cultivos
}

/**
 * @interface Lote
 * @description Representa una subdivisión de tierra dentro de un predio agrícola, dedicada a un cultivo específico.
 */
export interface Lote {
  /** Identificador único del lote (PK). */
  id: string;
  /** Identificador del predio al que pertenece este lote (FK apunta a Predio). */
  predioId: string;
  /** Nombre o designación del lote (ej. Lote A, Lote B). */
  nombre: string; // Lote A, Lote B, etc.
  /** Identificador del cultivo sembrado en este lote (FK apunta a Cultivo). */
  cultivoId: string;
  /** Extensión de tierra del lote medida en hectáreas. */
  hectareas: number;
  /** Densidad de siembra expresada en cantidad de plantas por hectárea. */
  plantasPorHectarea: number;
  /** Estado fitosanitario actual del lote ('Óptimo', 'Alerta', 'Crítico'). */
  estado: 'Óptimo' | 'Alerta' | 'Crítico';
}

/**
 * @interface Predio
 * @description Representa una propiedad o finca agrícola registrada por un productor en el sistema.
 */
export interface Predio {
  /** Identificador único del predio (PK). */
  id: string;
  /** Nombre oficial o conocido de la finca o predio. */
  nombre: string;
  /** Ubicación geográfica o dirección del predio (legacy/consolidada). */
  ubicacion: string;
  /** Departamento donde se ubica el predio. */
  departamento?: string;
  /** Municipio donde se ubica el predio. */
  municipio?: string;
  /** Vereda donde se ubica el predio. */
  vereda?: string;
  /** Número de Registro otorgado por el ICA. */
  numeroRegistroIca?: string;
  /** Nombre del productor propietario o administrador del predio. */
  productorNombre: string;
  /** Coordenada de latitud para geolocalización en el mapa. */
  latitud?: number;
  /** Coordenada de longitud para geolocalización en el mapa. */
  longitud?: number;
}

/**
 * @interface RegistroPlanta
 * @description Representa el resultado de la inspección individual de una planta dentro de un lote.
 */
export interface RegistroPlanta {
  /** Número o identificador secuencial de la planta inspeccionada. */
  numeroPlanta: number;
  /** Arreglo de identificadores de plagas encontradas en la planta (FKs apuntan a Plaga). */
  plagasDetectadas: string[]; // IDs de plagas
}

/**
 * @interface SubInspeccionLote
 * @description Representa el registro de la evaluación fitosanitaria detallada realizada sobre un lote específico durante una inspección.
 */
export interface SubInspeccionLote {
  /** Identificador del lote inspeccionado (FK apunta a Lote). */
  loteId: string;
  /** Estado de avance de la inspección en este lote ('Pendiente', 'En Progreso', 'Completada'). */
  estado: 'Pendiente' | 'En Progreso' | 'Completada';
  /** Cantidad de plantas que han sido evaluadas en el lote. */
  plantasEvaluadas: number;
  /** Colección de registros detallados de las plantas inspeccionadas. */
  registroPlantas: RegistroPlanta[];
  /** Resultados calculados del nivel de alerta por plaga (plantas afectadas / plantas evaluadas). */
  incidenciasCalculadas?: { plagaId: string, porcentaje: number }[];
}

/**
 * @interface Inspeccion
 * @description Representa una solicitud oficial de revisión fitosanitaria para un predio, gestionada por técnicos.
 */
export interface Inspeccion {
  /** Identificador único de la solicitud de inspección (PK). */
  id: string;
  /** Identificador del predio a inspeccionar (FK apunta a Predio). */
  predioId: string;
  /** Nombre del técnico asignado para realizar la inspección. */
  tecnicoNombre: string;
  /** Fecha en la que el productor solicitó la inspección (formato YYYY-MM-DD). */
  fechaSolicitada: string;
  /** Estado general de la inspección ('Pendiente', 'En Progreso', 'Completada'). */
  estado: 'Pendiente' | 'En Progreso' | 'Completada';
  /** Origen de la asignación del técnico ('automatica' por el sistema, o 'preferencia' por un admin). */
  modoAsignacion: 'automatica' | 'preferencia';
  /** Detalle de las inspecciones individuales por cada lote del predio. */
  subInspecciones: SubInspeccionLote[];
  /** Observaciones y comentarios generales dejados por el técnico del ICA al finalizar. */
  observaciones?: string;
}

/**
 * @interface Usuario
 * @description Representa a un actor del sistema (Productor, Técnico o Admin) con sus datos de perfil y estado de cuenta.
 */
export interface Usuario {
  /** Identificador único del usuario (PK). */
  id: string;
  /** Nombre completo del usuario. */
  nombre: string;
  /** Correo electrónico de contacto y de acceso al sistema. */
  correo: string;
  /** Rol o perfil de acceso dentro de FitoGestión ('productor', 'tecnico'). */
  rol: 'productor' | 'tecnico';
  /** Estado actual de la cuenta del usuario en la plataforma ('Activo', 'Suspendido'). */
  estado: 'Activo' | 'Suspendido';
  /** Fecha en la que el usuario fue registrado en el sistema. */
  fechaRegistro: string;
  /** Zona geográfica de operación asignada (Opcional, comúnmente para técnicos). */
  zona?: string;
  /** Número de documento de identidad oficial del usuario (Opcional). */
  identificacion?: string;
  /** Número de teléfono de contacto (Opcional). */
  telefono?: string;
  /** Tarjeta Profesional requerida para Técnicos Oficiales del ICA. */
  tarjetaProfesional?: string;
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
    { id: 'p3', nombre: 'Mazorca Negra', icon: 'lens_blur', riesgo: 'Alto', color: '#ef4444', descripcion: 'Phytophthora palmivora, causa pudrición', cultivosAfectados: ['c1'] },
    { id: 'p4', nombre: 'Roya del Café', icon: 'blur_on', riesgo: 'Alto', color: '#ef4444', descripcion: 'Hongo foliar Hemileia vastatrix', cultivosAfectados: ['c2'] },
    { id: 'p5', nombre: 'Broca del Café', icon: 'bug_report', riesgo: 'Alto', color: '#ef4444', descripcion: 'Hypothenemus hampei, taladra el grano', cultivosAfectados: ['c2'] },
    { id: 'p6', nombre: 'Mancha Grasienta', icon: 'water_drop', riesgo: 'Medio', color: '#f97316', descripcion: 'Bacteriosis de los cítricos', cultivosAfectados: ['c3'] },
    { id: 'p7', nombre: 'Minador de Hoja', icon: 'pest_control', riesgo: 'Bajo', color: '#4ade80', descripcion: 'Phyllocnistis citrella en cítricos', cultivosAfectados: ['c3'] },
    { id: 'p8', nombre: 'Antracnosis', icon: 'bubble_chart', riesgo: 'Medio', color: '#f97316', descripcion: 'Colletotrichum gloeosporioides en aguacate', cultivosAfectados: ['c4'] },
    { id: 'p9', nombre: 'Phytophthora Raíz', icon: 'device_hub', riesgo: 'Alto', color: '#ef4444', descripcion: 'Pudrición de raíz en aguacate', cultivosAfectados: ['c4'] },
  ];

  // --- PREDIOS Y LOTES ---

  private _predios: Predio[] = [
    { id: 'pr1', nombre: 'Finca La Esmeralda', ubicacion: 'Lebrija, Santander', departamento: 'Santander', municipio: 'Lebrija', vereda: 'Centro', numeroRegistroIca: 'ICA-938210', productorNombre: 'Darwing Jaimes', latitud: 7.111, longitud: -73.167 },
    { id: 'pr2', nombre: 'Hacienda El Recreo', ubicacion: 'Girón, Santander', departamento: 'Santander', municipio: 'Girón', vereda: 'El Recreo', numeroRegistroIca: 'ICA-449182', productorNombre: 'Darwing Jaimes', latitud: 7.068, longitud: -73.169 },
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
    { id: 'u1', nombre: 'Carlos Gómez', correo: 'cgomez@ica.gov.co', rol: 'tecnico', estado: 'Activo', fechaRegistro: '2025-01-10', zona: 'Lebrija, Girón', identificacion: '1098123456', telefono: '3001234567' },
    { id: 'u2', nombre: 'Luisa Herrera', correo: 'lherrera@ica.gov.co', rol: 'tecnico', estado: 'Activo', fechaRegistro: '2025-03-15', zona: 'Bucaramanga', identificacion: '1098234567', telefono: '3109876543' },
    { id: 'u3', nombre: 'Andrés Felipe', correo: 'afelipe@ica.gov.co', rol: 'tecnico', estado: 'Suspendido', fechaRegistro: '2024-11-02', zona: 'San Gil', identificacion: '1098345678', telefono: '3205551234' },
    { id: 'u4', nombre: 'Darwing Jaimes', correo: 'djaimes@campo.co', rol: 'productor', estado: 'Activo', fechaRegistro: '2025-02-20', identificacion: '1098456789', telefono: '3157894561' },
    { id: 'u5', nombre: 'María Castellanos', correo: 'mcastellanos@campo.co', rol: 'productor', estado: 'Activo', fechaRegistro: '2025-04-01', identificacion: '1098567890', telefono: '3184567890' },
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

  editarLote(id: string, datos: Partial<Lote>): void {
    const lote = this._lotes.find(l => l.id === id);
    if (lote) Object.assign(lote, datos);
  }

  agregarCultivo(cultivo: Omit<Cultivo, 'id'>, plagasAsociadas?: string[]): void {
    const id = 'c' + (this._cultivos.length + 1);
    this._cultivos.push({ ...cultivo, id });
    if (plagasAsociadas) {
      this._actualizarPlagasDeCultivo(id, plagasAsociadas);
    }
  }

  agregarPlaga(plaga: Omit<Plaga, 'id'>): void {
    const id = 'p' + (this._plagas.length + 1);
    plaga.color = this._getColorPorRiesgo(plaga.riesgo);
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

  agregarUsuario(usuario: Omit<Usuario, 'id'>): void {
    const id = 'u' + (this._usuarios.length + 1);
    this._usuarios.push({ ...usuario, id });
  }

  editarUsuario(id: string, datos: Partial<Usuario>): void {
    const u = this._usuarios.find(u => u.id === id);
    if (u) Object.assign(u, datos);
  }

  getUsuarioPorId(id: string): Usuario | undefined {
    return this._usuarios.find(u => u.id === id);
  }

  agregarInspeccion(ins: Omit<Inspeccion, 'id'>): void {
    const id = 'ins' + (this._inspecciones.length + 1);
    this._inspecciones.push({ ...ins, id });
  }

  // --- Validaciones de duplicados ---

  existeCultivoConNombre(nombre: string): boolean {
    return this._cultivos.some(c => c.nombre.toLowerCase().trim() === nombre.toLowerCase().trim());
  }

  existePlagaConNombre(nombre: string): boolean {
    return this._plagas.some(p => p.nombre.toLowerCase().trim() === nombre.toLowerCase().trim());
  }

  // --- Edición de catálogos ---

  editarCultivo(id: string, datos: Partial<Cultivo>, plagasAsociadas?: string[]): void {
    const c = this._cultivos.find(c => c.id === id);
    if (c) Object.assign(c, datos);
    if (plagasAsociadas) {
      this._actualizarPlagasDeCultivo(id, plagasAsociadas);
    }
  }

  editarPlaga(id: string, datos: Partial<Plaga>): void {
    const p = this._plagas.find(p => p.id === id);
    if (p) {
      Object.assign(p, datos);
      if (datos.riesgo) {
        p.color = this._getColorPorRiesgo(p.riesgo);
      }
    }
  }

  private _getColorPorRiesgo(riesgo: string): string {
    if (riesgo === 'Alto') return '#ef4444';
    if (riesgo === 'Medio') return '#f97316';
    return '#4ade80';
  }

  private _actualizarPlagasDeCultivo(cultivoId: string, plagasIds: string[]): void {
    this._plagas.forEach(p => {
      const tiene = p.cultivosAfectados.includes(cultivoId);
      const deberiaTener = plagasIds.includes(p.id);
      if (deberiaTener && !tiene) {
        p.cultivosAfectados.push(cultivoId);
      } else if (!deberiaTener && tiene) {
        p.cultivosAfectados = p.cultivosAfectados.filter(id => id !== cultivoId);
      }
    });
  }

  // --- Asignación de técnico ---

  getTecnicosActivos(): Usuario[] {
    return this._usuarios.filter(u => u.rol === 'tecnico' && u.estado === 'Activo');
  }

  asignarTecnicoAInspeccion(inspeccionId: string, tecnicoNombre: string): void {
    const ins = this._inspecciones.find(i => i.id === inspeccionId);
    if (ins) {
      ins.tecnicoNombre = tecnicoNombre;
      ins.modoAsignacion = 'preferencia';
    }
  }
}
