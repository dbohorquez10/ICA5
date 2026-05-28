import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionUsuariosComponent } from './gestion-usuarios.component';
import { FitoDataService } from '../../../core/services/fito-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('GestionUsuariosComponent', () => {
  let component: GestionUsuariosComponent;
  let fixture: ComponentFixture<GestionUsuariosComponent>;

  const mockFitoDataService = {
    getUsuarios: () => of([]),
    editarUsuario: () => of({}),
    suspenderUsuario: () => of({}),
    eliminarUsuario: () => of({})
  };

  const mockAuthService = {
    registerAdmin: () => of({})
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [GestionUsuariosComponent],
      providers: [
        { provide: FitoDataService, useValue: mockFitoDataService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GestionUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
