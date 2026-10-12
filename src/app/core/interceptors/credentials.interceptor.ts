import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Asegura que la cookie HttpOnly 'access_token' viaje automáticamente con cada petición CORS
  const cloned = req.clone({
    withCredentials: true,
    setHeaders: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  return next(cloned);
};