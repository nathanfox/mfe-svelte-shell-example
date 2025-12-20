import { createApp, App as VueApp } from 'vue';
import App from './App.vue';

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

let app: VueApp | null = null;

export async function bootstrap(_props: MfeProps): Promise<void> {
  console.log('[Vue MFE] Bootstrapping');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, auth, eventBus, navigate, basePath, navigation } = props;

  // Register routes for this MFE
  const routes: MfeRoute[] = [
    { label: 'Settings', path: basePath, icon: '⚙️', order: 1 },
    { label: 'Profile', path: `${basePath}/profile`, icon: '👤', order: 2 },
    { label: 'Preferences', path: `${basePath}/preferences`, icon: '🎨', order: 3 },
  ];

  navigation.registerRoutes(routes);

  app = createApp(App, { auth, eventBus, navigate, basePath });
  app.mount(container);

  console.log('[Vue MFE] Mounted');
}

export async function unmount(props: MfeProps): Promise<void> {
  props.navigation.unregisterRoutes();

  if (app) {
    app.unmount();
    app = null;
  }

  console.log('[Vue MFE] Unmounted');
}
