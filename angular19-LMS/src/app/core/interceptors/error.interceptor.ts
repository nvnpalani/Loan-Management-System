import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized error - clear auth state and redirect to login
        authService.logout();
        router.navigate(['/login']);
      }
      
      // Optionally handle other status codes like 403, 404, 500 here
      console.error('HTTP Error occurred:', error);
      
      // Pass the error to the caller
      return throwError(() => error);
    })
  );
};
