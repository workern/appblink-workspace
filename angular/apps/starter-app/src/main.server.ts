import {
  BootstrapContext,
  bootstrapApplication
} from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// During build/prerender the adapter expects clean JSON or no extraneous stdout.
// When PRERENDERING=1 is set (we set it in the build script), silence console
// to avoid corrupting the adapter's manifest parsing.
if (process.env.PRERENDERING === '1') {
  // silence common console methods used across the app
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  (console.log as any) = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  (console.info as any) = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  (console.warn as any) = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  (console.error as any) = () => {};
} else {
  console.log('Bootstrapping server application');
}

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
