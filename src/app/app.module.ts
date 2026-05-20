import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { InformeFitosanitarioComponent } from './shared/components/informe-fitosanitario/informe-fitosanitario.component';
import { CommonModule } from '@angular/common'; // Asegurar uso de ngIf y DatePipe

@NgModule({
  declarations: [AppComponent, InformeFitosanitarioComponent],
  imports: [BrowserModule, AppRoutingModule, CommonModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, loadingInterceptor])),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

