import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClaimsService } from '@workern/services';
import { SnackbarService } from '@workern/services';

export const claimsGuard: CanActivateFn = (route, state) => {
  const claimsService = inject(ClaimsService);
  const router = inject(Router);
  const snackbarService = inject(SnackbarService);

  const requiredClaims = route.data['requiredClaims'] as string[] | undefined;

  if (!requiredClaims || requiredClaims.length === 0) {
    return true; // No specific claims required
  }

  if (claimsService.hasAllClaims(requiredClaims)) {
    return true;
  }

  snackbarService.error("You don't have permission to access this page.");
  router.navigate(['/']); // Redirect to a safe default route
  return false;
};
