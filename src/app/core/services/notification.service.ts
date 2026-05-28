import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private toastSubject = new BehaviorSubject<ToastMessage | null>(null);

  get toast$(): Observable<ToastMessage | null> {
    return this.toastSubject.asObservable();
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.toastSubject.next({ message, type: 'success', duration });
  }

  showError(message: string, duration: number = 5000): void {
    this.toastSubject.next({ message, type: 'error', duration });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.toastSubject.next({ message, type: 'info', duration });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.toastSubject.next({ message, type: 'warning', duration });
  }

  clear(): void {
    this.toastSubject.next(null);
  }
}
