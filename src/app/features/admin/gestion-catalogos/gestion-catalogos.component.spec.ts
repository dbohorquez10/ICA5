import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionCatalogos } from './gestion-catalogos';

describe('GestionCatalogos', () => {
  let component: GestionCatalogos;
  let fixture: ComponentFixture<GestionCatalogos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GestionCatalogos],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionCatalogos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
