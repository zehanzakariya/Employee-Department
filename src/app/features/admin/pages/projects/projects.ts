import { Component, inject} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Project } from '../../../../core/models/project.model';
import { ErrorHandler } from '../../../../core/services/error-handler';
import { projectService } from '../../../../core/services/project.service';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../departments/confirmation-dialog/confirmation-dialog';
import { ProjectDialog } from './project-dialog/project-dialog';

@Component({
  selector: 'app-projects',
  imports: [...UI_IMPORTS],
  templateUrl: './projects.html',
  styleUrl: './projects.scss'
})
export class Projects {
  private projectService = inject(projectService);
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private errorHandler = inject(ErrorHandler);


  projects: Project[] = [];
  loading = false;

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.projectService.getAll().subscribe({
      next: (projects) => {
        this.projects = projects;
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'Deleted failed');
      },
      complete: () => this.loading = false
    });
  }

  openDialog(project?: Project) {
    const dialogRef = this.dialog.open(ProjectDialog, {
      width: '600px',
      data: project ? { ...project } : null
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadProjects();
      }
    });
  }

  deleteProject(id: number, projectName: string = 'this project') {
    const dialogData: ConfirmationDialogData = {
      title: 'Confirm Deletion',
      message: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.executeDelete(id);
      }
    });
  }

  private executeDelete(id: number) {
    this.projectService.delete(id).subscribe({
      next: () => {
        this.toastr.success('Project deleted successfully', 'Success');
        this.loadProjects();
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'Deleted failed');

      }
    });
  }
}