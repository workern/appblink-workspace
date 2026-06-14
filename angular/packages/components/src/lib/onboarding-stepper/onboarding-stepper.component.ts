import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input
} from '@angular/core';
import { HlmProgressImports } from '@spartan/components/progress';
import { HlmButton } from '@spartan/components/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmIcon } from '@spartan/components/icon';
import { lucideLogOut } from '@ng-icons/lucide';
import { AuthService } from '@workern/services';

@Component({
  selector: 'app-onboarding-stepper',
  templateUrl: './onboarding-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HlmProgressImports, HlmButton, NgIcon, HlmIcon],
  viewProviders: [provideIcons({ lucideLogOut })]
})
export class OnboardingStepperComponent {
  private readonly authService = inject(AuthService);

  readonly currentStep = input.required<number>();
  readonly totalSteps = input.required<number>();
  readonly stepLabel = input.required<string>();

  readonly progressPercent = computed(() =>
    Math.round((this.currentStep() / this.totalSteps()) * 100)
  );

  async logout(): Promise<void> {
    await this.authService.logout();
  }
}
