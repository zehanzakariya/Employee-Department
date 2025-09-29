import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectionDialog } from './rejection-dialog';

describe('RejectionDialog', () => {
  let component: RejectionDialog;
  let fixture: ComponentFixture<RejectionDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejectionDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RejectionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
