import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input
} from '@angular/core';
import { HlmProgressImports } from '@spartan/components/progress';

@Component({
  selector: 'app-onboarding-stepper',
  templateUrl: './onboarding-stepper.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [...HlmProgressImports]
})
export class OnboardingStepperComponent {
  readonly currentStep = input.required<number>();
  readonly totalSteps = input.required<number>();
  readonly stepLabel = input.required<string>();

  readonly progressPercent = computed(() =>
    Math.round((this.currentStep() / this.totalSteps()) * 100)
  );
}
