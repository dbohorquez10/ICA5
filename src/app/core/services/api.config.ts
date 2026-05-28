import { env } from './api.config.env';

/**
 * Configuración de URLs base del API Gateway.
 * Todas las peticiones pasan por Nginx en el puerto 8080.
 */
export const API_CONFIG = {
  /** URL base del gateway Nginx */
  GATEWAY: env.NG_APP_API_URL,

  /** Endpoints del Microservicio Core Agrícola */
  CORE: `${env.NG_APP_API_URL}/api/core`,

  /** Endpoints del Microservicio de Inspecciones */
  INSPECCIONES: `${env.NG_APP_API_URL}/api/inspeccion`,
} as const;
