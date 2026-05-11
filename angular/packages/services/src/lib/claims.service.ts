import { computed, inject, Injectable, resource } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { get } from 'lodash';
import { AuthService } from '@workern/services';
@Injectable({
  providedIn: 'root'
})
export class ClaimsService {
  private auth = inject(Auth);
  authService = inject(AuthService);

  private idTokenResult = computed(() => this.idToken$.value());
  claims = computed(() => this.idTokenResult()?.claims || {});

  isAdmin = computed(() => !!this.claims()['admin']);

  idToken$ = resource({
    params: () => ({ user: this.authService.currentUser() }),
    loader: async ({ params, previous }) => {
      if (params.user) {
        const user = this.auth.currentUser;
        try {
          const result = await user.getIdTokenResult(true);
          return result;
        } catch (error) {
          console.error('Failed to get user claims (resource):', error);
          return null;
        }
      } else {
        return null;
      }
    }
  });

  hasClaim(claim: string): boolean {
    return this.isAdmin() || !!get(this.claims(), claim);
  }

  hasAllClaims(claims: string[]): boolean {
    return claims.every((claim) => this.hasClaim(claim));
  }
}
