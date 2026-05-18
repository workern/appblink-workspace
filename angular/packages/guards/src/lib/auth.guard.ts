import { inject, Injector, PLATFORM_ID } from '@angular/core';
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
  const injector = inject(Injector);

  // If we're on the server, always allow navigation (will be checked on client)
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const loginRedirect = router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url }
  });

  await firstValueFrom(
    toObservable(authService.authInitialized, { injector }).pipe(
      filter((initialized) => initialized === true),
      take(1)
    )
  );

  return authService.isAuthenticated() ? true : loginRedirect;
};
