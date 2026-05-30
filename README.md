# 🟢 **FitoGestión Web – Plataforma Fitosanitaria Inteligente**

### Proyecto Integrador – Ingeniería de Sistemas
**Universidad de Investigación y Desarrollo (UDI)**
**Entrega Final – Frontend Web (Angular)**

---

# 🎥 Video del prototipo funcionando

🔗 [https://www.youtube.com/watch?v=tu_video_aqui](https://www.youtube.com/watch?v=tu_video_aqui)

---

# 📌 Descripción general

**FitoGestión Web** es una aplicación web de página única (SPA) desarrollada en **Angular 17+** con **TypeScript** y **Tailwind CSS**, diseñada para ser la herramienta de campo y autogestión del **Instituto Colombiano Agropecuario (ICA)** y los productores agrícolas.

El sistema integra, en un solo flujo completo:

* ✔ **Autenticación y enrutamiento seguro** basado en roles estrictos (RoleGuard).
* ✔ Panel moderno dinámico y navegación unificada con **Dashboard Inteligente**.
* ✔ **Geolocalización interactiva** de predios mediante **Leaflet.js**.
* ✔ Wizard paso a paso para registro de **inspecciones**.
* ✔ **Conteo lógico interactivo** con límite estricto de plantas por lote.
* ✔ **Guardado offline asíncrono** (Local Storage) para zonas rurales.
* ✔ Captura global de errores HTTP (401/403) con interceptores limpios.

Todo implementado con arquitectura **Feature-Driven (Módulos)**, principios de diseño moderno y programación reactiva (RxJS).

---

# 🎯 Objetivos del sistema

* Facilitar la interacción en campo mediante una interfaz web ágil y responsiva, sin recargas de página.
* Garantizar que los técnicos ICA puedan iniciar, pausar y recuperar inspecciones sin perder datos por falta de internet.
* Mostrar de forma visual la ubicación y rutas hacia los lotes asignados mediante mapas interactivos.
* Proteger el acceso a vistas críticas mediante Guardianes de Ruta, asegurando que cada rol (Técnico/Productor) solo vea su entorno operativo.

---

## 🗂️ Estructura del Código Fuente

```plaintext
src/
│
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── role.guard.ts         # Bloqueo de rutas por array de roles
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts   # Inyección JWT y captura 401/403
│   │   └── services/
│   │       └── auth.service.ts       # Gestión de sesión con RxJS
│   │
│   ├── features/
│   │   ├── admin/                    # Gestión de catálogos y aprobación de plagas
│   │   ├── auth/
│   │   │   └── login/                # Pantalla de inicio de sesión
│   │   │
│   │   ├── productor/
│   │   │   ├── mis-predios/          # Gestión de fincas y captura GPS
│   │   │   └── solicitar-inspeccion/ # Formulario de solicitudes
│   │   │
│   │   └── tecnico/
│   │       ├── inspecciones/         # Mapas operativos y agenda
│   │       └── ejecutar-inspeccion/  # Wizard interactivo (Planta por Planta)
│   │
│   └── shared/
│       ├── components/
│       │   └── panel-general/        # Dashboard dinámico que lee el rol
│       └── layout/
│           └── layout-routing.module # Enrutador maestro y carga perezosa
```

---

# 🔐 Roles del sistema (Vista Web)

### 🟩 **ADMINISTRADOR**
* Panel de analítica global.
* Gestión de catálogos (aprobación/rechazo de plagas sugeridas desde campo).
* Asignación manual o automática de visitas técnicas.

### 🟦 **TECNICO ICA**
Su responsabilidad es la operación de campo y digitación de hallazgos:
* Visualizar mapas geográficos para ubicar fincas.
* Ejecutar el Wizard de inspección registrando hallazgos planta por planta (respetando los límites del lote).
* Recuperar inspecciones pausadas mediante Auto-Guardado local.

### 🟧 **PRODUCTOR**
Gestiona la información de su lado:
* Ver métricas generales (hectáreas, estado del clima).
* Delimitación GPS de sus Lugares de Producción y Lotes.
* Solicitar visitas técnicas al ICA.

---

# 🚨 Lógica clave implementada

## **1️⃣ Interceptor Global de Errores**
Garantiza que la UI no se congele si la sesión caduca o si no hay permisos.
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem('fito_token');
        router.navigate(['/auth/login']);
      } else if (error.status === 403) {
        router.navigate(['/unauthorized']);
      }
      return throwError(() => error);
    })
  );
};
```

## **2️⃣ Sistema Offline de Inspecciones (Borrador)**
Protege el trabajo del técnico si la app se cierra accidentalmente o pierde conexión.
```typescript
guardarBorrador() {
  const data = { pasoActual, conteoPlantas, hallazgos };
  localStorage.setItem(`draft_inspeccion_${this.lote.id}`, JSON.stringify(data));
}
```

## **3️⃣ Renderizado de Mapas Dinámicos (Leaflet)**
Pinta los lotes en el mapa interactivo asignando iconos y coordenadas en tiempo real.
```typescript
const icon = this.L.icon({ iconUrl: 'assets/marker-icon.png' });
this.L.marker([item.lat, item.lng], { icon }).addTo(this.map);
```

---

# 📊 Estado del proyecto Web (FINAL)

| Módulo                       | Estado                   |
| ---------------------------- | ------------------------ |
| Estructura Layout Unificada  | ✔                        |
| Enrutamiento y RoleGuard     | ✔                        |
| Interceptor HTTP (401/403)   | ✔                        |
| Autenticación RxJS           | ✔                        |
| Mapa Interactivo Leaflet     | ✔                        |
| Agenda de Tareas Técnico     | ✔                        |
| Wizard de Inspección Visual  | ✔                        |
| Límites lógicos planta/lote  | ✔                        |
| Almacenamiento Local Offline | ✔                        |
| Panel de Métricas Productor  | ✔                        |

---

# 🛠️ Tecnologías utilizadas

| Categoría    | Tecnología         |
| ------------ | ------------------ |
| Framework    | Angular 17+        |
| Lenguaje     | TypeScript         |
| Estilos      | Tailwind CSS       |
| Control Flujo| Sintaxis `@if` `@for`|
| Mapas        | Leaflet.js         |
| Estado/Datos | RxJS (Observables) |
| Iconografía  | Google Material    |
| Despliegue   | Vercel             |

---

# 🚀 Mejoras futuras

* Conversión a PWA (Aplicación Web Progresiva) para instalación nativa en celulares y uso 100% offline.
* Implementación de Modo Oscuro (Dark Mode) nativo.

---

# ✒️ Autores

**Darwing Yailang Bohórquez Jaimes** **Karen Rocío Cristancho Fajardo** **Jhonatan Arturo Castro Arguello** Estudiantes de Ingeniería de Sistemas – V Semestre  
**Universidad de Investigación y Desarrollo (UDI)** 📅 2026
