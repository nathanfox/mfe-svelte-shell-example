// MFE Type Definitions

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

export interface AuthContext {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export interface EventBus {
  emit: (event: string, payload: unknown) => void;
  on: (event: string, handler: (payload: unknown) => void) => () => void;
}

export interface MfeRoute {
  label: string;
  path: string;
  icon?: string;
  order?: number;
  permissions?: string[];
  external?: boolean;
}

export interface NavigationApi {
  registerRoutes: (routes: MfeRoute[]) => void;
  unregisterRoutes: () => void;
  currentPath: string;
}

export interface CacheOptions {
  ttl?: number;
  version?: number;
}

export interface MfeCache {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T, options?: CacheOptions) => void;
  clear: () => void;
}

export interface MfeProps {
  container: HTMLElement;
  basePath: string;
  auth: AuthContext;
  eventBus: EventBus;
  navigate: (path: string) => void;
  theme: 'light' | 'dark';
  navigation: NavigationApi;
  cache: MfeCache;
}

export interface MfeLifecycle {
  bootstrap: (props: MfeProps) => Promise<void>;
  mount: (props: MfeProps) => Promise<void>;
  unmount: (props: MfeProps) => Promise<void>;
  unload?: () => Promise<void>;
}

export interface MenuChild {
  label: string;
  path: string;
  icon?: string;
  permissions?: string[];
}

export interface MenuConfig {
  label: string;
  icon?: string;
  order?: number;
  section?: string;
  children?: MenuChild[];
}

export interface MfeRegistration {
  id: string;
  name: string;
  entry: string;
  route: string;
  activeWhen?: string[];
  menu?: MenuConfig;
  permissions?: string[];
  featureFlag?: string;
}

export interface MfeManifest {
  version: string;
  mfes: MfeRegistration[];
}
