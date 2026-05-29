import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { FitoDataService } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError, defaultIfEmpty } from 'rxjs/operators';


@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  standalone: false,
})
export class ReportesComponent implements OnInit {
  private notify = inject(NotificationService);
  private router = inject(Router);

  public filtroActivo: string = 'todos';
  public listaReportes: any[] = [];
  public isLoading: boolean = true;
  public usuarioActual: any = null;
  public esSoloCertificados: boolean = false;

  constructor(
    private dataService: FitoDataService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuarioActual();
    
    // Detectar si estamos en la vista exclusiva de certificados
    const url = this.router.url;
    if (url.includes('certificados')) {
      this.filtroActivo = 'aprobado';
      this.esSoloCertificados = true;
    }
    
    this.cargarReportes();
  }

  public cargarReportes(): void {
    if (!this.usuarioActual) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    const role = this.usuarioActual.rol;

    if (role === 'admin') {
      this.cargarReportesAdmin();
    } else if (role === 'tecnico') {
      this.cargarReportesTecnico();
    } else {
      this.cargarReportesProductor();
    }
  }

  private cargarReportesAdmin(): void {
    const adminDep = this.usuarioActual?.departamento || '';
    
    this.dataService.getInspecciones().pipe(
      catchError((err) => {
        console.error('Error fetching admin inspecciones:', err);
        return of([]);
      })
    ).subscribe(inspecciones => {
      const safeIns = Array.isArray(inspecciones) ? inspecciones.filter(Boolean) : [];
      if (!safeIns.length) {
        this.listaReportes = [];
        this.isLoading = false;
        return;
      }
      
      const predioIds = Array.from(new Set(safeIns.map(ins => ins.predio_id || ins.predioId || '').filter(Boolean)));
      
      if (!predioIds.length) {
        this.listaReportes = [];
        this.isLoading = false;
        return;
      }

      const prediosObs = this.dataService.getPrediosBatch(predioIds).pipe(
        catchError((err) => {
          console.error('Error fetching predios batch:', err);
          return of([]);
        })
      );

      const usersObs = this.dataService.getUsuarios().pipe(
        catchError((err) => {
          console.error('Error fetching usuarios:', err);
          return of([]);
        })
      );

      const lotesObs = forkJoin(predioIds.map(pId => 
        this.dataService.getLotesPorPredio(pId).pipe(
          catchError((err) => {
            console.error(`Error fetching lotes for predio ${pId}:`, err);
            return of([]);
          })
        )
      )).pipe(defaultIfEmpty([]));

      forkJoin({
        predios: prediosObs,
        usuarios: usersObs,
        lotesList: lotesObs
      }).pipe(
        catchError((err) => {
          console.error('Error in forkJoin admin details:', err);
          return of({ predios: [], usuarios: [], lotesList: [] });
        })
      ).subscribe(({ predios, usuarios, lotesList }) => {
        const safePredios = Array.isArray(predios) ? predios.filter(Boolean) : [];
        const safeUsuarios = Array.isArray(usuarios) ? usuarios.filter(Boolean) : [];
        const safeLotesList = Array.isArray(lotesList) ? lotesList : [];

        const predioMap = new Map(safePredios.map(p => [p.id, p]));
        const userMap = new Map(safeUsuarios.map(u => [u.id, u]));
        const lotesMap = new Map<string, string>();
        
        safeLotesList.filter(Array.isArray).flat().forEach(l => {
          if (l && l.id) lotesMap.set(l.id, l.nombre);
        });
        
        let filteredIns = this.inspectionsOnlyWithData(safeIns, predioMap);
        if (adminDep) {
          filteredIns = filteredIns.filter(ins => {
            const p = predioMap.get(ins.predio_id || ins.predioId || '');
            return p?.departamento === adminDep;
          });
        }
        
        this.listaReportes = filteredIns.map(ins => {
          const predioObj = predioMap.get(ins.predio_id || ins.predioId || '');
          const tech = ins.tecnico_id ? userMap.get(ins.tecnico_id) : null;
          const techName = tech ? `${tech.nombre} ${tech.apellido || ''}`.trim() : (ins.tecnico_nombre || 'No Asignado');
          const loteName = lotesMap.get(ins.lote_id || '') || 'Generales';
          
          return this.mapearInspeccionAReporte(ins, predioObj, techName, loteName);
        });
        
        this.isLoading = false;
      });
    });
  }

