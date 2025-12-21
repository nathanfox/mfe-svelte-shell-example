import type { User, AuthContext } from '../types/mfe';
import { eventBus } from './eventBus';

function createAuth(): AuthContext {
  let user = $state<User | null>(null);
  let token = $state<string | null>(null);

  return {
    get user() {
      return user;
    },
    get token() {
      return token;
    },
    get isAuthenticated() {
      return user !== null;
    },

    login() {
      // Mock login - replace with real auth provider
      user = {
        id: '1',
        name: 'Demo User',
        email: 'demo@example.com',
        roles: ['user', 'admin'],
      };
      token = 'mock-jwt-token';

      // Notify MFEs of auth change
      eventBus.emit('auth:changed', { user, token, isAuthenticated: true });
    },

    logout() {
      user = null;
      token = null;

      // Notify MFEs of auth change
      eventBus.emit('auth:changed', { user: null, token: null, isAuthenticated: false });
    },
  };
}

export const auth = createAuth();
