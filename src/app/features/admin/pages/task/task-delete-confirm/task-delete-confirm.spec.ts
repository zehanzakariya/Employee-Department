import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskDeleteConfirm } from './task-delete-confirm';

describe('TaskDeleteConfirm', () => {
  let component: TaskDeleteConfirm;
  let fixture: ComponentFixture<TaskDeleteConfirm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskDeleteConfirm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskDeleteConfirm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
