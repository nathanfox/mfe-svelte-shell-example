import App from './App.svelte';
import { mount, unmount as svelteUnmount } from 'svelte';

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

let app: Record<string, unknown> | null = null;

export async function bootstrap(_props: MfeProps): Promise<void> {
  console.log('[Svelte MFE] Bootstrapping');
}

export async function mountMfe(props: MfeProps): Promise<void> {
  const { container, auth, eventBus, navigate, basePath, navigation } = props;

  // Register routes for this MFE
  const routes: MfeRoute[] = [
    { label: 'Reports', path: basePath, icon: '📊', order: 1 },
    { label: 'Charts', path: `${basePath}/charts`, icon: '📈', order: 2 },
    { label: 'Export', path: `${basePath}/export`, icon: '📤', order: 3 },
  ];

  navigation.registerRoutes(routes);

  app = mount(App, {
    target: container,
    props: { auth, eventBus, navigate, basePath },
  });

  console.log('[Svelte MFE] Mounted');
}

// Export as 'mount' for the shell
export { mountMfe as mount };

export async function unmount(props: MfeProps): Promise<void> {
  props.navigation.unregisterRoutes();

  if (app) {
    svelteUnmount(app);
    app = null;
  }

  console.log('[Svelte MFE] Unmounted');
}
