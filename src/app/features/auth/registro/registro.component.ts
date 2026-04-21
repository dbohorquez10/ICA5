import { Component } from '@angular/core';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css'],
  standalone: false,
})
export class RegistroComponent {
  rolSeleccionado: string = 'productor';

  cambiarRol(rol: string): void {
    this.rolSeleccionado = rol;
  }

  registrarUsuario(event: Event): void {
    event.preventDefault();
    console.log('Registro enviado como:', this.rolSeleccionado);
  }
}
