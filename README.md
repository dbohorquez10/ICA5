# 🟢 **FitoGestión Web – Plataforma Fitosanitaria Inteligente**

### Proyecto Integrador – Ingeniería de Sistemas
**Universidad de Investigación y Desarrollo (UDI)**
**Entrega Final – Frontend Web (Angular)**

---

# 🎥 Video del prototipo funcionando

🔗 [https://www.youtube.com/watch?v=tu_video_aqui](https://www.youtube.com/watch?v=tu_video_aqui)

---

# 📌 Descripción general

**FitoGestión Web** es una aplicación web de página única (SPA) desarrollada en **Angular 17+** con **TypeScript**, diseñada para ser la herramienta de campo y autogestión del **Instituto Colombiano Agropecuario (ICA)** y los productores agrícolas.

El sistema integra, en un solo flujo completo:

* ✔ **Autenticación y enrutamiento seguro** basado en roles (RoleGuard).
* ✔ Panel moderno dinámico y navegación unificada con **Dashboard Inteligente**.
* ✔ **Geolocalización interactiva** de predios mediante **Leaflet.js**.
* ✔ Wizard paso a paso para registro de **inspecciones**.
* ✔ **Conteo interactivo** de plagas por número de planta.
* ✔ **Guardado offline automático** (Local Storage) para evitar pérdida de datos en campo.

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
│   │   │   └── role.guard.ts         # Bloqueo de rutas por rol
│   │   └── services/
│   │       └── auth.service.ts       # Gestión de sesión con RxJS
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   └── login/                # Pantalla de inicio de sesión
│   │   │
│   │   ├── productor/
│   │   │   ├── mis-predios/          # Gestión de fincas del productor
│   │   │   └── solicitar-inspeccion/ # Formulario de solicitudes
│   │   │
│   │   └── tecnico/
│   │       ├── inspecciones/         # Tabla de agenda y mapa interactivo
│   │       └── ejecutar-inspeccion/  # Wizard interactivo (Ruta/Lote/Conteo)
│   │
│   └── shared/
│       ├── components/
│       │   └── panel-general/        # Dashboard dinámico que lee el rol
│       │
│       └── layout/
│           ├── dashboard/            # Menú lateral y topbar
│           └── layout-routing-module # Enrutador maestro y carga perezosa

```


# 🔐 Roles del sistema (Vista Web)

### 🟦 **TECNICO ICA**
Su responsabilidad es la operación de campo y digitación de hallazgos:
* Ver lotes asignados y agenda priorizada.
* Visualizar mapas geográficos para ubicar fincas.
* Ejecutar el Wizard de inspección (Ruta ➔ Predio ➔ Conteo).
* Registrar plagas planta por planta de forma dinámica.
* Recuperar inspecciones pausadas mediante Auto-Guardado local.

### 🟧 **PRODUCTOR**
Gestiona la información de su lado:
* Ver métricas generales (hectáreas, estado del clima).
* Solicitar visitas técnicas al ICA.
* Ver listado de sus predios.

*(Nota: El rol 🟩 ADMIN se gestiona de forma centralizada en la aplicación de escritorio Java Swing).*

---

# 🚨 Lógica clave implementada

En lugar de Triggers de Base de Datos (que maneja Java), en Angular implementamos **Lógica de Control de Estado y Seguridad**:

---

## **1️⃣ Guardián de Rutas (Seguridad de Vistas)**
Impide que un usuario entre a URL's no permitidas para su rol.
```typescript
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const rolEsperado = route.data['rol']; 

  return authService.getUsuario().pipe(
    take(1),
    map(usuario => {
      if (usuario && usuario.rol === rolEsperado) return true;
      return router.createUrlTree(['/app/inicio']); // Expulsa intrusos
    })
  );
};
```
## **2️⃣ Sistema Offline de Inspecciones (Borrador)**
Protege el trabajo del técnico si la app se cierra accidentalmente o si pierde conexión a internet en el campo.
```typescript
guardarBorrador() {
  if (isPlatformBrowser(this.platformId)) {
    const data = {
      pasoActual: this.pasoActual,
      conteoPlantas: this.conteoPlantas,
      hallazgos: this.hallazgos
    };
    localStorage.setItem('borrador_inspeccion', JSON.stringify(data));
  }
}
```
## **3️⃣ Renderizado de Mapas Dinámicos (Leaflet)**
Pinta los lotes en el mapa interactivo asignando colores automáticamente según el nivel de urgencia de la inspección.
```typescript
this.listaInspecciones.forEach(item => {
  const color = item.prioridad === 'Alta' ? '#ef4444' : '#1b2610';
  const icon = this.L.divIcon({
    html: `<span class="material-icons" style="color: ${color};">location_on</span>`,
    className: 'custom-pin'
  });
  this.L.marker([item.lat, item.lng], { icon }).addTo(this.map);
});
```
# 📊 Estado del proyecto Web

| Módulo                       | Estado                   |
| ---------------------------- | ------------------------ |
| Estructura Layout Unificada  | ✔                        |
| Enrutamiento y RoleGuard     | ✔                        |
| Autenticación RxJS           | ✔                        |
| Mapa Interactivo Leaflet     | ✔                        |
| Agenda de Tareas del Técnico | ✔                        |
| Wizard de Inspección Visual  | ✔                        |
| Conteo Dinámico de Plantas   | ✔                        |
| Almacenamiento Local Offline | ✔                        |
| Panel de Métricas Productor  | ✔                        |

---

# 🛠️ Tecnologías utilizadas

| Categoría    | Tecnología         |
| ------------ | ------------------ |
| Framework    | Angular 17+        |
| Lenguaje     | TypeScript         |
| Estilos      | CSS3 / Flexbox     |
| Control Flujo| Sintaxis `@if` `@for`|
| Mapas        | Leaflet.js         |
| Estado/Datos | RxJS (Observables) |
| Iconografía  | Google Material    |

---

# 🚀 Mejoras futuras

* Conexión con Endpoints HTTP a la API REST del backend (FastAPI/Java).
* Conversión a PWA (Aplicación Web Progresiva) para instalación nativa en celulares y uso 100% offline.

---

# ✒️ Autores

**Darwing Yailang Bohórquez Jaimes**
**Karen Rocío Cristancho Fajardo**
**Jhonatan Arturo Castro Arguello**
Estudiantes de Ingeniería de Sistemas – V Semestre  
**Universidad de Investigación y Desarrollo (UDI)**
📅 2026
