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
  public nuevoItem: any = {};

  constructor(private dataService: FitoDataService) {}

  ngOnInit(): void { this.recargar(); }

  private recargar(): void {
    this.plagas = this.dataService.getPlagas();
    this.cultivos = this.dataService.getCultivos();
  }

  public abrirModal(tipo: 'plaga' | 'cultivo'): void {
    this.modalTipo = tipo;
    this.nuevoItem = tipo === 'plaga'
      ? { nombre: '', descripcion: '', riesgo: 'Bajo', icon: 'bug_report', color: '#4ade80', cultivosAfectados: [] }
      : { nombre: '', variedad: '', icono: 'eco', color: '#22c55e' };
    this.modalVisible = true;
  }

  public cerrarModal(): void { this.modalVisible = false; }

  public guardar(): void {
    if (!this.nuevoItem.nombre) { alert('El nombre es obligatorio'); return; }
    if (this.modalTipo === 'plaga') {
      this.dataService.agregarPlaga(this.nuevoItem);
    } else {
      this.dataService.agregarCultivo(this.nuevoItem);
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
