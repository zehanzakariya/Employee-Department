import { HttpClient } from '@angular/common/http';
import { Component, inject, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environment/environment';
import { ErrorHandler } from '../../../../core/services/error-handler';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
interface Document {
  name: string;
  path: string;
}

interface DialogData {
  employeeName: string;
  documents: Document[];
}
@Component({
  selector: 'app-document-viewer-dialog',
  imports: [UI_IMPORTS],
  templateUrl: './document-viewer-dialog.html',
  styleUrl: './document-viewer-dialog.scss'
})
export class DocumentViewerDialog {
  apiUrl = environment.assetsUrl;
  loading = false;
  private errorHandler = inject(ErrorHandler)

  constructor(
    public dialogRef: MatDialogRef<DocumentViewerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  getFullDocumentPath(path: string): string {
    if (!path) return '';
    // Removing any leading slashes to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${this.apiUrl}/${cleanPath}`;
  }

  isImageFile(path: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some(ext => path.toLowerCase().endsWith(ext));
  }

  isPdfFile(path: string): boolean {
    return path.toLowerCase().endsWith('.pdf');
  }

  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.style.display = 'none';
    
    const container = imgElement.parentElement;
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'image-error';
      errorDiv.innerHTML = `
        <mat-icon>broken_image</mat-icon>
        <p>Unable to load image</p>
      `;
      container.appendChild(errorDiv);
    }
  }

  downloadDocument(path: string, name: string) {
    if (!path) {
      this.snackBar.open('No document available to download', 'Close', { duration: 3000 });
      return;
    }

    this.loading = true;
    const fullPath = this.getFullDocumentPath(path);
    
    //HTTP request to handle authentication and CORS issues
    this.http.get(fullPath, { responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        // Creating a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Creating download link
        const link = document.createElement('a');
        link.href = blobUrl;
        
        // Extracting filename from path or using the document name
        const filename = this.extractFilenameFromPath(path) || `${name.replace(/\s+/g, '_')}.pdf`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(blobUrl);
        this.loading = false;
        
        this.snackBar.open(`Downloading ${name}`, 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.errorHandler.handleError(err, 'downloading failed');
        this.loading = false;
        // Fallback to direct link when HTTP request fails
        this.downloadWithDirectLink(fullPath, name);
      }
    });
  }

  private extractFilenameFromPath(path: string): string {
    try {
      return path.substring(path.lastIndexOf('/') + 1);
    } catch (e) {
      return '';
    }
  }

  private downloadWithDirectLink(fullPath: string, name: string) {
    const link = document.createElement('a');
    link.href = fullPath;
    link.download = `${name.replace(/\s+/g, '_')}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.snackBar.open(`Downloading ${name}`, 'Close', { duration: 2000 });
  }

  close(): void {
    this.dialogRef.close();
  }
}