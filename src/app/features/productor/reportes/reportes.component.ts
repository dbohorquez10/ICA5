import { Component } from '@angular/core';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css'],
  standalone: false,
})
export class ReportesComponent {

  public filtroActivo: string = 'todos';

  public listaReportes = [
    {
      id: 101,
      archivo: 'Certificado_Exportacion_001.pdf',
      predio: 'Finca La Esmeralda',
      cultivo: 'Cítricos',
      fecha: '10 Abr 2026',
      estado: 'Aprobado',
      tecnico: 'Ing. R. Pérez',
      incidencia: 2.1
    },
    {
      id: 102,
      archivo: 'Acta_Inspeccion_024.pdf',
      predio: 'Hacienda El Recreo',
      cultivo: 'Aguacate Hass',
      fecha: '15 Mar 2026',
      estado: 'Alerta Detectada',
      tecnico: 'Ing. S. Gómez',
      incidencia: 34.7
    },
    {
      id: 103,
      archivo: 'Muestreo_Rutina_112.pdf',
      predio: 'Finca La Esmeralda',
      cultivo: 'Cítricos',
      fecha: '02 Ene 2026',
      estado: 'Aprobado',
      tecnico: 'Ing. R. Pérez',
      incidencia: 0.5
    },
    {
      id: 104,
      archivo: 'Reporte_Fitosanitario_Q1.pdf',
      predio: 'Hacienda El Recreo',
      cultivo: 'Aguacate Hass',
      fecha: '20 Feb 2026',
      estado: 'En Revisión',
      tecnico: 'Ing. S. Gómez',
      incidencia: 15.3
    }
  ];

  get reportesFiltrados() {
    if (this.filtroActivo === 'todos') return this.listaReportes;
    if (this.filtroActivo === 'aprobado') return this.listaReportes.filter(r => r.estado === 'Aprobado');
    if (this.filtroActivo === 'alerta') return this.listaReportes.filter(r => r.estado === 'Alerta Detectada');
    return this.listaReportes;
  }

  public setFiltro(filtro: string): void {
    this.filtroActivo = filtro;
  }

  public descargar(reporte: any): void {
    alert(`Descargando: ${reporte.archivo} (simulado)`);
  }
}