  private cargarReportesTecnico(): void {
    if (!this.usuarioActual || !this.usuarioActual.id) {
      this.isLoading = false;
      return;
    }

    this.dataService.getInspeccionesPorTecnico(this.usuarioActual.id).pipe(
      catchError((err) => {
        console.error('Error fetching tecnico inspecciones:', err);
        return of([]);
      })
    ).subscribe(inspecciones => {
      const safeIns = Array.isArray(inspecciones) ? inspecciones.filter(Boolean) : [];
      if (!safeIns.length) {
        this.listaReportes = [];
        this.isLoading = false;
        return;
      }
      
      const predioIds = Array.from(new Set(safeIns.map(ins => ins.predio_id || ins.predioId || '').filter(Boolean)));
      
      if (!predioIds.length) {
        this.listaReportes = [];
        this.isLoading = false;
        return;
      }

      const prediosObs = this.dataService.getPrediosBatch(predioIds).pipe(
        catchError((err) => {
          console.error('Error fetching predios batch:', err);
          return of([]);
        })
      );

      const usersObs = this.dataService.getUsuarios().pipe(
        catchError((err) => {
          console.error('Error fetching usuarios:', err);
          return of([]);
        })
      );

      const lotesObs = forkJoin(predioIds.map(pId => 
        this.dataService.getLotesPorPredio(pId).pipe(
          catchError((err) => {
            console.error(`Error fetching lotes for predio ${pId}:`, err);
            return of([]);
          })
        )
      )).pipe(defaultIfEmpty([]));

      forkJoin({
        predios: prediosObs,
        usuarios: usersObs,
        lotesList: lotesObs
      }).pipe(
        catchError((err) => {
          console.error('Error in forkJoin:', err);
          return of({ predios: [], usuarios: [], lotesList: [] });
        })
      ).subscribe(({ predios, usuarios, lotesList }) => {
        const safePredios = Array.isArray(predios) ? predios.filter(Boolean) : [];
        const safeUsuarios = Array.isArray(usuarios) ? usuarios.filter(Boolean) : [];
        const safeLotesList = Array.isArray(lotesList) ? lotesList : [];

        const predioMap = new Map(safePredios.map(p => [p.id, p]));
        const userMap = new Map(safeUsuarios.map(u => [u.id, u]));
        const lotesMap = new Map<string, string>();
        
        safeLotesList.filter(Array.isArray).flat().forEach(l => {
          if (l && l.id) lotesMap.set(l.id, l.nombre);
        });
        
        const techName = `${this.usuarioActual.nombre} ${this.usuarioActual.apellido || ''}`.trim();
        const filteredIns = this.inspectionsOnlyWithData(safeIns, predioMap);
        
        this.listaReportes = filteredIns.map(ins => {
          const predioObj = predioMap.get(ins.predio_id || ins.predioId || '');
          const loteName = lotesMap.get(ins.lote_id || '') || 'Generales';
          
          return this.mapearInspeccionAReporte(ins, predioObj, techName, loteName);
        });
        
        this.isLoading = false;
      });
    });
  }

  private cargarReportesProductor(): void {
    if (!this.usuarioActual || !this.usuarioActual.id) {
      this.isLoading = false;
      return;
    }

    this.dataService.getPrediosPorProductor(this.usuarioActual.id).pipe(
      catchError((err) => {
        console.error('Error fetching predios:', err);
        return of([]);
      })
    ).subscribe(predios => {
      const safePredios = Array.isArray(predios) ? predios.filter(Boolean) : [];
      if (!safePredios.length) {
        this.listaReportes = [];
        this.isLoading = false;
        return;
      }
      
      const predioMap = new Map(safePredios.map(p => [p.id, p]));
      const predioIds = safePredios.map(p => p.id).filter(Boolean);
      
      const obsIns = predioIds.map(pId => 
        this.dataService.getInspeccionesPorPredio(pId).pipe(
          catchError((err) => {
            console.error(`Error fetching inspecciones for predio ${pId}:`, err);
            return of([]);
          })
        )
      );
      
      forkJoin(obsIns).pipe(
        defaultIfEmpty([]),
        catchError((err) => {
          console.error('Error in forkJoin obsIns:', err);
          return of([]);
        })
      ).subscribe(results => {
        const safeResults = Array.isArray(results) ? results : [];
        const todasInspecciones = safeResults.filter(Array.isArray).flat().filter(Boolean);
        
        if (!todasInspecciones.length) {
          this.listaReportes = [];
          this.isLoading = false;
          return;
        }
        
        // Fetch users and lotes
        const usersObs = this.dataService.getUsuarios().pipe(
          catchError((err) => {
            console.error('Error fetching usuarios:', err);
            return of([]);
          })
        );
        
        const lotesObs = predioIds.length > 0 
          ? forkJoin(predioIds.map(pId => 
              this.dataService.getLotesPorPredio(pId).pipe(
                catchError((err) => {
                  console.error(`Error fetching lotes for predio ${pId}:`, err);
                  return of([]);
                })
              )
            )).pipe(defaultIfEmpty([]))
          : of([]);
          
        forkJoin({
          usuarios: usersObs,
          lotesList: lotesObs
        }).pipe(
          catchError((err) => {
            console.error('Error in forkJoin usuarios/lotes:', err);
            return of({ usuarios: [], lotesList: [] });
          })
        ).subscribe(({ usuarios, lotesList }) => {
          const safeUsuarios = Array.isArray(usuarios) ? usuarios.filter(Boolean) : [];
          const safeLotesList = Array.isArray(lotesList) ? lotesList : [];
          
          const userMap = new Map(safeUsuarios.map(u => [u.id, u]));
          const lotesMap = new Map<string, string>();
          safeLotesList.filter(Array.isArray).flat().forEach(l => {
            if (l && l.id) lotesMap.set(l.id, l.nombre);
          });
          
          const filteredIns = this.inspectionsOnlyWithData(todasInspecciones, predioMap);
          
          this.listaReportes = filteredIns.map(ins => {
            const predioObj = predioMap.get(ins.predio_id || ins.predioId || '');
            const tech = ins.tecnico_id ? userMap.get(ins.tecnico_id) : null;
            const techName = tech ? `${tech.nombre} ${tech.apellido || ''}`.trim() : (ins.tecnico_nombre || 'No Asignado');
            const loteName = lotesMap.get(ins.lote_id || '') || 'Generales';
            
            return this.mapearInspeccionAReporte(ins, predioObj, techName, loteName);
          });
          
          this.isLoading = false;
        });
      });
    });
  }

