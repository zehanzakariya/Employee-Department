import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';
import { Admin } from '../../../../core/services/admin.service';
import { Dept } from '../../../../core/services/dept.service';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import { RejectionDialog } from '../rejection-dialog/rejection-dialog';

interface PendingEmployee {
  userProfileId: number; 
  fullName: string;
  email: string;
  gender: string;
  age: number;
  departmentId: number;
  userStatusId: number;
  userStatus: string | null;
  rejectionReason: string | null;
  departmentName?: string; 
}

@Component({
  selector: 'app-employees',
  imports: [...UI_IMPORTS, MatDialogModule,
    MatFormFieldModule,
    MatInputModule,],
  templateUrl: './employees.html',
  styleUrl: './employees.scss'
})
export class Employees {
  private admin = inject(Admin);
  private deptService = inject(Dept);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog);

  rows: PendingEmployee[] = [];
  departments: any[] = [];
  displayedColumns = ['name', 'email', 'gender', 'age', 'department', 'actions'];

  ngOnInit() {
    this.loadDepartmentsAndPendingEmployees();
  }

  loadDepartmentsAndPendingEmployees() {
    this.deptService.list().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.loadPendingEmployees();
      },
      error: () => this.toastr.error(
        'Failed to load departments',
        'Error',
        { timeOut: 3000, closeButton: true, progressBar: true }
      )
    });
  }

  loadPendingEmployees() {
    this.admin.pendingEmployees().subscribe({
      next: (users: any[]) => {
        console.log('API Response:', users); 
        
        if (Array.isArray(users)) {
          this.rows = users.map((employee: any) => ({
            ...employee,
            departmentName: this.getDepartmentName(employee.departmentId)
          }));
          console.log('Processed rows:', this.rows);
        } else {
          console.warn('Unexpected response format:', users);
          this.rows = [];
        }
      },
      error: (error) => {
        console.error('Error loading pending employees:', error);
        this.toastr.error(
          'Failed to load pending employees',
          'Error',
          { timeOut: 3000, closeButton: true, progressBar: true }
        );
        this.rows = [];
      }
    });
  }
  getDepartmentName(departmentId: number): string {
    const department = this.departments.find(dept => dept.departmentId === departmentId);
    return department ? department.departmentName : 'Not assigned';
  }

  /** 🔹 Approve employee */
  approve(id: number) {
    console.log('Approving employee with ID:', id);
    this.admin.approveEmployee(id).subscribe({
      next: () => {
        this.toastr.success(
          'Employee approved. Password emailed automatically.',
          'Success',
          { timeOut: 3000, closeButton: true, progressBar: true }
        );
        this.rows = this.rows.filter(r => r.userProfileId !== id);
      },
      error: (error) => {
        console.error('Error approving employee:', error);
        this.toastr.error(
          'Approval failed',
          'Error',
          { timeOut: 3000, closeButton: true, progressBar: true }
        );
      }
    });
  }

  reject(id: number) {
    console.log('Rejecting employee with ID:', id);
    const dialogRef = this.dialog.open(RejectionDialog, {
      width: '400px',
      data: { userProfileId: id }
    });

    dialogRef.afterClosed().subscribe((reason: string | null) => {
      if (reason) {
        this.admin.rejectEmployee(id, reason).subscribe({
          next: () => {
            this.toastr.warning(
              'Employee rejected',
              'Warning',
              { timeOut: 3000, closeButton: true, progressBar: true }
            );
            this.rows = this.rows.filter(r => r.userProfileId !== id);
          },
          error: (error) => {
            console.error('Error rejecting employee:', error);
            this.toastr.error(
              'Rejection failed',
              'Error',
              { timeOut: 3000, closeButton: true, progressBar: true }
            );
          }
        });
      }
    });
  }
}