import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeCrud } from './employee-crud';

describe('EmployeeCrud', () => {
  let component: EmployeeCrud;
  let fixture: ComponentFixture<EmployeeCrud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeCrud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeCrud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
