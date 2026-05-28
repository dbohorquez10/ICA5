import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';

/**
 * PILAR 1: SERVICIO DE CARGA GLOBAL
 * Maneja el estado visible/oculto del spinner
 * Soporta acceso como Signal e interoperabilidad como Observable (isLoading$)
 * Lugar: src/app/core/services/loading.service.ts
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly isLoading = signal<boolean>(false);
  readonly isLoading$ = toObservable(this.isLoading);

  private requestCount = 0;

  show(): void {
    this.requestCount++;
    this.isLoading.set(true);
  }

  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.isLoading.set(false);
    }
  }

  reset(): void {
    this.requestCount = 0;
    this.isLoading.set(false);
  }
}
