import { Component, signal, inject } from '@angular/core';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css',
})
export class AppComponent {
  protected readonly title = signal('fito-gestion-app');
  public loadingService = inject(LoadingService);
}
