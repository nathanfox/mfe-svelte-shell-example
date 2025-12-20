import { createRoot, Root } from 'react-dom/client';
import App from './App';

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
  permissions?: string[];
  external?: boolean;
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

let root: Root | null = null;

export async function bootstrap(_props: MfeProps): Promise<void> {
  console.log('[React MFE] Bootstrapping');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, auth, eventBus, navigate, basePath, navigation } = props;

  // Register dynamic routes for this MFE
  const routes: MfeRoute[] = [
    { label: 'Overview', path: basePath, icon: '🏠', order: 1 },
    { label: 'Analytics', path: `${basePath}/analytics`, icon: '📈', order: 2 },
    { label: 'Reports', path: `${basePath}/reports`, icon: '📄', order: 3 },
  ];

  // Add admin routes if user has permission
  if (auth.user?.roles?.includes('admin')) {
    routes.push({
      label: 'Admin',
      path: `${basePath}/admin`,
      icon: '🛡️',
      order: 100,
      permissions: ['admin'],
    });
  }

  navigation.registerRoutes(routes);

  root = createRoot(container);
  root.render(
    <App
      auth={auth}
      eventBus={eventBus}
      navigate={navigate}
      basePath={basePath}
    />
  );

  console.log('[React MFE] Mounted');
}

export async function unmount(props: MfeProps): Promise<void> {
  props.navigation.unregisterRoutes();

  if (root) {
    root.unmount();
    root = null;
  }

  console.log('[React MFE] Unmounted');
}
