import type { User, AuthContext } from '../types/mfe';

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
    },

    logout() {
      user = null;
      token = null;
    },
  };
}

export const auth = createAuth();
