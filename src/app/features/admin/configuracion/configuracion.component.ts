import { Component } from '@angular/core';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css'],
  standalone: false
})
export class ConfiguracionComponent {

  public perfil = {
    nombre: 'Luis Ernesto Vargas',
    cargo: 'Inspector ICA Senior',
    codigoICA: 'ICA-SAN-0047',
    departamento: 'Santander',
    municipiosSede: ['Bucaramanga', 'Lebrija', 'Girón', 'San Gil']
  };

  public notificaciones = {
    alertasPlagaGrave: true,
    nuevasSolicitudes: true,
    resumenSemanal: false,
    inspeccionesVencidas: true
  };

  public guardar(): void {
    alert('Configuración guardada correctamente.');
  }
}
