import { Component, OnInit } from '@angular/core';
import { FitoDataService, Plaga, Cultivo } from '../../../core/services/fito-data.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-gestion-catalogos',
  templateUrl: './gestion-catalogos.component.html',
  styleUrls: ['./gestion-catalogos.component.css'],
  standalone: false
})
export class GestionCatalogosComponent implements OnInit {

  public plagas: Plaga[] = [];
  public cultivos: Cultivo[] = [];
  public plagasDisponibles: Plaga[] = [];

  public modalVisible = false;
  public modalTipo: 'plaga' | 'cultivo' = 'plaga';
  public modalModo: 'crear' | 'editar' = 'crear';
  public editandoId: string = '';
  public nuevoItem: any = {};
  public errorModal: string = '';

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void { this.recargar(); }

  private recargar(): void {
    forkJoin({
      plagas: this.dataService.getPlagas(),
      cultivos: this.dataService.getCultivos(),
    }).subscribe(({ plagas, cultivos }) => {
      this.plagas = plagas;
      this.cultivos = cultivos;
      this.plagasDisponibles = plagas;
    });
  }

  // --- Abrir modal para CREAR ---
  public abrirModal(tipo: 'plaga' | 'cultivo'): void {
    this.modalTipo = tipo;
    this.modalModo = 'crear';
    this.editandoId = '';
    this.errorModal = '';
    this.nuevoItem = tipo === 'plaga'
      ? { nombre_comun: '', descripcion: '', riesgo: 'Bajo', tipo: 'insecto', cultivos_afectados: [] }
      : { nombre: '', variedad: '', icono: 'eco', color: '#22c55e', plagasSeleccionadas: [] };
    this.modalVisible = true;
  }

  // --- Abrir modal para EDITAR ---
  public editarPlaga(plaga: Plaga): void {
    this.modalTipo = 'plaga';
    this.modalModo = 'editar';
    this.editandoId = plaga.id;
    this.errorModal = '';
    this.nuevoItem = { ...plaga, cultivos_afectados: [...(plaga.cultivos_afectados || [])] };
    this.modalVisible = true;
  }

  public editarCultivo(cultivo: Cultivo): void {
    this.modalTipo = 'cultivo';
    this.modalModo = 'editar';
    this.editandoId = cultivo.id;
    this.errorModal = '';
    this.nuevoItem = { ...cultivo };
    this.nuevoItem.plagasSeleccionadas = this.plagas
      .filter(p => (p.cultivos_afectados || []).includes(cultivo.id))
      .map(p => p.id);
    this.modalVisible = true;
  }

  public togglePlaga(plagaId: string): void {
    if (!this.nuevoItem.plagasSeleccionadas) this.nuevoItem.plagasSeleccionadas = [];
    const idx = this.nuevoItem.plagasSeleccionadas.indexOf(plagaId);
    idx > -1 ? this.nuevoItem.plagasSeleccionadas.splice(idx, 1) : this.nuevoItem.plagasSeleccionadas.push(plagaId);
  }

  public toggleCultivo(cultivoId: string): void {
    if (!this.nuevoItem.cultivos_afectados) this.nuevoItem.cultivos_afectados = [];
    const idx = this.nuevoItem.cultivos_afectados.indexOf(cultivoId);
    idx > -1 ? this.nuevoItem.cultivos_afectados.splice(idx, 1) : this.nuevoItem.cultivos_afectados.push(cultivoId);
  }

  public cerrarModal(): void {
    this.modalVisible = false;
    this.errorModal = '';
  }

  public guardar(): void {
    this.errorModal = '';

    const nombre = this.modalTipo === 'plaga'
      ? this.nuevoItem.nombre_comun?.trim()
      : this.nuevoItem.nombre?.trim();

    if (!nombre) {
      this.errorModal = 'El nombre es obligatorio.';
      return;
    }

    if (this.modalTipo === 'plaga' && !this.nuevoItem.descripcion?.trim()) {
      this.errorModal = 'La descripción de la plaga es obligatoria.';
      return;
    }
    if (this.modalTipo === 'cultivo' && !this.nuevoItem.variedad?.trim()) {
      this.errorModal = 'Las variedades del cultivo son obligatorias.';
      return;
    }

    if (this.modalModo === 'crear') {
      if (this.modalTipo === 'plaga') {
        this.dataService.agregarPlaga(this.nuevoItem).subscribe(() => { this.recargar(); this.cerrarModal(); });
      } else {
        this.dataService.agregarCultivo(this.nuevoItem).subscribe(() => { this.recargar(); this.cerrarModal(); });
      }
    } else {
      if (this.modalTipo === 'plaga') {
        this.dataService.editarPlaga(this.editandoId, this.nuevoItem).subscribe(() => { this.recargar(); this.cerrarModal(); });
      } else {
        this.dataService.editarCultivo(this.editandoId, this.nuevoItem).subscribe(() => { this.recargar(); this.cerrarModal(); });
      }
    }
  }

  public eliminarPlaga(id: string): void {
    if (confirm('¿Eliminar esta plaga del catálogo?')) {
      this.dataService.eliminarPlaga(id).subscribe(() => this.recargar());
    }
  }

  public eliminarCultivo(id: string): void {
    if (confirm('¿Eliminar este cultivo?')) {
      this.dataService.eliminarCultivo(id).subscribe(() => this.recargar());
    }
  }
}
