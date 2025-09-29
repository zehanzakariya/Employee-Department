import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';

export interface ApiError {
  success?: boolean;
  message?: string;
  details?: string;
  statusCode?: number;
  errors?: { [key: string]: string[] };
  traceId?: string;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandler {
  private snackbar = inject(MatSnackBar);
  private toastr = inject(ToastrService);

  handleError(error: any, defaultMessage: string = 'An error occurred'): void {
    console.error('Error handled:', error);
    
    let errorMessage = defaultMessage;
    let duration = 5000;

    if (error instanceof HttpErrorResponse) {
      // Handling HTTP errors
      errorMessage = this.getHttpErrorMessage(error, defaultMessage);
      
      if (error.status >= 500) {
        duration = 7000;
        this.toastr.error(errorMessage, 'Server Error', { timeOut: duration });
      } else if (error.status === 400) {
        this.handleValidationErrors(error);
        return;
      } else {
        this.toastr.error(errorMessage, 'Error', { timeOut: duration });
      }
    } else if (error.error instanceof ErrorEvent) {
      // Client-side error
      this.toastr.error(`Client error: ${error.error.message}`, 'Error', { timeOut: duration });
    } else if (typeof error === 'string') {
      // string error
      this.toastr.error(error, 'Error', { timeOut: duration });
    } else if (error?.message) {
      // Error object with message
      this.toastr.error(error.message, 'Error', { timeOut: duration });
    } else {
      this.toastr.error(errorMessage, 'Error', { timeOut: duration });
    }
  }

  private getHttpErrorMessage(error: HttpErrorResponse, defaultMessage: string): string {
    const status = error.status;
    const errorBody = error.error as ApiError;

    console.log('Error response from backend:', errorBody);

    //  specific status codes with added manual messages
    switch (status) {
      case 0:
        return 'Network error: Please check your internet connection';
      case 400:
        return this.getBadRequestMessage(errorBody) || 'Bad request: Please check your input data';
      case 401:
        return errorBody?.message || 'Unauthorized: Please login again';
      case 403:
        return errorBody?.message || 'Forbidden: You don\'t have permission to perform this action';
      case 404:
        return errorBody?.message || 'Not found: The requested resource was not found';
      case 409:
        return errorBody?.message || 'Conflict: This action would create a conflict';
      case 429:
        return errorBody?.message || 'Too many requests: Please try again later';
      case 500:
        return errorBody?.message || 'Server error: Please try again later';
      case 503:
        return errorBody?.message || 'Service unavailable: The server is temporarily unavailable';
      default:
        return errorBody?.message || defaultMessage;
    }
  }

  /**
   *  400 Bad Request errors 
   */
  private getBadRequestMessage(errorBody: ApiError): string | null {
    if (errorBody?.errors && Object.keys(errorBody.errors).length > 0) {
      return this.getValidationErrorMessage(errorBody);
    }
    
    // custom message from backend
    if (errorBody?.message) {
      return errorBody.message;
    }
    
    if (errorBody?.details) {
      return errorBody.details;
    }
    
    return null;
  }

  /**
   * Formatting validation errors from the API
   */
  private getValidationErrorMessage(errorBody: ApiError): string {
    if (!errorBody?.errors) return 'Validation error: Please check your input';

    const errors = errorBody.errors;
    const errorMessages = Object.keys(errors)
      .map(key => {
        const fieldErrors = errors[key].join(', ');
        return `• ${this.formatFieldName(key)}: ${fieldErrors}`;
      })
      .join('\n');

    return `Validation errors:\n${errorMessages}`;
  }

  /**
   * Formatting field names
   */
  private formatFieldName(fieldName: string): string {
    // Converting camelCase to Title Case with spaces
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   *  FluentValidation errors
   */
  private handleValidationErrors(error: HttpErrorResponse): void {
    const errorBody = error.error as ApiError;

    if (errorBody?.errors && Object.keys(errorBody.errors).length > 0) {
      Object.keys(errorBody.errors).forEach(key => {
        const fieldErrors = errorBody.errors![key];
        fieldErrors.forEach(errorMsg => {
          this.toastr.error(`${this.formatFieldName(key)}: ${errorMsg}`, 'Validation Error', {
            timeOut: 6000,
            closeButton: true,
            progressBar: true
          });
        });
      });
    } else if (errorBody?.message) {
      this.toastr.error(errorBody.message, 'Validation Error', {
        timeOut: 5000,
        closeButton: true,
        progressBar: true
      });
    } else {
      this.toastr.error('Please check your input data', 'Validation Error', {
        timeOut: 5000,
        closeButton: true,
        progressBar: true
      });
    }
  }


  showSuccess(message: string, title: string = 'Success', duration: number = 3000): void {
    this.toastr.success(message, title, {
      timeOut: duration,
      closeButton: true,
      progressBar: true
    });
  }

  showWarning(message: string, title: string = 'Warning', duration: number = 4000): void {
    this.toastr.warning(message, title, {
      timeOut: duration,
      closeButton: true,
      progressBar: true
    });
  }


  showInfo(message: string, title: string = 'Info', duration: number = 3000): void {
    this.toastr.info(message, title, {
      timeOut: duration,
      closeButton: true,
      progressBar: true
    });
  }

  /**
   *  detailed error information for debugging
   */
  getErrorDetails(error: any): string {
    if (error instanceof HttpErrorResponse) {
      const errorBody = error.error as ApiError;
      return JSON.stringify({
        status: error.status,
        message: errorBody?.message,
        details: errorBody?.details,
        errors: errorBody?.errors,
        traceId: errorBody?.traceId,
        url: error.url
      }, null, 2);
    }
    return JSON.stringify(error, null, 2);
  }


  private showSnackbar(message: string, duration: number, panelClass: string): void {
    // Limiting message length to prevent  long snackbars
    const maxLength = 200;
    const displayMessage = message.length > maxLength 
      ? message.substring(0, maxLength) + '...' 
      : message;

    this.snackbar.open(displayMessage, 'Close', {
      duration,
      panelClass: [panelClass],
      verticalPosition: 'top',
      horizontalPosition: 'center'
    });
  }
}