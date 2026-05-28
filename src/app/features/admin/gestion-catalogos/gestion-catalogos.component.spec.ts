import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionCatalogosComponent } from './gestion-catalogos.component';
import { FitoDataService } from '../../../core/services/fito-data.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('GestionCatalogosComponent', () => {
  let component: GestionCatalogosComponent;
  let fixture: ComponentFixture<GestionCatalogosComponent>;

  const mockFitoDataService = {
    getPlagas: () => of([]),
    getCultivos: () => of([]),
    agregarPlaga: () => of({}),
    editarPlaga: () => of({}),
    eliminarPlaga: () => of({}),
    agregarCultivo: () => of({}),
    editarCultivo: () => of({}),
    eliminarCultivo: () => of({}),
    getPlagasPorCultivo: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [GestionCatalogosComponent],
      providers: [
        { provide: FitoDataService, useValue: mockFitoDataService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GestionCatalogosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
