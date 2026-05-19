import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ConfigService } from '../services/config.service';

/**
 * Functional interceptor that attaches the JWT access token to the Authorization header
 * only for outgoing requests destined for our backend API origin.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const config = inject(ConfigService);
  const token = localStorage.getItem('access_token');

  // Ensure token is only attached to requests targeting our backend API
  if (token && req.url.startsWith(config.apiUrl)) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};

