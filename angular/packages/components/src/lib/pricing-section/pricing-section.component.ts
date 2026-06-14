import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmIconImports } from '@spartan/components/icon';
import { HlmBadge } from '@spartan/components/badge';
import { HlmButton } from '@spartan/components/button';
import { HlmCardImports } from '@spartan/components/card';

export interface PricingPlanCta {
  label: string;
  href?: string;
  routerLink?: string;
  variant?: 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary';
  class?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  subNote?: string;
  description: string;
  features: string[];
  cta: PricingPlanCta;
  popular?: boolean;
  popularLabel?: string;
  cardClass?: string;
  nameClass?: string;
  featureCheckClass?: string;
}

export interface PricingSectionConfig {
  sectionId?: string;
  badgeLabel?: string;
  badgeClass?: string;
  title: string;
  subtitle?: string;
  footerNote?: string;
  plans: PricingPlan[];
  gridClass?: string;
}

@Component({
  selector: 'wn-pricing-section',
  standalone: true,
  templateUrl: './pricing-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideCheck })],
  imports: [
    RouterLink,
    NgIcon,
    ...HlmIconImports,
    HlmBadge,
    HlmButton,
    ...HlmCardImports
  ]
})
export class PricingSectionComponent {
  readonly config = input.required<PricingSectionConfig>();
}
