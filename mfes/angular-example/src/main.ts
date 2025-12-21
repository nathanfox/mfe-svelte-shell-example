import { bootstrapApplication, createApplication } from '@angular/platform-browser';
import { ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appConfig, createMfeAppConfig, MfeProps } from './app/app.config';

interface MfeRoute {
  label: string;
  path: string;
  icon?: string;
  order?: number;
}

let appRef: ApplicationRef | null = null;

export async function bootstrap(_props: MfeProps): Promise<void> {
  console.log('[Angular MFE] Bootstrapping');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, basePath, navigation } = props;

  // Register routes for this MFE
  const routes: MfeRoute[] = [
    { label: 'Angular', path: basePath, icon: '🅰️', order: 1 },
    { label: 'Components', path: `${basePath}/components`, icon: '🧩', order: 2 },
    { label: 'Services', path: `${basePath}/services`, icon: '⚙️', order: 3 },
  ];

  navigation.registerRoutes(routes);

  // Create a host element for Angular
  const hostElement = document.createElement('app-root');
  container.appendChild(hostElement);

  // Bootstrap the Angular application with props injected via DI
  const mfeConfig = createMfeAppConfig(props);
  appRef = await createApplication(mfeConfig);
  const environmentInjector = appRef.injector.get(EnvironmentInjector);
  const componentRef = createComponent(AppComponent, {
    hostElement,
    environmentInjector,
  });

  appRef.attachView(componentRef.hostView);

  console.log('[Angular MFE] Mounted');
}

export async function unmount(props: MfeProps): Promise<void> {
  props.navigation.unregisterRoutes();

  if (appRef) {
    appRef.destroy();
    appRef = null;
  }

  // Clean up the container
  props.container.innerHTML = '';

  console.log('[Angular MFE] Unmounted');
}

// For standalone development
if (document.querySelector('app-root')) {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
  );
}
