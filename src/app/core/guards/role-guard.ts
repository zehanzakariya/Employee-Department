import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from '../models/auth.model';
import { Auth } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const allowed = route.data?.['roles'] as Role[] | undefined;
  if (!auth.isLoggedIn) { router.navigate(['/landing']); return false; }
  if (!allowed || allowed.includes(auth.user!.role)) return true;
  router.navigate(['/']);
  return false;
};