import { withInMemoryScrolling, withViewTransitions } from '@angular/router';

export const ROUTER_CONFIG = [
  withInMemoryScrolling({
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled'
  }),
  withViewTransitions()
];
