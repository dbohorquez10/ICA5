import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { API_CONFIG } from '../../../core/services/api.config';
import { FitoDataService, Inspeccion, Predio, Usuario, Lote } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-informe-fitosanitario',
  templateUrl: './informe-fitosanitario.component.html',
  styleUrls: ['./informe-fitosanitario.component.css'],
  standalone: false
})
export class InformeFitosanitarioComponent implements OnInit {
  @Input() inspeccionId!: string;
  @Output() statusChanged = new EventEmitter<void>();
  
  public inspeccion: Inspeccion | null = null;
  public predio: Predio | null = null;
  public tecnico: Usuario | null = null;
  public productor: Usuario | null = null;
  public informeMetrics: any = null;
  public lotesData: Lote[] = [];
  public plagasMap: Record<string, string> = {};
  public usuarioActual: any = null;
  
  public isLoading = true;
  public error: string | null = null;

  constructor(
    private http: HttpClient,
    private dataService: FitoDataService,
    private authService: AuthService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuarioActual();
    if (this.inspeccionId) {
      this.cargarDatos();
    } else {
      this.error = 'No se especificó un ID de inspección.';
      this.isLoading = false;
    }
  }

  private cargarDatos(): void {
    this.isLoading = true;
    this.error = null;

    // Primero cargar plagas y la inspección
    forkJoin({
      plagas: this.dataService.getPlagas(),
      inspeccion: this.http.get<Inspeccion>(`${API_CONFIG.INSPECCIONES}/inspecciones/${this.inspeccionId}`)
    }).pipe(
      switchMap(({ plagas, inspeccion }) => {
        this.inspeccion = inspeccion;
        
        plagas.forEach(p => {
          this.plagasMap[p.id] = p.nombre || p.nombre_comun;
        });

        const predioId = inspeccion.predio_id || inspeccion.predioId || '';
        const tecnicoId = inspeccion.tecnico_id || '';

        // Ahora cargar las subentidades
        return forkJoin({
          predio: this.http.get<Predio>(`${API_CONFIG.CORE}/predios/${predioId}`).pipe(catchError(() => of(null))),
          lotes: this.http.get<Lote[]>(`${API_CONFIG.CORE}/lotes/predio/${predioId}`).pipe(catchError(() => of([]))),
          tecnico: tecnicoId ? this.http.get<Usuario>(`${API_CONFIG.CORE}/usuarios/${tecnicoId}`).pipe(catchError(() => of(null))) : of(null),
          informe: this.http.get<any>(`${API_CONFIG.INSPECCIONES}/inspecciones/${this.inspeccionId}/informe`).pipe(catchError(() => of(null))),
          subInspecciones: this.http.get<any[]>(`${API_CONFIG.INSPECCIONES}/sub-inspecciones/inspeccion/${this.inspeccionId}`).pipe(catchError(() => of([])))
        });
      }),
      switchMap(res => {
        this.predio = res.predio;
        this.lotesData = res.lotes;
        this.tecnico = res.tecnico;
        this.informeMetrics = res.informe;
        
        if (this.inspeccion) {
          this.inspeccion.sub_inspecciones = res.subInspecciones;
        }

        const productorId = this.predio?.productor_id;
        
        if (productorId) {
          return this.http.get<Usuario>(`${API_CONFIG.CORE}/usuarios/${productorId}`).pipe(
            map(prod => { this.productor = prod; return true; }),
            catchError(() => { this.productor = null; return of(true); })
          );
        }
        return of(true);
      }),
      switchMap(() => {
        // Cargar registros de plantas para cada sub-inspección
        if (!this.inspeccion?.sub_inspecciones || this.inspeccion.sub_inspecciones.length === 0) {
          return of(true);
        }

        const requests = this.inspeccion.sub_inspecciones.map(sub => {
          if (!sub.id) return of([]);
          return this.http.get<any[]>(`${API_CONFIG.INSPECCIONES}/registro-plantas/sub-inspeccion/${sub.id}`).pipe(
            tap((registros: any[]) => {
              sub.registroPlantas = registros;
            }),
            catchError(() => of([]))
          );
        });

        return forkJoin(requests);
      })
    ).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading report:', err);
        this.error = 'No se pudo generar el informe detallado.';
        this.isLoading = false;
      }
    });
  }

  public getLoteName(loteId: string): string {
    const lote = this.lotesData.find(l => l.id === loteId);
    return lote ? lote.nombre : 'Lote ' + loteId;
  }

  public getPlagaName(plagaId: string): string {
    return plagaId ? (this.plagasMap[plagaId] || 'Plaga Desconocida') : 'Ninguna';
  }

  public imprimirInforme() {
    window.print();
  }

  public descargarPDF() {
    this.dataService.descargarInformePDF(this.inspeccionId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `informe_fitosanitario_${this.inspeccionId.substring(0, 8)}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  public descargarCertificado() {
    this.dataService.descargarCertificadoPDF(this.inspeccionId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Certificado_Fitosanitario_${this.inspeccionId.substring(0, 6).toUpperCase()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  public evaluarReporte(accion: 'aprobado' | 'rechazado'): void {
    if (!this.inspeccion) return;
    const incidencia = this.inspeccion.incidencia_global_pct !== undefined && this.inspeccion.incidencia_global_pct !== null ? this.inspeccion.incidencia_global_pct : 0;
    let justificacion: string | undefined = undefined;

    if (accion === 'rechazado') {
      if (incidencia < 15.0) {
        const res = prompt('La incidencia es menor al 15%. Indique obligatoriamente el motivo del rechazo/anulación:');
        if (res === null) return; // User cancelled prompt
        if (!res.trim()) {
          this.notify.showError('El motivo de rechazo es obligatorio.');
          return;
        }
        justificacion = res.trim();
      } else {
        if (!confirm('¿Estás seguro de que deseas rechazar esta inspección?')) return;
      }
    } else {
      if (!confirm('¿Estás seguro de que deseas aprobar esta inspección?')) return;
    }

    this.dataService.evaluarAprobacion(this.inspeccion.id!, accion, justificacion).subscribe({
      next: () => {
        this.notify.showSuccess(`Inspección ${accion === 'aprobado' ? 'aprobada' : 'rechazada'} con éxito.`);
        this.cargarDatos();
        this.statusChanged.emit();
      },
      error: (err) => {
        console.error('Error al evaluar la inspección:', err);
        this.notify.showError('No se pudo actualizar el estado de aprobación de la inspección.');
      }
    });
  }
}

