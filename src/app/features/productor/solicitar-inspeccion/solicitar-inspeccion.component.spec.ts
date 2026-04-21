import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitarInspeccion } from './solicitar-inspeccion';

describe('SolicitarInspeccion', () => {
  let component: SolicitarInspeccion;
  let fixture: ComponentFixture<SolicitarInspeccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SolicitarInspeccion],
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitarInspeccion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
