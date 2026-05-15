import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Functional interceptor that attaches the JWT access token to the Authorization header
 * for all outgoing HTTP requests.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
