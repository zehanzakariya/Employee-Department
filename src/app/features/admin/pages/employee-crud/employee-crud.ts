import { Component, inject, ViewChild } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ToastrService } from 'ngx-toastr';
import { EmployeeReadDto } from '../../../../core/models/employee.model';
import { Employee } from '../../../../core/services/employee.service';
import { ErrorHandler } from '../../../../core/services/error-handler';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import { ConfirmDialog, StatusChangeData } from '../confirm/confirm';
import { DocumentViewerDialog } from '../document-viewer-dialog/document-viewer-dialog';
import { EmployeeDialog } from '../employee-dialog/employee-dialog';

@Component({
  selector: 'app-employee-crud',
  imports: [...UI_IMPORTS,MatButtonToggleModule],
  templateUrl: './employee-crud.html',
  styleUrl: './employee-crud.scss'
})
export class EmployeeCrud {
  private employeeService = inject(Employee);
  private dialog = inject(MatDialog);
  private errorHandler = inject(ErrorHandler);
  private toastr = inject(ToastrService); 

  displayedColumns = ['fullName', 'email', 'departmentName', 'profileStatus', 'status', 'documents', 'actions'];
  dataSource = new MatTableDataSource<EmployeeReadDto>([]);
  loading = false;

  searchValue = '';
  viewMode: 'active' | 'inactive' | 'all' = 'all';
  totalCount = 0;
  currentPage = 1;
  pageSize = 10;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    
    const includeInactive = this.viewMode === 'all' || this.viewMode === 'inactive';
    
    this.employeeService.getPaged(this.searchValue, this.currentPage, this.pageSize, includeInactive).subscribe({
      next: (res: any) => {
        this.dataSource.data = res.data;
        this.totalCount = res.totalCount;
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'failed');
        this.loading = false;
      },
      complete: () => (this.loading = false)
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadEmployees();
  }

  onViewModeChange(event: any) {
    this.viewMode = event.value;
    this.currentPage = 1;
    this.loadEmployees();
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadEmployees();
  }

  openDialog(employee?: EmployeeReadDto) {
    const dialogRef = this.dialog.open(EmployeeDialog, {
      width: '600px',
      data: employee ? { ...employee } : null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadEmployees();
      }
    });
  }

  getDocumentCount(employee: EmployeeReadDto): number {
    const documents = [
      employee.degreeCertificatePath,
      employee.plusTwoCertificatePath,
      employee.sslCertificatePath,
      employee.experienceCertificatePath,
      employee.passportPath,
      employee.aadharPath
    ];
    return documents.filter(doc => doc !== null && doc !== '').length;
  }

  viewDocuments(employee: EmployeeReadDto) {
    const documents = [
      { name: 'Degree Certificate', path: employee.degreeCertificatePath },
      { name: '+2 Certificate', path: employee.plusTwoCertificatePath },
      { name: 'SSLC Certificate', path: employee.sslCertificatePath },
      { name: 'Experience Certificate', path: employee.experienceCertificatePath },
      { name: 'Passport', path: employee.passportPath },
      { name: 'Aadhar', path: employee.aadharPath }
    ].filter(doc => doc.path);

    if (documents.length === 0) {
      this.toastr.warning('No documents available for this employee', 'No Documents', {
        timeOut: 3000,
        closeButton: true,
        progressBar: true
      });
      return;
    }

    this.dialog.open(DocumentViewerDialog, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      data: {
        employeeName: employee.fullName,
        documents: documents
      }
    });
  }

  viewDepartmentDocuments(employee: EmployeeReadDto) {
    this.viewDocuments(employee);
  }

  activateEmployee(employee: EmployeeReadDto) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '500px',
      data: {
        employee: employee,
        isActivating: true
      } as StatusChangeData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        const index = this.dataSource.data.findIndex(emp => emp.employeeId === employee.employeeId);
        if (index !== -1) {
          this.dataSource.data[index].isActive = true;
          this.dataSource.data = [...this.dataSource.data];
        }

        this.employeeService.activate(employee.employeeId).subscribe({
          next: () => {
            this.toastr.success('Employee activated successfully', 'Success', {
              timeOut: 3000,
              closeButton: true,
              progressBar: true
            });
            this.loadEmployees();
          },
          error: (err) => {
            this.errorHandler.handleError(err, 'failed');
            if (index !== -1) {
              this.dataSource.data[index].isActive = false;
              this.dataSource.data = [...this.dataSource.data];
            }
          }
        });
      }
    });
  }
  
  deactivateEmployee(employee: EmployeeReadDto) {
    const dialogRef = this.dialog.open(ConfirmDialog, {
      width: '500px',
      data: {
        employee: employee,
        isActivating: false
      } as StatusChangeData
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirmed) {
        const index = this.dataSource.data.findIndex(emp => emp.employeeId === employee.employeeId);
        if (index !== -1) {
          this.dataSource.data[index].isActive = false;
          this.dataSource.data = [...this.dataSource.data];
        }

        this.employeeService.delete(employee.employeeId).subscribe({
          next: () => {
            this.toastr.success('Employee deactivated successfully', 'Success', {
              timeOut: 3000,
              closeButton: true,
              progressBar: true
            });
            this.loadEmployees();
          },
          error: (err) => {
            this.errorHandler.handleError(err, 'failed');
            if (index !== -1) {
              this.dataSource.data[index].isActive = true;
              this.dataSource.data = [...this.dataSource.data];
            }
          }
        });
      }
    });
  }

  getStatusCounts(): { active: number, inactive: number, total: number } {
    const active = this.dataSource.data.filter(emp => emp.isActive).length;
    const inactive = this.dataSource.data.filter(emp => !emp.isActive).length;
    const total = this.dataSource.data.length;
    
    return { active, inactive, total };
  }
}