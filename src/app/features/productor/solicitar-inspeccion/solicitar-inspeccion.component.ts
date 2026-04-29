import { Component, OnInit } from '@angular/core';
import { FitoDataService, Predio, Lote, Inspeccion, Usuario } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-solicitar-inspeccion',
  templateUrl: './solicitar-inspeccion.component.html',
  styleUrls: ['./solicitar-inspeccion.component.css'],
  standalone: false,
})
export class SolicitarInspeccionComponent implements OnInit {

  public predios: Predio[] = [];
  public tecnicosDisponibles: Usuario[] = [];
  public predioSeleccionado: Predio | null = null;
  public lotesDelPredio: Lote[] = [];
  public asignacionAutomatica = true;
  public tecnicoElegido: string | null = null;
  public fechaSugerida = '';
  public comentarios = '';
  public agendaStatus: 'disponible' | 'ocupado' | null = null;
  public enviado = false;

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
    this.dataService.getTecnicosActivos().subscribe(t => this.tecnicosDisponibles = t);
  }

  public seleccionarPredio(predio: Predio): void {
    this.predioSeleccionado = predio;
    this.dataService.getLotesPorPredio(predio.id).subscribe(l => this.lotesDelPredio = l);
  }

  public setModo(auto: boolean): void {
    this.asignacionAutomatica = auto;
    this.tecnicoElegido = null;
  }

  public seleccionarTecnico(id: string): void {
    this.tecnicoElegido = id;
  }

  public enviar(): void {
    if (!this.predioSeleccionado) { alert('Selecciona un predio.'); return; }
    if (!this.fechaSugerida) { alert('Indica la fecha sugerida.'); return; }

    const tecnico = this.asignacionAutomatica
      ? 'Asignación Automática'
      : this.tecnicosDisponibles.find(t => t.id === this.tecnicoElegido)?.nombre ?? '';

    this.dataService.agregarInspeccion({
      predio_id: this.predioSeleccionado.id,
      tecnico_nombre: tecnico,
      fecha_inspeccion: this.fechaSugerida,
      estado: 'Pendiente',
      modo_asignacion: this.asignacionAutomatica ? 'automatica' : 'preferencia',
      observaciones: this.comentarios || undefined,
    } as any).subscribe(() => this.enviado = true);
  }

  public nueva(): void {
    this.predioSeleccionado = null;
    this.lotesDelPredio = [];
    this.tecnicoElegido = null;
    this.fechaSugerida = '';
    this.comentarios = '';
    this.enviado = false;
    this.asignacionAutomatica = true;
  }
}
