import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, startWith, combineLatest } from 'rxjs';
import { where, orderBy } from '@angular/fire/firestore';

import {
  CommunicationSubscriber,
  CommunicationSubscriberSource,
  APPID
} from '@workern/models';
import {
  AuthService,
  FirestoreService,
  FirebaseFunctionsService
} from '@workern/services';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUsers,
  lucideCheckCircle,
  lucideCircle,
  lucideMail,
  lucidePhone,
  lucideShoppingBag,
  lucideBellRing,
  lucideFilter,
  lucideInfo
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan/components/badge';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmSkeletonImports } from '@spartan/components/skeleton';
import { HlmSeparatorImports } from '@spartan/components/separator';
import { HlmSwitchImports } from '@spartan/components/switch';
import { HlmIconImports } from '@spartan/components/icon';

@Component({
  selector: 'workern-subscribers',
  standalone: true,
  imports: [
    NgIcon,
    HlmBadgeImports,
    HlmButtonImports,
    HlmSkeletonImports,
    HlmSeparatorImports,
    HlmSwitchImports,
    ...HlmIconImports
  ],
  viewProviders: [
    provideIcons({
      lucideUsers,
      lucideCheckCircle,
      lucideCircle,
      lucideMail,
      lucidePhone,
      lucideShoppingBag,
      lucideBellRing,
      lucideFilter,
      lucideInfo
    })
  ],
  templateUrl: './subscribers.component.html',
  styleUrl: './subscribers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscribersComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);

  /** App ID of the shop-manager app (allows reuse in future apps). */
  readonly appId = input<string>(APPID.NIKAT_SHOP_MANAGER);

  /** The workspace (shop) ID whose subscribers to display. */
  readonly shopId = input.required<string>();

  protected readonly consentOnly = signal(false);
  protected readonly isLoading = signal(true);

  private readonly allSubscribers = toSignal(
    toObservable(this.shopId).pipe(
      switchMap((shopId) =>
        this.firestoreService
          .getCollection<CommunicationSubscriber>(
            `apps/${this.appId()}/workspaces/${shopId}/subscribers`,
            orderBy('lastInteractionAt', 'desc')
          )
          .pipe(startWith([]))
      )
    ),
    { initialValue: [] as CommunicationSubscriber[] }
  );

  protected readonly subscribers = computed(() => {
    const all = this.allSubscribers();
    return this.consentOnly() ? all.filter((s) => s.consentGiven) : all;
  });

  protected readonly totalCount = computed(() => this.allSubscribers().length);
  protected readonly consentedCount = computed(
    () => this.allSubscribers().filter((s) => s.consentGiven).length
  );

  ngOnInit(): void {
    // Once data arrives, stop loading
    toObservable(this.allSubscribers).subscribe(() =>
      this.isLoading.set(false)
    );
  }

  protected toggleConsentFilter(value: boolean): void {
    this.consentOnly.set(value);
  }

  protected getInitials(name: string): string {
    const parts = (name ?? '').trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.length > 0 ? name[0].toUpperCase() : '?';
  }

  protected isExplicit(source: CommunicationSubscriberSource): boolean {
    return source === CommunicationSubscriberSource.EXPLICIT;
  }

  protected readonly CommunicationSubscriberSource =
    CommunicationSubscriberSource;
}
