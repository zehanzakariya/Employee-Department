
import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorHandler } from '../services/error-handler';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandler);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handling error using ErrorHandler service
      errorHandler.handleError(error, 'An unexpected error occurred');
      
      // Re-throwing  the error so if needed we can send again
      return throwError(() => error);
    })
  );
};