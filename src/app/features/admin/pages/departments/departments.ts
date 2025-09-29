import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../environment/environment';
import { Department } from '../../../../core/models/dept.model';
import { SearchPipe } from '../../../../core/pipes/search-pipe';
import { Admin } from '../../../../core/services/admin.service';
import { Dept } from '../../../../core/services/dept.service';
import { ErrorHandler } from '../../../../core/services/error-handler';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import { ConfirmationDialogComponent, ConfirmationDialogData } from './confirmation-dialog/confirmation-dialog';
import { forkJoin } from 'rxjs';
import { DepartmentDialog } from './department-dialog/department-dialog';
interface DepartmentWithCount extends Department {
  employeeCount?: number;
  imagePath?: string;
}
@Component({
  selector: 'app-departments',
  imports: [...UI_IMPORTS,SearchPipe],
  templateUrl: './departments.html',
  styleUrl: './departments.scss'
})
export class Departments {
  private depts = inject(Dept);
  private admin = inject(Admin);
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private errorHandler = inject(ErrorHandler);

  rows: DepartmentWithCount[] = [];
  searchText: string = '';
  loading = false;

  ngOnInit() {
    this.load();
  }

  private enrichDepartments(depts: Department[], counts: any[]): DepartmentWithCount[] {
    return depts.map(d => {
      const match = counts.find(c => c.departmentId === d.departmentId);
      return {
        ...d,
        employeeCount: match?.employeeCount ?? 0,
        imagePath: d.imagePath
          ? `${environment.apiUrl.replace('/api', '')}${d.imagePath}`
          : undefined
      };
    });
  }

  load() {
    this.loading = true;
    forkJoin({
      depts: this.depts.list(),
      counts: this.admin.getDepartmentCounts()
    }).subscribe({
      next: ({ depts, counts })=> {
        this.rows = this.enrichDepartments(depts, counts);
        const alo=console.log(this.rows);
        this.loading = false;
      },
      error: err => {
        this.showToast('Failed to load departments', 'error');
        this.loading = false;
      }
    });
  }
  

  openDialog(editing?: DepartmentWithCount) {
    const dialogRef = this.dialog.open(DepartmentDialog, {
      width: '500px',
      data: editing ? { ...editing } : null
    });

    dialogRef.afterClosed().subscribe((result: FormData) => {
      if (result) {

        const request = editing
          ? this.depts.update(editing.departmentId, result)
          : this.depts.create(result);

        request.subscribe({
          next: () => {
            this.showToast(
              `Department ${editing ? 'updated' : 'added'} successfully`,
              'success'
            );
            this.load();
          },
          error: (err) => {
            this.errorHandler.handleError(err, 'Login failed');
            
          }
        });
      }
    });
  }

  remove(id: number, departmentName: string = 'this department') {
    const dialogData: ConfirmationDialogData = {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete "${departmentName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.depts.delete(id).subscribe({
          next: () => {
            this.showToast('Department deleted successfully', 'success');
            this.load();
          },
          error: (error) => {
            console.error('Delete Error:', error);
            let errorMessage = 'Failed to delete department';
            
            if (error.error && error.error.message) {
              errorMessage += ': ' + error.error.message;
            } else if (error.message) {
              errorMessage += ': ' + error.message;
            }
            
            this.showToast(errorMessage, 'error');
          }
        });
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' | 'warning') {
    const options = { timeOut: 3000, closeButton: true, progressBar: true };
    switch (type) {
      case 'success':
        this.toastr.success(message, 'Success', options);
        break;
      case 'error':
        this.toastr.error(message, 'Error', options);
        break;
      case 'info':
        this.toastr.info(message, 'Info', options);
        break;
      case 'warning':
        this.toastr.warning(message, 'Warning', options);
        break;
    }
  }
}