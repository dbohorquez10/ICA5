import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Inspecciones } from './inspecciones';

describe('Inspecciones', () => {
  let component: Inspecciones;
  let fixture: ComponentFixture<Inspecciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Inspecciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Inspecciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
