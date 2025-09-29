import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { Admin } from '../../../../core/services/admin.service';
import { Dept } from '../../../../core/services/dept.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { Employees } from './employees';

describe('Employees', () => {
  let component: Employees;
  let fixture: ComponentFixture<Employees>;

  // Mock toastr
  const mockToastr = {
    error: jasmine.createSpy('error'),
    success: jasmine.createSpy('success'),
    warning: jasmine.createSpy('warning')
  };

  const mockAdmin = {
    pendingEmployees: jasmine.createSpy('pendingEmployees'),
    approveEmployee: jasmine.createSpy('approveEmployee'),
    rejectEmployee: jasmine.createSpy('rejectEmployee')
  };

  const mockDeptService = {
    list: jasmine.createSpy('list')
  };

  const mockDialogRef = {
    afterClosed: () => of('Reason for rejection')
  };

  const mockDialog = {
    open: jasmine.createSpy('open').and.returnValue(mockDialogRef)
  };

  const dummyDepartments = [
    { departmentId: 1, departmentName: 'Engineering' },
    { departmentId: 2, departmentName: 'HR' }
  ];

  const dummyEmployees = [
    {
      userProfileId: 101,
      fullName: 'John Doe',
      email: 'john@example.com',
      gender: 'Male',
      age: 30,
      departmentId: 1,
      userStatusId: 1,
      userStatus: 'Pending',
      rejectionReason: null
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatDialogModule, MatSnackBarModule, BrowserAnimationsModule],
      declarations: [Employees],
      providers: [
        { provide: Admin, useValue: mockAdmin },
        { provide: Dept, useValue: mockDeptService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: MatDialog, useValue: mockDialog }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignores unknown HTML/Angular Material tags in template
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Employees);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Reset spies after each test
    mockToastr.error.calls.reset();
    mockToastr.success.calls.reset();
    mockToastr.warning.calls.reset();
    mockAdmin.pendingEmployees.calls.reset();
    mockAdmin.approveEmployee.calls.reset();
    mockAdmin.rejectEmployee.calls.reset();
    mockDeptService.list.calls.reset();
    mockDialog.open.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load departments and pending employees on init', () => {
    mockDeptService.list.and.returnValue(of(dummyDepartments));
    mockAdmin.pendingEmployees.and.returnValue(of(dummyEmployees));

    component.ngOnInit();

    expect(mockDeptService.list).toHaveBeenCalled();
    expect(mockAdmin.pendingEmployees).toHaveBeenCalled();
    expect(component.rows.length).toBe(1);
    expect(component.rows[0].departmentName).toBe('Engineering');
  });

  it('should handle department load error', () => {
    mockDeptService.list.and.returnValue(throwError(() => new Error('Failed')));
    component.ngOnInit();

    expect(mockToastr.error).toHaveBeenCalledWith(
      'Failed to load departments',
      'Error',
      jasmine.any(Object)
    );
  });

  it('should handle pending employee load error', () => {
    mockDeptService.list.and.returnValue(of(dummyDepartments));
    mockAdmin.pendingEmployees.and.returnValue(throwError(() => new Error('API error')));

    component.ngOnInit();

    expect(mockToastr.error).toHaveBeenCalledWith(
      'Failed to load pending employees',
      'Error',
      jasmine.any(Object)
    );
    expect(component.rows.length).toBe(0);
  });

  it('should approve an employee and remove them from the list', () => {
    component.rows = [...dummyEmployees];
    mockAdmin.approveEmployee.and.returnValue(of({}));

    component.approve(101);

    expect(mockAdmin.approveEmployee).toHaveBeenCalledWith(101);
    expect(mockToastr.success).toHaveBeenCalledWith(
      'Employee approved. Password emailed automatically.',
      'Success',
      jasmine.any(Object)
    );
    expect(component.rows.length).toBe(0);
  });

  it('should handle approval failure', () => {
    component.rows = [...dummyEmployees];
    mockAdmin.approveEmployee.and.returnValue(throwError(() => new Error('Failure')));

    component.approve(101);

    expect(mockToastr.error).toHaveBeenCalledWith(
      'Approval failed',
      'Error',
      jasmine.any(Object)
    );
  });

  it('should reject an employee and remove them from the list', fakeAsync(() => {
    component.rows = [...dummyEmployees];
    mockAdmin.rejectEmployee.and.returnValue(of({}));

    component.reject(101);
    tick(); // Simulate async afterClosed

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockAdmin.rejectEmployee).toHaveBeenCalledWith(101, 'Reason for rejection');
    expect(mockToastr.warning).toHaveBeenCalledWith(
      'Employee rejected',
      'Warning',
      jasmine.any(Object)
    );
    expect(component.rows.length).toBe(0);
  }));

  it('should handle rejection error', fakeAsync(() => {
    component.rows = [...dummyEmployees];
    mockAdmin.rejectEmployee.and.returnValue(throwError(() => new Error('Rejection error')));

    component.reject(101);
    tick();

    expect(mockToastr.error).toHaveBeenCalledWith(
      'Rejection failed',
      'Error',
      jasmine.any(Object)
    );
  }));

  it('should skip rejection if dialog is closed without a reason', fakeAsync(() => {
    mockDialog.open.and.returnValue({
      afterClosed: () => of(null)
    } as any);

    component.rows = [...dummyEmployees];
    component.reject(101);
    tick();

    expect(mockAdmin.rejectEmployee).not.toHaveBeenCalled();
    expect(mockToastr.warning).not.toHaveBeenCalled();
  }));
});