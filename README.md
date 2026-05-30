# FitoGestión Frontend - Plataforma Web Reactiva y Tolerante a Fallos (SPA)

FitoGestión Frontend es una Single Page Application (SPA) moderna, responsiva y robusta, desarrollada para agilizar el trabajo de campo del **Instituto Colombiano Agropecuario (ICA)** y empoderar a los productores agrícolas en el monitoreo y control fitosanitario de sus cultivos.

---

## 🛠️ Tecnologías Utilizadas

La aplicación está construida sobre una base tecnológica moderna que garantiza escalabilidad y una experiencia de usuario fluida:
* **Angular 17+ (TypeScript)**: Framework principal para estructurar la SPA mediante componentes modulares, inyección de dependencias y renderizado eficiente.
* **Tailwind CSS**: Framework CSS enfocado en utilidades para lograr un diseño responsivo, estético y consistente con colores corporativos y estados interactivos pulidos.
* **Leaflet.js**: Librería de mapas interactivos que permite renderizar planos geográficos y ubicar espacialmente los predios agrícolas inspeccionados.
* **RxJS (Reactive Extensions)**: Programación reactiva basada en flujos de datos asíncronos (Observables) para manejar eficientemente el estado global, peticiones HTTP y eventos de la interfaz de usuario de forma no bloqueante.

---

## 📶 Arquitectura Tolerante a Fallos (Modo Offline)

Uno de los principales retos operativos del personal técnico del ICA es trabajar en zonas rurales con cobertura de red intermitente o inexistente. FitoGestión Frontend soluciona este problema mediante una arquitectura tolerante a fallos orientada al funcionamiento sin conexión:

### 1. Sistema de Auto-Guardado en Borrador Local
Durante la ejecución de una inspección, cada acción que realiza el técnico (avanzar en el asistente, registrar el estado de una planta, marcar una plaga identificada o introducir observaciones parciales) es serializada automáticamente y almacenada en el almacenamiento del navegador a través de `localStorage` utilizando claves únicas por inspección:

```typescript
// Guardado del borrador del lote en localStorage
public guardarDraftLocal(): void {
  if (!this.inspeccion) return;
  const draftData = {
    inspeccion: this.inspeccion,
    observacionesGenerales: this.observacionesGenerales,
    vista: this.vista,
    loteActualId: this.loteActual?.id || null,
    subActual: this.subActual || null,
    plantaActual: this.plantaActual,
    plagasMarcadas: Array.from(this.plagasMarcadas)
  };
  localStorage.setItem(`draft_inspeccion_${this.inspeccion.id}`, JSON.stringify(draftData));
}
```

Al recargar la aplicación o volver a abrir la inspección en campo, el sistema comprueba la existencia del borrador local y restaura exactamente el estado en el que se encontraba el técnico, protegiéndolo de la pérdida de información accidental.

### 2. Envío en Bloque (`Bulk Save`)
En lugar de saturar el ancho de banda enviando peticiones por cada planta inspeccionada, la aplicación acumula localmente las observaciones de muestreo. Al finalizar la inspección de un lote, todos los datos acumulados se procesan en un único arreglo y se envían al backend en una sola petición transaccional masiva llamando al endpoint `/registro-plantas/bulk`:

```typescript
this.dataService.registrarPlantasBulk(recordsToSave).subscribe({
  next: () => {
    // Al confirmarse el guardado masivo en el backend, se actualiza el estado local y se remueve el borrador
    this.vista = 'lista-lotes';
    this.limpiarDraftLocal();
  }
});
```
Este enfoque minimiza la sobrecarga de red y garantiza la consistencia transaccional al subir los datos en bloque una vez que se restablece la conectividad.

---

## 🔐 Seguridad y Experiencia de Usuario

La seguridad del lado del cliente y la consistencia en el flujo de navegación están garantizadas mediante interceptores globales y guardianes de ruta reactivos.

### 1. Control de Navegación con `RoleGuard`
El acceso a las vistas operativas de la plataforma está restringido dinámicamente mediante el uso de Angular Route Guards. El `roleGuard` obtiene de manera reactiva el perfil del usuario actual a través de un servicio de autenticación y valida si cuenta con los roles requeridos (`admin`, `tecnico` o `productor`) para acceder a la ruta solicitada. Si no cuenta con el rol, es redirigido a un módulo informativo de acceso no autorizado (`/unauthorized`) o a la pantalla de inicio de sesión (`/auth/login`).

