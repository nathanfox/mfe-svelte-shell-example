import { bootstrapApplication, createApplication } from '@angular/platform-browser';
import { ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

interface EventBus {
  emit: (event: string, payload: unknown) => void;
  on: (event: string, handler: (payload: unknown) => void) => () => void;
}

interface MfeRoute {
  label: string;
  path: string;
  icon?: string;
  order?: number;
}

interface NavigationApi {
  registerRoutes: (routes: MfeRoute[]) => void;
  unregisterRoutes: () => void;
  currentPath: string;
}

interface MfeCache {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T) => void;
  clear: () => void;
}

interface MfeProps {
  container: HTMLElement;
  basePath: string;
  auth: AuthContext;
  eventBus: EventBus;
  navigate: (path: string) => void;
  theme: 'light' | 'dark';
  navigation: NavigationApi;
  cache: MfeCache;
}

let appRef: ApplicationRef | null = null;

// Store props globally for Angular components to access
(window as unknown as { __MFE_PROPS__?: MfeProps }).__MFE_PROPS__ = undefined;

export async function bootstrap(_props: MfeProps): Promise<void> {
  console.log('[Angular MFE] Bootstrapping');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, basePath, navigation } = props;

  // Store props for Angular components
  (window as unknown as { __MFE_PROPS__: MfeProps }).__MFE_PROPS__ = props;

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

  // Bootstrap the Angular application
  appRef = await createApplication(appConfig);
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

  // Clear global props
  (window as unknown as { __MFE_PROPS__?: MfeProps }).__MFE_PROPS__ = undefined;

  console.log('[Angular MFE] Unmounted');
}

// For standalone development
if (document.querySelector('app-root')) {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err)
  );
}
