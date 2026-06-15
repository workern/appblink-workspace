import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@workern/services';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink]
})
export class HomeComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUser;

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }
}
