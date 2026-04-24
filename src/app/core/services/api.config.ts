/**
 * Configuración de URLs base del API Gateway.
 * Todas las peticiones pasan por Nginx en el puerto 8080.
 */
export const API_CONFIG = {
  /** URL base del gateway Nginx */
  GATEWAY: 'http://localhost:8080',

  /** Endpoints del Microservicio Core Agrícola */
  CORE: 'http://localhost:8080/api/core',

  /** Endpoints del Microservicio de Inspecciones */
  INSPECCIONES: 'http://localhost:8080/api/inspeccion',
} as const;
