import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@workern/services';
import { filter, take } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  await firstValueFrom(
    toObservable(authService.authInitialized).pipe(
      filter((initialized) => initialized === true),
      take(1)
    )
  );

  // If we're on the server, always allow navigation (will be checked on client)
  if (!isPlatformBrowser(platformId)) {
    return true;
  }
  const loginRedirect = router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  // If auth is already initialized, make immediate decision
  if (authService.authInitialized()) {
    return authService.isAuthenticated() ? true : loginRedirect;
  }

  // Wait for auth initialization
  return new Promise<boolean | UrlTree>((resolve) => {
    const maxWaitTime = 10000;
    const checkInterval = 50;
    let elapsedTime = 0;

    const intervalId = setInterval(() => {
      elapsedTime += checkInterval;

      if (authService.authInitialized()) {
        clearInterval(intervalId);
        resolve(authService.isAuthenticated() ? true : loginRedirect);
        return;
      }

      if (elapsedTime >= maxWaitTime) {
        clearInterval(intervalId);
        resolve(loginRedirect);
      }
    }, checkInterval);
  });
};
