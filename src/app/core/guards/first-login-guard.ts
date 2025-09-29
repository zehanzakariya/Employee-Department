import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth.service';

export const firstLoginGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  //redirecting to profile completion
  if (state.url.includes('/employee/complete-profile')) {
    return true;
  }

  // Redirecting to complete-profile if employee profile is incomplete
  if (auth.user?.role === 'Employee' && !auth.profileComplete) {
    router.navigate(['/employee/complete-profile']);
    return false;
  }

  return true;
};