### 2. Interceptor Global HTTP (`authInterceptor`)
Un interceptor de peticiones HTTP centraliza la lógica de comunicación y la recuperación de errores:
* **Inyección de JWT**: Inserta automáticamente el token JWT recuperado del almacenamiento local en la cabecera `Authorization: Bearer <token>` de cada petición saliente dirigida a la API Gateway.
* **Captura Global de Expiración de Sesión (Errores 401 y 403)**:
  * Si el servidor responde con un código **401 (Unauthorized)**, el interceptor detecta la expiración de la sesión, limpia las credenciales almacenadas localmente (`fito_token` y `fito_user`), resetea los spinners globales de carga para evitar bloqueos visuales, silencia las solicitudes duplicadas si ya está en la pantalla de inicio de sesión y redirige inmediatamente al usuario a `/auth/login` con una interfaz limpia.
  * Si el servidor responde con un código **403 (Forbidden)** debido a permisos insuficientes, se redirige de inmediato a `/unauthorized`.

---

## 🗺️ Lógica de Mapas y Reglas de Negocio

La interfaz para los técnicos de campo combina la visualización geoespacial interactiva con la aplicación de reglas estrictas para el control de la integridad del muestreo fitosanitario:

### 1. Integración de Leaflet.js y Captura de GPS
El panel del técnico integra un mapa dinámico impulsado por Leaflet.js que muestra la ubicación de los predios programados para inspección.
* Los marcadores geográficos cambian de color dinámicamente según la prioridad y el estado de la visita (ej: rojo para visitas pendientes/alta prioridad, verde oscuro para completadas).
* **Navegación Asistida**: Utiliza la API de Geolocalización HTML5 (`navigator.geolocation.getCurrentPosition()`) para capturar las coordenadas de GPS del técnico en tiempo real y, a través de Google Maps Directions, trazar la ruta de navegación terrestre óptima desde su posición actual hasta el predio de destino.

### 2. Bloqueo Lógico por Capacidad de Lote
Para cumplir de forma estricta con la metodología de muestreo del ICA y evitar errores de sobredigitación en campo, el wizard del conteo planta por planta bloquea lógicamente la interfaz cuando se alcanza el límite máximo de plantas del lote actual (`num_plantas` definido por el productor). El botón para registrar la siguiente planta queda inhabilitado automáticamente:

```html
<button class="btn-siguiente-planta" 
        (click)="siguientePlanta()" 
        [disabled]="isLoading || (loteActual.num_plantas && plantaActual >= loteActual.num_plantas)">
  <span class="material-icons">add_circle</span> Siguiente Planta
</button>
```
Esto fuerza al técnico a completar la sub-inspección del lote una vez cubierto el censo límite determinado, garantizando la consistencia estadística de la incidencia calculada.

---

## 🚀 Guía de Despliegue en Vercel

Para desplegar esta aplicación web de forma rápida y gratuita en la plataforma global de **Vercel**, siga estas instrucciones:

1. Instale la CLI de Vercel globalmente si prefiere el despliegue por terminal:
   ```bash
   npm install -g vercel
   ```
2. Asegúrese de incluir un archivo `vercel.json` en la raíz del proyecto para redireccionar todas las rutas de la SPA al archivo `index.html` y evitar errores 404 al recargar rutas internas de Angular:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. Ejecute el comando de inicio en la raíz de su proyecto:
   ```bash
   vercel
   ```
4. Siga las instrucciones en la consola para enlazar su cuenta y configurar el proyecto.
5. Ingrese a la consola de Vercel y configure las variables de entorno requeridas en el archivo `src/environments/environment.prod.ts` (como la URL de la API del Gateway) a través de la interfaz web del panel de control de Vercel.

---

✒️ Autores
Darwing Yailang Bohórquez Jaimes
Karen Rocío Cristancho Fajardo
Jhonatan Arturo Castro Arguello
Estudiantes de Ingeniería de Sistemas – V Semestre
Universidad de Investigación y Desarrollo (UDI)
📅 2026
