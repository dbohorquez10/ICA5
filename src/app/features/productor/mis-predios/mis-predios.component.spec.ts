import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisPredios } from './mis-predios';

describe('MisPredios', () => {
  let component: MisPredios;
  let fixture: ComponentFixture<MisPredios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MisPredios],
    }).compileComponents();

    fixture = TestBed.createComponent(MisPredios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
