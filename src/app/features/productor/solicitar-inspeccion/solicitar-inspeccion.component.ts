import { Component, OnInit, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { FitoDataService, Predio, Lote, Inspeccion, Usuario } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-solicitar-inspeccion',
  templateUrl: './solicitar-inspeccion.component.html',
  styleUrls: ['./solicitar-inspeccion.component.css'],
  standalone: false,
})
export class SolicitarInspeccionComponent implements OnInit {
  private notify = inject(NotificationService);

  public predios: Predio[] = [];
  public todosLosTecnicos: Usuario[] = [];
  public tecnicosDisponibles: Usuario[] = [];
  public predioSeleccionado: Predio | null = null;
  public lotesDelPredio: Lote[] = [];
  public loteSeleccionado: string | null = null;
  public asignacionAutomatica = true;
  public tecnicoElegido: string | null = null;
  public fechaSugerida = '';
  public comentarios = '';
  public agendaStatus: 'disponible' | 'ocupado' | null = null;
  public enviado = false;
  public isLoading = false;

  constructor(
    private dataService: FitoDataService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUsuarioActual();
    const productorId = user?.id || '';
    // Cargar solo los predios del productor autenticado
    if (productorId) {
      this.dataService.getPrediosPorProductor(productorId).subscribe(p => this.predios = p);
    } else {
      this.dataService.getPredios().subscribe(p => this.predios = p);
    }
    this.dataService.getTecnicosActivos().subscribe(t => {
      this.todosLosTecnicos = t;
      this.filtrarTecnicos();
    });
  }

  public seleccionarPredio(predio: Predio): void {
    this.predioSeleccionado = predio;
    this.loteSeleccionado = null;
    this.lotesDelPredio = [];
    this.dataService.getLotesPorPredio(predio.id).subscribe(l => {
      this.lotesDelPredio = l;
      if (l.length > 0) {
        this.loteSeleccionado = l[0].id; // Seleccionar el primero por defecto
      }
    });
    this.filtrarTecnicos();
  }

  private filtrarTecnicos(): void {
    if (!this.predioSeleccionado) {
      this.tecnicosDisponibles = [];
      return;
    }
    const dep = this.predioSeleccionado.departamento || '';
    this.tecnicosDisponibles = this.todosLosTecnicos.filter(t => t.departamento === dep);
  }

  public setModo(auto: boolean): void {
    this.asignacionAutomatica = auto;
    this.tecnicoElegido = null;
  }

  public seleccionarTecnico(id: string): void {
    this.tecnicoElegido = id;
  }

  public enviar(): void {
    if (!this.predioSeleccionado) { this.notify.showError('Selecciona un predio.'); return; }
    if (this.lotesDelPredio.length === 0) {
      this.notify.showError('El predio seleccionado no tiene lotes. Debes registrar al menos un lote para este predio antes de solicitar la inspección.');
      return;
    }
    if (!this.fechaSugerida) { this.notify.showInfo('Indica la fecha sugerida.'); return; }
    if (!this.asignacionAutomatica && !this.tecnicoElegido) {
      this.notify.showError('Selecciona un técnico de preferencia.');
      return;
    }
    
    // Regionalización check
    if (this.asignacionAutomatica && this.tecnicosDisponibles.length === 0) {
      this.notify.showError(`No hay técnicos disponibles asignados al departamento de ${this.predioSeleccionado.departamento}. Por favor contacta al administrador del sistema.`);
      return;
    }

    const tecnico = this.asignacionAutomatica
      ? 'Asignación Automática'
      : this.tecnicosDisponibles.find(t => t.id === this.tecnicoElegido)?.nombre ?? '';

    this.isLoading = true;
    this.dataService.agregarInspeccion({
      predio_id: this.predioSeleccionado.id,
      lote_id: this.loteSeleccionado || this.lotesDelPredio[0].id,
      tecnico_id: this.asignacionAutomatica ? undefined : this.tecnicoElegido,
      tecnico_nombre: tecnico,
      fecha_inspeccion: this.fechaSugerida,
      estado: 'pendiente',
      modo_asignacion: this.asignacionAutomatica ? 'automatica' : 'preferencia',
      observaciones: this.comentarios || undefined,
    } as any).subscribe({
      next: () => {
        this.enviado = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al solicitar inspección:', err);
        this.notify.showError((err as any).error?.detail || 'Hubo un error al registrar la solicitud de inspección.');
      }
    });
  }

  public nueva(): void {
    this.predioSeleccionado = null;
    this.lotesDelPredio = [];
    this.loteSeleccionado = null;
    this.tecnicoElegido = null;
    this.fechaSugerida = '';
    this.comentarios = '';
    this.enviado = false;
    this.isLoading = false;
    this.asignacionAutomatica = true;
  }
}
