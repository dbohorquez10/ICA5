import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * PILAR 1: SERVICIO DE CARGA GLOBAL
 * Maneja el estado visible/oculto del spinner
 * Lugar: src/app/core/services/loading.service.ts
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private requestCount = 0;

  show(): void {
    this.requestCount++;
    this.isLoadingSubject.next(true);
  }

  hide(): void {
    this.requestCount--;
    if (this.requestCount <= 0) {
      this.requestCount = 0;
      this.isLoadingSubject.next(false);
    }
  }

  reset(): void {
    this.requestCount = 0;
    this.isLoadingSubject.next(false);
  }
}
