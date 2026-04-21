import { Component, OnInit } from '@angular/core';

/**
 * @description
 * Controlador de la vista principal (Landing Page).
 * Actúa como el punto de entrada público, presentando los beneficios
 * del sistema antes de requerir autenticación de usuario.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: false,
})
export class HomeComponent implements OnInit {
  /**
   * @constructor
   * Inicializa el componente de la vista pública.
   */
  constructor() {}

  /**
   * @method ngOnInit
   * Hook del ciclo de vida de Angular.
   * Se ejecuta al montar el componente en el DOM.
   */
  ngOnInit(): void {
    // Espacio reservado para inicialización de métricas públicas o animaciones
  }
}
