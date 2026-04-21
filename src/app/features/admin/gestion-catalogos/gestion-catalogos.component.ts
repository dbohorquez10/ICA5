import { Component, OnInit } from '@angular/core';
import { FitoDataService, Plaga, Cultivo } from '../../../core/services/fito-data.service';

@Component({
  selector: 'app-gestion-catalogos',
  templateUrl: './gestion-catalogos.component.html',
  styleUrls: ['./gestion-catalogos.component.css'],
  standalone: false
})
export class GestionCatalogosComponent implements OnInit {

  public plagas: Plaga[] = [];
  public cultivos: Cultivo[] = [];

  public modalVisible = false;
  public modalTipo: 'plaga' | 'cultivo' = 'plaga';
  public modalModo: 'crear' | 'editar' = 'crear';
  public editandoId: string = '';
  public nuevoItem: any = {};
  public errorModal: string = '';

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void { this.recargar(); }

  private recargar(): void {
    this.plagas = this.dataService.getPlagas();
    this.cultivos = this.dataService.getCultivos();
  }

  // --- Abrir modal para CREAR ---
  public abrirModal(tipo: 'plaga' | 'cultivo'): void {
    this.modalTipo = tipo;
    this.modalModo = 'crear';
    this.editandoId = '';
    this.errorModal = '';
    this.nuevoItem = tipo === 'plaga'
      ? { nombre: '', descripcion: '', riesgo: 'Bajo', icon: 'bug_report', color: '#4ade80', cultivosAfectados: [] }
      : { nombre: '', variedad: '', icono: 'eco', color: '#22c55e' };
    this.modalVisible = true;
  }

  // --- Abrir modal para EDITAR ---
  public editarPlaga(plaga: Plaga): void {
    this.modalTipo = 'plaga';
    this.modalModo = 'editar';
    this.editandoId = plaga.id;
    this.errorModal = '';
    this.nuevoItem = { ...plaga };
    this.modalVisible = true;
  }

  public editarCultivo(cultivo: Cultivo): void {
    this.modalTipo = 'cultivo';
    this.modalModo = 'editar';
    this.editandoId = cultivo.id;
    this.errorModal = '';
    this.nuevoItem = { ...cultivo };
    this.modalVisible = true;
  }

  public cerrarModal(): void {
    this.modalVisible = false;
    this.errorModal = '';
  }

  public guardar(): void {
    this.errorModal = '';

    if (!this.nuevoItem.nombre?.trim()) {
      this.errorModal = 'El nombre es obligatorio.';
      return;
    }

    // Validación de duplicados
    if (this.modalTipo === 'plaga') {
      const nombreNuevo = this.nuevoItem.nombre.trim().toLowerCase();
      const duplicado = this.plagas.some(p =>
        p.nombre.toLowerCase().trim() === nombreNuevo && p.id !== this.editandoId
      );
      if (duplicado) {
        this.errorModal = `Ya existe una plaga con el nombre "${this.nuevoItem.nombre.trim()}". No se permiten duplicados.`;
        return;
      }

      if (!this.nuevoItem.descripcion?.trim()) {
        this.errorModal = 'La descripción de la plaga es obligatoria.';
        return;
      }
    } else {
      const nombreNuevo = this.nuevoItem.nombre.trim().toLowerCase();
      const duplicado = this.cultivos.some(c =>
        c.nombre.toLowerCase().trim() === nombreNuevo && c.id !== this.editandoId
      );
      if (duplicado) {
        this.errorModal = `Ya existe un cultivo con el nombre "${this.nuevoItem.nombre.trim()}". No se permiten duplicados.`;
        return;
      }

      if (!this.nuevoItem.variedad?.trim()) {
        this.errorModal = 'Las variedades del cultivo son obligatorias.';
        return;
      }
    }

    // Guardar o actualizar
    if (this.modalModo === 'crear') {
      if (this.modalTipo === 'plaga') {
        this.dataService.agregarPlaga(this.nuevoItem);
      } else {
        this.dataService.agregarCultivo(this.nuevoItem);
      }
    } else {
      // Editar
      if (this.modalTipo === 'plaga') {
        this.dataService.editarPlaga(this.editandoId, this.nuevoItem);
      } else {
        this.dataService.editarCultivo(this.editandoId, this.nuevoItem);
      }
    }

    this.recargar();
    this.cerrarModal();
  }

  public eliminarPlaga(id: string): void {
    if (confirm('¿Eliminar esta plaga del catálogo?')) {
      this.dataService.eliminarPlaga(id);
      this.recargar();
    }
  }

  public eliminarCultivo(id: string): void {
    if (confirm('¿Eliminar este cultivo?')) {
      this.dataService.eliminarCultivo(id);
      this.recargar();
    }
  }
}
