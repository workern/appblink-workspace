import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  input,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FirebaseFunctionsService, FirestoreService } from '@workern/services';
import { AuthService } from '@workern/services';
import {
  WhatsAppConfig,
  WhatsAppConnectionStatus,
  APPID
} from '@workern/models';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmIcon } from '@spartan/components/icon';
import {
  lucideCheck,
  lucideX,
  lucideLoader,
  lucideRefreshCw,
  lucideUnplug,
  lucideSmartphone
} from '@ng-icons/lucide';
import { firstValueFrom } from 'rxjs';

declare const FB: any;

@Component({
  selector: 'workern-whatsapp-connect',
  imports: [CommonModule, NgIcon, HlmIcon],
  templateUrl: './whatsapp-connect.component.html',
  styleUrl: './whatsapp-connect.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [
    provideIcons({
      lucideCheck,
      lucideX,
      lucideLoader,
      lucideRefreshCw,
      lucideUnplug,
      lucideSmartphone
    })
  ]
})
export class WhatsAppConnectComponent implements OnInit {
  private fns = inject(FirebaseFunctionsService);
  private firestoreService = inject(FirestoreService);
  private auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  /** The app ID used for the Firestore path. Defaults to NIKAT. */
  readonly appId = input<APPID>(APPID.NIKAT);

  protected readonly config = signal<WhatsAppConfig | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isDisconnecting = signal(false);
  protected readonly isSdkReady = signal(false);
  protected readonly WhatsAppConnectionStatus = WhatsAppConnectionStatus;

  /** Captured from the Embedded Signup session logging message event */
  private sessionData: {
    phoneNumberId?: string;
    wabaId?: string;
    businessId?: string;
    sessionEvent?: string;
  } = {};

  ngOnInit(): void {
    this.loadConfig();
    this.initFbSdk();
  }

  private async loadConfig(): Promise<void> {
    const uid = this.auth.currentUser()?.uid;
    if (!uid) return;

    const path = `users/${uid}/mySpaces/${this.appId()}/whatsappConfig/config`;
    const snap = await firstValueFrom(
      this.firestoreService.getDoc<WhatsAppConfig>(path)
    );
    this.config.set(snap ?? null);
  }

  private initFbSdk(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    // Session logging: capture phone_number_id and waba_id when flow completes
    window.addEventListener('message', (event) => {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return;

        if (
          data.event === 'FINISH' ||
          data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' ||
          data.event === 'FINISH_ONLY_WABA' ||
          data.event === 'FINISH_OBO_MIGRATION' ||
          data.event === 'FINISH_GRANT_ONLY_API_ACCESS'
        ) {
          this.sessionData = {
            phoneNumberId: data.data?.phone_number_id,
            wabaId: data.data?.waba_id,
            businessId: data.data?.business_id,
            sessionEvent: data.event
          };
        } else if (data.event === 'CANCEL') {
          // User abandoned the flow — log which screen they left on
          const step = data.data?.current_step ?? 'unknown';
          const errorMsg = data.data?.error_message;
          if (errorMsg) {
            // User-reported error from within the flow
            this.error.set(`Setup error: ${errorMsg}`);
          } else {
            this.error.set(
              `WhatsApp setup was not completed (stopped at: ${step}). Please try again.`
            );
          }
        }
      } catch {
        // non-JSON message — ignore
      }
    });

    const initFB = () => {
      (window as any).FB?.init({
        appId: (window as any).__META_APP_ID__ || '634236035738204',
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v25.0'
      });
      this.isSdkReady.set(true);
    };

    if (typeof FB !== 'undefined') {
      // SDK already loaded (e.g. cached) — init immediately
      initFB();
      return;
    }

    // SDK not yet loaded — set fbAsyncInit so it fires once the script loads
    (window as any).fbAsyncInit = initFB;
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }

  protected launchEmbeddedSignup(): void {
    const metaAppId = (window as any).__META_APP_ID__;
    const metaConfigId = (window as any).__META_CONFIG_ID__;

    if (!metaAppId || !metaConfigId) {
      this.error.set(
        'WhatsApp integration is not configured. Contact support.'
      );
      return;
    }

    if (!this.isSdkReady() || typeof FB === 'undefined') {
      this.error.set(
        'Facebook SDK is not ready. Please wait a moment and try again.'
      );
      return;
    }

    this.error.set(null);

    FB.login(
      (response: any) => {
        console.log('[WhatsApp] FB.login response:', response);
        if (response.authResponse?.code) {
          console.log(
            '[WhatsApp] Auth code received:',
            response.authResponse.code
          );
          this.exchangeCode(response.authResponse.code);
        } else {
          console.warn(
            '[WhatsApp] No auth code in response. Status:',
            response.status
          );
          this.error.set(
            'WhatsApp signup was cancelled or failed. Please try again.'
          );
        }
      },
      {
        config_id: (window as any).__META_CONFIG_ID__ || '2474624339664153',
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3'
        }
      }
    );
  }

  private async exchangeCode(code: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.fns.firebaseCall<
        {
          code: string;
          phoneNumberId?: string;
          wabaId?: string;
          businessId?: string;
          sessionEvent?: string;
        },
        any
      >('whatsapp-connectbusiness', { code, ...this.sessionData });
      await this.loadConfig();
    } catch (err: any) {
      this.error.set(
        err?.message ?? 'Failed to connect WhatsApp. Please try again.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  protected async disconnect(): Promise<void> {
    const wabaId = this.config()?.wabaId;
    if (!wabaId) return;

    this.isDisconnecting.set(true);
    this.error.set(null);

    try {
      await this.fns.firebaseCall<{ wabaId: string }, any>(
        'whatsapp-disconnectbusiness',
        { wabaId }
      );
      await this.loadConfig();
    } catch (err: any) {
      this.error.set(
        err?.message ?? 'Failed to disconnect WhatsApp. Please try again.'
      );
    } finally {
      this.isDisconnecting.set(false);
    }
  }

  protected get isConnected(): boolean {
    return this.config()?.status === WhatsAppConnectionStatus.CONNECTED;
  }
}
