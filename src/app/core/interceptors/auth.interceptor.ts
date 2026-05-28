import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';

/**
 * Functional interceptor that:
 * 1. Attaches the JWT access token to the Authorization header only for outgoing requests destined for our backend API.
 * 2. Sets withCredentials: true globally for all backend requests to support HttpOnly refresh cookies.
 * 3. Catches 401 Unauthorized errors and silently tries to refresh the token, retrying the original request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(ConfigService);
  const authService = inject(AuthService);
  const token = localStorage.getItem('access_token');

  let cloned = req;

  // Ensure token & withCredentials are only attached to requests targeting our backend API
  if (req.url.startsWith(config.apiUrl)) {
    const headers: { [name: string]: string } = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    cloned = req.clone({
      setHeaders: headers,
      withCredentials: true
    });
  }

  return next(cloned).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        req.url.startsWith(config.apiUrl) &&
        !req.url.includes('/auth/login') &&
        !req.url.includes('/auth/refresh-token')
      ) {
        // Trigger silent refresh, exchange the HttpOnly cookie for a new access token
        return authService.refreshToken().pipe(
          switchMap((response) => {
            // Re-clone original request with the new rotated access token and retry!
            const retriedRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.access_token}`
              },
              withCredentials: true
            });
            return next(retriedRequest);
          }),
          catchError((refreshError) => {
            // Session is completely dead, force clean client logout
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

