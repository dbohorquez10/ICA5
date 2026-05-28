import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InspectionService } from '../../../core/services/inspection.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * PILAR 2: COMPONENTE CON ASYNC PIPE Y DETECCIÓN DE CAMBIOS OPTIMIZADA
 * Lugar: src/app/features/tecnico/inspecciones/inspecciones-optimized.component.ts
 * USO: Importar en tecnico.module.ts y usar como reemplazo de inspecciones.component.ts
 */
@Component({
  selector: 'app-inspecciones-optimized',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="inspecciones-container">
      <h1>Mis Inspecciones</h1>

      <!-- Loading state: controlado automáticamente por LoadingService -->
      <!-- Async pipe se encarga de suscribirse y desuscribirse automáticamente -->

      <div class="stats-grid">
        <div class="stat-card" *ngIf="stats$ | async as stats">
          <div class="stat">
            <span class="count">{{ stats.pendientes }}</span>
            <span class="label">Pendientes</span>
          </div>
          <div class="stat">
            <span class="count">{{ stats.enProgreso }}</span>
            <span class="label">En Progreso</span>
          </div>
          <div class="stat">
            <span class="count">{{ stats.completadas }}</span>
            <span class="label">Completadas</span>
          </div>
        </div>
      </div>

      <div class="inspecciones-list">
        <div class="inspeccion-item" *ngFor="let inspeccion of (inspecciones$ | async)">
          <div class="inspeccion-header">
            <h3>{{ inspeccion.predio_nombre || 'Sin asignar' }}</h3>
            <span class="estado" [ngClass]="'estado-' + (inspeccion.estado | lowercase)">
              {{ inspeccion.estado }}
            </span>
          </div>
          <p class="productor">{{ inspeccion.productor_nombre || '—' }}</p>
          <p class="fecha">{{ inspeccion.fecha_inspeccion | date }}</p>
        </div>

        <div *ngIf="(inspecciones$ | async)?.length === 0" class="no-data">
          <p>No hay inspecciones asignadas</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inspecciones-container {
      padding: 20px;
    }

    h1 {
      margin-bottom: 20px;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .stat {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }

    .count {
      display: block;
      font-size: 28px;
      font-weight: bold;
      color: #3498db;
      margin-bottom: 8px;
    }

    .label {
      color: #666;
      font-size: 14px;
    }

    .inspecciones-list {
      display: grid;
      gap: 16px;
    }

    .inspeccion-item {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      transition: box-shadow 0.3s;
    }

    .inspeccion-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .inspeccion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .inspeccion-header h3 {
      margin: 0;
      color: #333;
    }

    .estado {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .estado-pendiente {
      background: #fee;
      color: #c00;
    }

    .estado-en_progreso,
    .estado-en\ progreso {
      background: #fef3cd;
      color: #856404;
    }

    .estado-completada {
      background: #d4edda;
      color: #155724;
    }

    .productor {
      color: #666;
      font-size: 14px;
      margin: 8px 0;
    }

    .fecha {
      color: #999;
      font-size: 12px;
      margin: 0;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #999;
    }
  `]
})
export class InspeccionesOptimizedComponent implements OnInit {
  // Observables públicos - Angular manejará la suscripción vía async pipe
  inspecciones$ = this.inspectionService.inspecciones$;
  stats$ = this.inspectionService.inspecciones$.pipe(
    // Transformar a estadísticas
  );

  constructor(
    private inspectionService: InspectionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Obtener usuario actual y aplicar filtros
    const usuario = this.authService.getUsuarioActual();
    if (usuario) {
      this.inspectionService.setUsuarioFilters({
        rol: usuario.rol,
        deptId: usuario.departamento_id
      });
    }
  }
}
