import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';

// Shared state for the functional interceptor to safely synchronize concurrent 401 refreshes
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Functional interceptor that:
 * 1. Attaches the JWT access token to the Authorization header only for outgoing requests destined for our backend API.
 * 2. Sets withCredentials: true globally for all backend requests to support HttpOnly refresh cookies.
 * 3. Catches 401 Unauthorized errors, locks concurrent requests, silently refreshes, and retries all queued requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(ConfigService);
  const authService = inject(AuthService);
  const token = sessionStorage.getItem('access_token');

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
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return authService.refreshToken().pipe(
            switchMap((response) => {
              isRefreshing = false;
              refreshTokenSubject.next(response.access_token);

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
              isRefreshing = false;
              refreshTokenSubject.next(null);
              
              // Session is completely dead, force clean client logout
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        } else {
          // If a token refresh is already in-flight, queue this request and wait for the new token
          return refreshTokenSubject.pipe(
            filter(t => t !== null),
            take(1),
            switchMap((newToken) => {
              const retriedRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                },
                withCredentials: true
              });
              return next(retriedRequest);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
