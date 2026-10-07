import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) {
    return true;
  }

  if (auth.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }

  router.navigate(['/auth/login'], { queryParams: { redirect: '/admin' } });
  return false;
};