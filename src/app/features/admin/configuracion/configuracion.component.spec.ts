import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfiguracionComponent } from './configuracion.component';
import { AuthService } from '../../../core/services/auth.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('ConfiguracionComponent', () => {
  let component: ConfiguracionComponent;
  let fixture: ComponentFixture<ConfiguracionComponent>;

  const mockAuthService = {
    getUsuarioActual: () => ({ nombre: 'Test', apellido: 'User', rol: 'admin', registro_ica: '123' }),
    getUsuario: () => of({ nombre: 'Test', apellido: 'User', rol: 'admin', registro_ica: '123' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ConfiguracionComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfiguracionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
