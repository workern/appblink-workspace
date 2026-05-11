import { computed, Injectable, signal } from '@angular/core';

export type UILibrary = 'spartan' | 'material' | 'primeng' | 'custom';

export interface AppConfig {
  appKeyName: string;
  appDisplayName: string;
  spaceId: string;
  functionsInitialSlug?:string;
  /** New workspace-based path: apps/{appKeyName}/workspaces/{workspaceId} */
  workspaceId?: string;
  initialReturnUrl: string;
  uiLibrary?: UILibrary;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalManagerService {
  config = signal<AppConfig>({
    appKeyName: '',
    appDisplayName: '',
    spaceId: '',
    initialReturnUrl: '',
    uiLibrary: 'custom'
  });

  appKeyName = computed(() => this.config().appKeyName);
  appDisplayName = computed(() => this.config().appDisplayName);
  spaceId = computed(() => this.config().spaceId);
  workspaceId = computed(() => this.config().workspaceId ?? null);
  initialReturnUrl = computed(() => this.config().initialReturnUrl);
  uiLibrary = computed(() => this.config().uiLibrary);
  functionsInitialSlug = computed(() => this.config().functionsInitialSlug ?? this.appKeyName());
}
