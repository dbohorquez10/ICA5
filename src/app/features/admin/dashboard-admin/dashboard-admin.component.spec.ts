import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardAdminComponent } from './dashboard-admin.component';
import { FitoDataService } from '../../../core/services/fito-data.service';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('DashboardAdminComponent', () => {
  let component: DashboardAdminComponent;
  let fixture: ComponentFixture<DashboardAdminComponent>;

  const mockFitoDataService = {
    getUsuarios: () => of([]),
    getInspecciones: () => of([]),
    getInspeccionesPendientes: () => of([]),
    getPrediosBatch: () => of([]),
    getLotesPorPredio: () => of([]),
    getTecnicosActivos: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [DashboardAdminComponent],
      providers: [
        { provide: FitoDataService, useValue: mockFitoDataService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
