import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const toast = inject(ToastService);

  const esAuthPublica =
    req.url.includes('/auth/login') || req.url.includes('/auth/register');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        toast.error('No hay conexion con el servidor. Verifica tu internet.');
      } else if (error.status === 401 && !esAuthPublica && auth.isLoggedIn()) {
        toast.warning('Tu sesion expiro. Inicia sesion de nuevo.');
        auth.logout('/auth/login');
      } else if (error.status >= 500) {
        toast.error('Error en el servidor. Intenta de nuevo.');
      }
      return throwError(() => error);
    })
  );
};
