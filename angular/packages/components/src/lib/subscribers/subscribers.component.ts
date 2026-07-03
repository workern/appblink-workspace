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
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  CommunicationSubscriber,
  CommunicationSubscriberSource,
  APPID
} from '@workern/models';
import {
  AuthService,
  FirestoreService,
  FirebaseFunctionsService,
  SnackbarService
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
  lucideInfo,
  lucideTag,
  lucidePlus,
  lucideX,
  lucideTrash
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan/components/badge';
import { HlmButtonImports } from '@spartan/components/button';
import { HlmSkeletonImports } from '@spartan/components/skeleton';
import { HlmSeparatorImports } from '@spartan/components/separator';
import { HlmSwitchImports } from '@spartan/components/switch';
import { HlmIconImports } from '@spartan/components/icon';
import { HlmDialogImports } from '@spartan/components/dialog';
import { HlmInputImports } from '@spartan/components/input';

@Component({
  selector: 'workern-subscribers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIcon,
    HlmBadgeImports,
    HlmButtonImports,
    HlmSkeletonImports,
    HlmSeparatorImports,
    HlmSwitchImports,
    ...HlmIconImports,
    ...HlmDialogImports,
    ...HlmInputImports
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
      lucideInfo,
      lucideTag,
      lucidePlus,
      lucideX,
      lucideTrash
    })
  ],
  templateUrl: './subscribers.component.html',
  styleUrl: './subscribers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscribersComponent implements OnInit {
  private firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private functions = inject(FirebaseFunctionsService);

  /** App ID of the shop-manager app (allows reuse in future apps). */
  readonly appId = input<string>(APPID.NIKAT_SHOP_MANAGER);

  /** The workspace (shop) ID whose subscribers to display. */
  readonly shopId = input.required<string>();

  protected readonly consentOnly = signal(false);
  protected readonly isLoading = signal(true);

  // Add Subscriber dialog state
  protected readonly showAddSubscriberDialog = signal(false);
  protected readonly isAddingSubscriber = signal(false);
  protected newSubscriberName = '';
  protected newSubscriberPhone = '';
  protected newSubscriberEmail = '';
  protected newSubscriberConsent = false;

  // Tag editing dialog state
  protected readonly showEditTagsDialog = signal(false);
  protected readonly selectedSubscriber = signal<CommunicationSubscriber | null>(null);
  protected readonly editTagsList = signal<string[]>([]);
  protected newTagInput = '';
  protected readonly isSaving = signal(false);

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

  protected openEditTagsDialog(sub: CommunicationSubscriber): void {
    this.selectedSubscriber.set(sub);
    this.editTagsList.set(sub.tags ? [...sub.tags] : []);
    this.newTagInput = '';
    this.showEditTagsDialog.set(true);
  }

  protected closeEditTagsDialog(): void {
    this.showEditTagsDialog.set(false);
    this.selectedSubscriber.set(null);
  }

  protected addTagToEdit(): void {
    const tag = this.newTagInput.trim();
    if (!tag) return;
    const normalized = tag.length > 30 ? tag.substring(0, 30) : tag;
    if (this.editTagsList().includes(normalized)) {
      this.newTagInput = '';
      return;
    }
    this.editTagsList.update(tags => [...tags, normalized]);
    this.newTagInput = '';
  }

  protected removeTagFromEdit(tagToRemove: string): void {
    this.editTagsList.update(tags => tags.filter(t => t !== tagToRemove));
  }

  protected async saveEditedTags(): Promise<void> {
    const sub = this.selectedSubscriber();
    if (!sub) return;
    this.isSaving.set(true);
    try {
      const path = `apps/${this.appId()}/workspaces/${this.shopId()}/subscribers/${sub.id}`;
      await this.firestoreService.updateDoc(path, {
        tags: this.editTagsList()
      });
      this.snackbar.show('Subscriber tags updated successfully.');
      this.closeEditTagsDialog();
    } catch (e) {
      this.snackbar.show(`Failed to save tags: ${e}`);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected readonly CommunicationSubscriberSource =
    CommunicationSubscriberSource;

  protected openAddSubscriberDialog(): void {
    this.newSubscriberName = '';
    this.newSubscriberPhone = '';
    this.newSubscriberEmail = '';
    this.newSubscriberConsent = false;
    this.showAddSubscriberDialog.set(true);
  }

  protected closeAddSubscriberDialog(): void {
    this.showAddSubscriberDialog.set(false);
  }

  protected async addSubscriber(): Promise<void> {
    const name = this.newSubscriberName.trim();
    const phone = this.newSubscriberPhone.trim();
    const email = this.newSubscriberEmail.trim();
    if (!name || !phone) return;

    this.isAddingSubscriber.set(true);
    try {
      await this.functions.firebaseCall('nsm-subscriber-addmanual', {
        shopId: this.shopId(),
        displayName: name,
        phone,
        email: email || undefined,
        consentGiven: this.newSubscriberConsent
      });
      this.snackbar.show('Subscriber added manually successfully.');
      this.closeAddSubscriberDialog();
    } catch (e) {
      this.snackbar.show(`Failed to add subscriber: ${e}`);
    } finally {
      this.isAddingSubscriber.set(false);
    }
  }

  protected async deleteSubscriber(sub: CommunicationSubscriber): Promise<void> {
    if (confirm(`Are you sure you want to completely remove ${sub.displayName} from your subscribers?`)) {
      try {
        await this.functions.firebaseCall('nsm-subscriber-remove', {
          shopId: this.shopId(),
          subscriberId: sub.id
        });
        this.snackbar.show('Subscriber removed successfully.');
      } catch (e) {
        this.snackbar.show(`Failed to remove subscriber: ${e}`);
      }
    }
  }
}
