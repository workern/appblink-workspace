import { inject, Injector, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@workern/services';
import { filter, take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';

/**
 * Inverse of authGuard — for routes that should only be visible to
 * unauthenticated users (landing page, login, register).
 *
 * If the user is already authenticated, they are redirected to /dashboard.
 * This matches the industry-standard SaaS pattern: authenticated users who
 * land on "/" or "/login" (via refresh, back button, shared link, etc.)
 * skip the marketing surface and go straight to their app.
 */
export const publicGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const injector = inject(Injector);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  // Wait for Firebase auth to settle before deciding — same pattern as authGuard
  await firstValueFrom(
    toObservable(authService.authInitialized, { injector }).pipe(
      filter((initialized) => initialized === true),
      take(1)
    )
  );

  return authService.isAuthenticated()
    ? router.createUrlTree(['/dashboard'])
    : true;
};
