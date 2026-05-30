import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="error-container">
      <div class="error-card">
        <div class="icon-wrapper">
          <span class="material-icons">travel_explore</span>
        </div>
        <h1>Página no Encontrada</h1>
        <p class="error-code">Error 404</p>
        <p class="error-msg">La página que estás buscando no existe, ha sido movida o no está disponible temporalmente.</p>
        <div class="actions">
          <a routerLink="/landing" class="btn btn-primary">Volver al Inicio</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: radial-gradient(circle at top right, #f4f6f2 0%, #e8ede5 100%);
      padding: 2rem;
      font-family: 'Inter', sans-serif;
    }
    .error-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 3rem 2rem;
      border-radius: 24px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(27, 38, 16, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .icon-wrapper {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #4a6e30 0%, #1b2610 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 8px 16px rgba(74, 110, 48, 0.2);
    }
    .icon-wrapper .material-icons {
      color: white;
      font-size: 40px;
      animation: bounce 2s infinite;
    }
    h1 {
      color: #1b2610;
      font-size: 2rem;
      font-weight: 800;
      margin: 0 0 0.5rem;
      letter-spacing: -0.5px;
    }
    .error-code {
      color: #4a6e30;
      font-weight: 700;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 0 0 1.5rem;
    }
    .error-msg {
      color: #4b5563;
      font-size: 0.975rem;
      line-height: 1.6;
      margin: 0 0 2.5rem;
    }
    .actions {
      display: flex;
      justify-content: center;
    }
    .btn {
      padding: 0.75rem 2rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.925rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
    }
    .btn-primary {
      background: #1b2610;
      color: white;
      box-shadow: 0 4px 12px rgba(27, 38, 16, 0.15);
    }
    .btn-primary:hover {
      background: #2b3b1c;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(27, 38, 16, 0.25);
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `]
})
export class NotFoundComponent {}
