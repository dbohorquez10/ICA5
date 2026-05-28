import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { FitoDataService } from '../../../core/services/fito-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { COLOMBIA_DEPARTAMENTOS } from '../../../core/constants/colombia-regions';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.component.html',
  styleUrls: ['./configuracion.component.css'],
  standalone: false
})
export class ConfiguracionComponent implements OnInit {
  private notify = inject(NotificationService);
  private fitoDataService = inject(FitoDataService);

  public perfil = {
    nombre: '',
    cargo: '',
    codigoICA: '',
    departamento: '',
    municipiosSede: [] as string[]
  };

  public notificaciones = {
    alertasPlagaGrave: true,
    nuevasSolicitudes: true,
    resumenSemanal: false,
    inspeccionesVencidas: true
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getUsuarioActual();
    if (user) {
      this.perfil.nombre = `${user.nombre || ''} ${user.apellido || ''}`.trim() || 'Usuario';
      this.perfil.cargo = user.rol === 'admin' ? 'Administrador del Sistema' : (user.rol === 'tecnico' ? 'Técnico de Campo' : 'Productor');
      this.perfil.codigoICA = user.registro_ica || 'No aplica';
      this.perfil.departamento = user.departamento || 'No asignado';
      
      // Mostrar todos los municipios del departamento asignado
      if (user.departamento && COLOMBIA_DEPARTAMENTOS[user.departamento]) {
        this.perfil.municipiosSede = COLOMBIA_DEPARTAMENTOS[user.departamento];
      } else {
        this.perfil.municipiosSede = [user.municipio, user.vereda].filter(Boolean) as string[];
      }
      
      this.fitoDataService.getPreferenciasUsuario(user.id).subscribe({
        next: (prefs) => {
          if (prefs) {
            this.notificaciones.alertasPlagaGrave = prefs.alertas_plaga_grave ?? true;
            this.notificaciones.nuevasSolicitudes = prefs.nuevas_solicitudes ?? true;
            this.notificaciones.inspeccionesVencidas = prefs.inspecciones_vencidas ?? true;
            this.notificaciones.resumenSemanal = prefs.resumen_semanal ?? false;
          }
        },
        error: () => this.notify.showError('No se pudieron cargar las preferencias.')
      });
    }
  }

  public guardar(): void {
    const user = this.authService.getUsuarioActual();
    if (user) {
      const prefs = {
        alertas_plaga_grave: this.notificaciones.alertasPlagaGrave,
        nuevas_solicitudes: this.notificaciones.nuevasSolicitudes,
        inspecciones_vencidas: this.notificaciones.inspeccionesVencidas,
        resumen_semanal: this.notificaciones.resumenSemanal
      };
      this.fitoDataService.actualizarPreferenciasUsuario(user.id, prefs).subscribe({
        next: () => this.notify.showSuccess('Configuración guardada correctamente.'),
        error: () => this.notify.showError('Error al guardar configuración.')
      });
    } else {
      this.notify.showError('No hay usuario activo.');
    }
  }
}
