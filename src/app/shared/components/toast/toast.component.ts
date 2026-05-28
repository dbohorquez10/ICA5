import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, ToastMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="toast">
      <div class="toast" [ngClass]="toast.type">
        <span class="material-icons toast-icon">{{ getIcon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="close()">
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out forwards;
    }
    
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 450px;
    }
    
    .toast.success { background-color: #2e7d32; }
    .toast.error { background-color: #d32f2f; }
    .toast.info { background-color: #0288d1; }
    .toast.warning { background-color: #ed6c02; }
    
    .toast-icon { font-size: 24px; }
    .toast-message { flex: 1; font-size: 14px; font-weight: 500; }
    
    .toast-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      opacity: 0.8;
      transition: opacity 0.2s;
    }
    .toast-close:hover { opacity: 1; }
    
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: ToastMessage | null = null;
  private sub?: Subscription;
  private timeoutId?: any;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.notificationService.toast$.subscribe(toast => {
      this.toast = toast;
      
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      
      if (toast && toast.duration) {
        this.timeoutId = setTimeout(() => {
          this.close();
        }, toast.duration);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  close(): void {
    this.notificationService.clear();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'info': return 'info';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }
}
