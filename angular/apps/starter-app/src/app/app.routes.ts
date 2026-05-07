import { Routes } from '@angular/router';
// import { authGuard } from '@workern/guards';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(
        (m) => m.LandingComponent
      )
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@workern/components').then((m) => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    // canActivate: [authGuard]
  },
  {
    path: 'billing',
    loadComponent: () =>
      import('@workern/components').then((m) => m.BillingPageComponent),
    // canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
