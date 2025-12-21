import { ApplicationConfig, InjectionToken, provideExperimentalZonelessChangeDetection } from '@angular/core';

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

// Injection token for MFE props - allows proper dependency injection
export const MFE_PROPS = new InjectionToken<MfeProps>('MFE_PROPS');

export const appConfig: ApplicationConfig = {
  providers: [
    // Enable zoneless change detection - required for MFE mode without Zone.js
    provideExperimentalZonelessChangeDetection(),
  ],
};

// Helper to create config with MFE props
export function createMfeAppConfig(props: MfeProps): ApplicationConfig {
  return {
    providers: [
      provideExperimentalZonelessChangeDetection(),
      { provide: MFE_PROPS, useValue: props },
    ],
  };
}