  private inspectionsOnlyWithData(inspecciones: any[], predioMap: Map<string, any>): any[] {
    if (!inspecciones) return [];
    return inspecciones.filter(ins => {
      if (!ins) return false;
      const predioId = ins.predio_id || ins.predioId;
      return !!predioId && predioMap.has(predioId);
    });
  }

  private mapearInspeccionAReporte(ins: any, predio: any, tecnicoNombre: string, loteName: string): any {
    if (!ins) return null;
    const globalIncidencia = ins.incidencia_global_pct !== undefined && ins.incidencia_global_pct !== null ? ins.incidencia_global_pct : 0;
    
    // Normalizar el estado
    let estadoDisplay = 'Pendiente';
    const est = (ins.estado || '').toLowerCase();
    const estAprob = (ins.estado_aprobacion || 'pendiente').toLowerCase();
    
    if (estAprob === 'rechazado' || globalIncidencia >= 15.0) {
      estadoDisplay = 'Alerta Detectada';
    } else if (estAprob === 'aprobado') {
      estadoDisplay = 'Aprobado';
    } else if (est.includes('comple') || est.includes('done') || est.includes('cerrada')) {
      estadoDisplay = 'En Revisión';
    } else if (est.includes('progreso')) {
      estadoDisplay = 'En Revisión';
    } else {
      estadoDisplay = 'Pendiente';
    }

    return {
      id: ins.id,
      archivo: `Reporte_${(ins.id || '').substring(0, 6).toUpperCase()}.pdf`,
      predio: predio?.nombre || 'Finca Desconocida',
      cultivo: loteName !== 'Generales' ? loteName : 'Generales',
      fecha: ins.fecha_inspeccion ? new Date(ins.fecha_inspeccion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      estado: estadoDisplay,
      tecnico: tecnicoNombre || 'No Asignado',
      incidencia: parseFloat(globalIncidencia.toFixed(1))
    };
  }

  get reportesFiltrados() {
    const validReportes = this.listaReportes.filter(r => r !== null);
    if (this.filtroActivo === 'todos') return validReportes;
    if (this.filtroActivo === 'aprobado') return validReportes.filter(r => r.estado === 'Aprobado');
    if (this.filtroActivo === 'alerta') return validReportes.filter(r => r.estado === 'Alerta Detectada');
    return validReportes;
  }

  public setFiltro(filtro: string): void {
    this.filtroActivo = filtro;
  }

  public informeSeleccionadoId: string | null = null;

  public verInforme(reporte: any): void {
    if (reporte) {
      this.informeSeleccionadoId = reporte.id;
    }
  }

  public cerrarInforme(): void {
    this.informeSeleccionadoId = null;
  }

  public descargar(reporte: any): void {
    if (!reporte) return;
    this.dataService.descargarInformePDF(reporte.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = reporte.archivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando el PDF:', err);
        this.notify.showError('Hubo un error al generar o descargar el PDF del informe.');
      }
    });
  }

  public evaluarReporte(inspeccionId: string, accion: 'aprobado' | 'rechazado'): void {
    if (!inspeccionId) return;

    const reporteObj = this.listaReportes.find(r => r && r.id === inspeccionId);
    const incidencia = reporteObj ? reporteObj.incidencia : 0;
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

    this.dataService.evaluarAprobacion(inspeccionId, accion, justificacion).subscribe({
      next: () => {
        this.notify.showSuccess(`Inspección ${accion === 'aprobado' ? 'aprobada' : 'rechazada'} con éxito.`);
        this.cargarReportes();
      },
      error: (err) => {
        console.error('Error al evaluar la inspección:', err);
        this.notify.showError('No se pudo actualizar el estado de aprobación de la inspección.');
      }
    });
  }

  public descargarCertificado(reporte: any): void {
    if (!reporte) return;
    this.dataService.descargarCertificadoPDF(reporte.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Certificado_Fitosanitario_${reporte.id.substring(0, 6).toUpperCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando el certificado:', err);
        this.notify.showError('Hubo un error al generar o descargar el PDF del certificado.');
      }
    });
  }
}
