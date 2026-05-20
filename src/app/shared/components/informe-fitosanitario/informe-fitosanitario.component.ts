import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_CONFIG } from '../../../core/services/api.config';

@Component({
  selector: 'app-informe-fitosanitario',
  templateUrl: './informe-fitosanitario.component.html',
  styleUrls: ['./informe-fitosanitario.component.css'],
  standalone: false
})
export class InformeFitosanitarioComponent implements OnInit {
  @Input() inspeccionId!: string;
  public informe: any = null;
  public error: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (this.inspeccionId) {
      this.generarInforme();
    }
  }

  generarInforme() {
    this.http.get(`${API_CONFIG.INSPECCIONES}/inspecciones/${this.inspeccionId}/informe`)
      .subscribe({
        next: (res) => this.informe = res,
        error: (err) => this.error = 'No se pudo generar el informe.'
      });
  }

  imprimirInforme() {
    window.print();
  }
}
