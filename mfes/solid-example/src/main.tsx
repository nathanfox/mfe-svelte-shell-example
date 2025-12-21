import { render } from 'solid-js/web';
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

let dispose: (() => void) | null = null;

export async function bootstrap(_props: MfeProps): Promise<void> {
  console.log('[SolidJS MFE] Bootstrapping');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, auth, eventBus, navigate, basePath, navigation } = props;

  // Register routes for this MFE
  const routes: MfeRoute[] = [
    { label: 'Home', path: basePath, icon: '🏠', order: 1 },
    { label: 'Signals', path: `${basePath}/signals`, icon: '⚡', order: 2 },
    { label: 'Store', path: `${basePath}/store`, icon: '📦', order: 3 },
  ];

  navigation.registerRoutes(routes);

  // SolidJS render returns a dispose function for cleanup
  dispose = render(
    () => (
      <App
        auth={auth}
        eventBus={eventBus}
        navigate={navigate}
        basePath={basePath}
        currentPath={navigation.currentPath}
      />
    ),
    container
  );

  console.log('[SolidJS MFE] Mounted');
}

export async function unmount(props: MfeProps): Promise<void> {
  props.navigation.unregisterRoutes();

  if (dispose) {
    dispose();
    dispose = null;
  }

  console.log('[SolidJS MFE] Unmounted');
}
