import { Component, OnInit } from '@angular/core';
import { FitoDataService, Predio, Lote, Inspeccion, SubInspeccionLote } from '../../../core/services/fito-data.service';

@Component({
  selector: 'app-solicitar-inspeccion',
  templateUrl: './solicitar-inspeccion.component.html',
  styleUrls: ['./solicitar-inspeccion.component.css'],
  standalone: false,
})
export class SolicitarInspeccionComponent implements OnInit {

  public predios: Predio[] = [];
  public tecnicosDisponibles = [
    { id: 't1', nombre: 'Carlos Gómez', zona: 'Lebrija, Girón', rating: 4.8, avatar: 'CG', ocupado: false },
    { id: 't2', nombre: 'Luisa Herrera', zona: 'Bucaramanga', rating: 4.9, avatar: 'LH', ocupado: true },
    { id: 't3', nombre: 'Andrés Felipe', zona: 'San Gil', rating: 4.5, avatar: 'AF', ocupado: false },
  ];

  public predioSeleccionado: Predio | null = null;
  public lotesDelPredio: Lote[] = [];
  public asignacionAutomatica = true;
  public tecnicoElegido: string | null = null;
  public fechaSugerida = '';
  public comentarios = '';
  public agendaStatus: 'disponible' | 'ocupado' | null = null;
  public enviado = false;

  constructor(public dataService: FitoDataService) {}

  ngOnInit(): void {
    this.predios = this.dataService.getPredios();
  }

  public seleccionarPredio(predio: Predio): void {
    this.predioSeleccionado = predio;
    this.lotesDelPredio = this.dataService.getLotesPorPredio(predio.id);
  }

  public setModo(auto: boolean): void {
    this.asignacionAutomatica = auto;
    this.tecnicoElegido = null;
    this.agendaStatus = null;
  }

  public seleccionarTecnico(id: string): void {
    this.tecnicoElegido = id;
    this.verificarDisponibilidad();
  }

  public verificarDisponibilidad(): void {
    if (!this.fechaSugerida || !this.tecnicoElegido) return;
    const tech = this.tecnicosDisponibles.find(t => t.id === this.tecnicoElegido);
    this.agendaStatus = tech?.ocupado ? 'ocupado' : 'disponible';
  }

  public enviar(): void {
    if (!this.predioSeleccionado) { alert('Selecciona un predio.'); return; }
    if (!this.fechaSugerida) { alert('Indica la fecha sugerida.'); return; }
    if (!this.asignacionAutomatica && this.agendaStatus === 'ocupado') {
      alert('El técnico no está disponible en esa fecha.'); return;
    }

    const subs: SubInspeccionLote[] = this.lotesDelPredio.map(l => ({
      loteId: l.id, estado: 'Pendiente', plantasEvaluadas: 0, registroPlantas: []
    }));

    const tecnico = this.asignacionAutomatica
      ? 'Asignación Automática'
      : this.tecnicosDisponibles.find(t => t.id === this.tecnicoElegido)?.nombre ?? '';

    this.dataService.agregarInspeccion({
      predioId: this.predioSeleccionado.id,
      tecnicoNombre: tecnico,
      fechaSolicitada: this.fechaSugerida,
      estado: 'Pendiente',
      modoAsignacion: this.asignacionAutomatica ? 'automatica' : 'preferencia',
      subInspecciones: subs
    });

    this.enviado = true;
  }

  public nueva(): void {
    this.predioSeleccionado = null;
    this.lotesDelPredio = [];
    this.tecnicoElegido = null;
    this.fechaSugerida = '';
    this.comentarios = '';
    this.agendaStatus = null;
    this.enviado = false;
    this.asignacionAutomatica = true;
  }
}
