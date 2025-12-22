# Micro-Frontend Architecture

## Overview

This repository provides a **reference implementation** of a micro-frontend architecture designed for:

- **Framework agnosticism** - Shell supports MFEs built with any framework (React, Vue, Angular, Svelte, etc.)
- **GenAI agent guidance** - Clean patterns that AI coding assistants can understand and replicate
- **Production readiness** - Patterns suitable for real-world applications

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Shell Application (Svelte)                       │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Header (auth status, user menu, notifications)                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────────────────────────────────┐   │
│  │                 │  │                                             │   │
│  │  Navigation     │  │  MFE Container                              │   │
│  │  Menu           │  │                                             │   │
│  │                 │  │  ┌─────────────────────────────────────┐    │   │
│  │  (Generated     │  │  │                                     │    │   │
│  │   from          │  │  │  Active Micro-Frontend              │    │   │
│  │   manifest)     │  │  │                                     │    │   │
│  │                 │  │  │  - React, Vue, Angular, Svelte      │    │   │
│  │  ┌───────────┐  │  │  │  - Loaded on demand                 │    │   │
│  │  │ Dashboard │  │  │  │  - Independently deployed           │    │   │
│  │  │ Settings  │  │  │  │                                     │    │   │
│  │  │ Reports   │  │  │  └─────────────────────────────────────┘    │   │
│  │  │ ...       │  │  │                                             │   │
│  │  └───────────┘  │  │                                             │   │
│  └─────────────────┘  └─────────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Footer                                                           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Framework Freedom** | Each MFE chooses its own framework; shell imposes no constraints |
| **Independent Deployment** | MFEs deploy without shell rebuild or coordination |
| **Isolation** | MFE failures don't crash the shell or other MFEs |
| **Shared Context** | Shell provides auth, theme, and communication infrastructure |
| **Minimal Shell** | Shell does orchestration only; business logic lives in MFEs |

---

## Technology Choices

### Shell: Svelte 5

The shell is built with Svelte 5 for:

- **Near-zero runtime** (~1.6 KB) - compiles to vanilla JS
- **No framework conflicts** - no runtime to clash with MFE frameworks
- **Clean syntax** - easy for developers and AI agents to understand
- **Built-in reactivity** - simple state management without external libraries

See [shell-framework-decision.md](./shell-framework-decision.md) for detailed rationale.

### Module Loading: Native Federation

We use Native Federation for loading MFEs:

- **Bundler-agnostic** - works with Vite, Rollup, esbuild (not just Webpack)
- **ES Modules native** - uses browser-standard import maps
- **Shared dependencies** - avoids loading React/Vue multiple times

### MFE Registration: Static Manifest

MFEs are registered via a static JSON manifest for simplicity:

- **No backend required** - just a JSON file
- **Easy to understand** - AI agents can read and modify
- **Debuggable** - inspect manifest to see all registered MFEs

See [mfe-registration-patterns.md](./mfe-registration-patterns.md) for alternative patterns.

---

## Project Structure

```
mfe-svelte-shell-example/
├── shell/                          # Svelte 5 shell application
│   ├── src/
│   │   ├── App.svelte              # Root component
│   │   ├── main.ts                 # Entry point
│   │   ├── components/
│   │   │   ├── Header.svelte       # Header with auth
│   │   │   ├── Navigation.svelte   # Dynamic nav menu
│   │   │   ├── Footer.svelte       # Footer
│   │   │   ├── MfeContainer.svelte # MFE mount point
│   │   │   └── ErrorBoundary.svelte
│   │   ├── lib/
│   │   │   ├── federation.ts       # Native Federation loader
│   │   │   ├── auth.svelte.ts      # Auth state (mock)
│   │   │   ├── eventBus.ts         # Cross-MFE communication
│   │   │   └── manifest.ts         # Manifest loader
│   │   └── types/
│   │       └── mfe.ts              # MFE type definitions
│   ├── public/
│   │   └── manifest.json           # MFE registry
│   ├── vite.config.ts
│   └── package.json
│
├── mfes/
│   ├── react-example/              # React 18 MFE
│   │   ├── src/
│   │   │   ├── main.tsx            # Lifecycle exports
│   │   │   └── App.tsx
│   │   ├── vite.config.ts          # Federation config
│   │   └── package.json
│   │
│   ├── vue-example/                # Vue 3 MFE
│   │   ├── src/
│   │   │   ├── main.ts             # Lifecycle exports
│   │   │   └── App.vue
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── svelte-example/             # Svelte 5 MFE
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   └── App.svelte
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── solid-example/              # SolidJS MFE
│   │   ├── src/
│   │   │   ├── main.tsx            # Lifecycle exports
│   │   │   └── App.tsx
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── angular-example/            # Angular 17+ MFE
│       ├── src/
│       │   └── main.ts
│       ├── angular.json
│       └── package.json
│
├── shared/                         # Shared packages (optional)
│   └── types/                      # Shared TypeScript types
│       └── src/
│           └── index.ts
│
├── docs/                           # Documentation
│   ├── micro-frontend-architecture.md
│   ├── shell-framework-decision.md
│   └── mfe-registration-patterns.md
│
└── README.md
```

---

## MFE Manifest

The shell loads a manifest that describes all available MFEs:

```json
{
  "version": "1.0.0",
  "mfes": [
    {
      "id": "react-example",
      "name": "React Dashboard",
      "entry": "/mfes/react-example/dist/remoteEntry.js",
      "route": "/react",
      "menu": {
        "label": "Dashboard",
        "icon": "dashboard",
        "order": 1,
        "children": [
          { "label": "Overview", "path": "/react", "icon": "home" },
          { "label": "Analytics", "path": "/react/analytics", "icon": "chart" },
          { "label": "Reports", "path": "/react/reports", "icon": "file" }
        ]
      }
    },
    {
      "id": "vue-example",
      "name": "Vue Settings",
      "entry": "/mfes/vue-example/dist/remoteEntry.js",
      "route": "/vue",
      "menu": {
        "label": "Settings",
        "icon": "cog",
        "order": 2
      }
    },
    {
      "id": "svelte-example",
      "name": "Svelte Reports",
      "entry": "/mfes/svelte-example/dist/remoteEntry.js",
      "route": "/svelte",
      "menu": {
        "label": "Svelte App",
        "icon": "svelte",
        "order": 3
      }
    }
  ]
}
```

### Manifest Schema

```typescript
interface MfeManifest {
  version: string;
  mfes: MfeRegistration[];
}

interface MfeRegistration {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  entry: string;                 // URL to remoteEntry.js
  route: string;                 // Base route path
  activeWhen?: string[];         // Additional activation paths
  menu?: MenuConfig;             // Menu configuration
  permissions?: string[];        // Required permissions
  featureFlag?: string;          // Feature flag to check
}

interface MenuConfig {
  label: string;                 // Menu item label
  icon?: string;                 // Icon identifier
  order?: number;                // Sort order
  section?: string;              // Menu section grouping
  children?: MenuChild[];        // Sub-navigation items (static)
}

interface MenuChild {
  label: string;                 // Sub-menu item label
  path: string;                  // Full path to navigate to
  icon?: string;                 // Icon identifier
  permissions?: string[];        // Required permissions for this route
}
```

---

## MFE Lifecycle Contract

Every MFE must export these lifecycle functions:

```typescript
interface MfeLifecycle {
  // Called once when MFE is first loaded
  bootstrap(props: MfeProps): Promise<void>;

  // Called each time MFE is activated (route matches)
  mount(props: MfeProps): Promise<void>;

  // Called when navigating away from MFE
  unmount(props: MfeProps): Promise<void>;

  // Optional: Called when MFE is being unloaded
  unload?(): Promise<void>;
}

interface MfeProps {
  // DOM element to render into
  container: HTMLElement;

  // Base path for this MFE's routes
  basePath: string;

  // Authentication context
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
  };

  // Cross-MFE communication
  eventBus: {
    emit: (event: string, payload: any) => void;
    on: (event: string, handler: (payload: any) => void) => () => void;
  };

  // Shell navigation
  navigate: (path: string) => void;

  // Theme (reactive - updates when user changes theme)
  theme: 'light' | 'dark';

  // Dynamic route registration (for sub-navigation)
  navigation: {
    registerRoutes: (routes: MfeRoute[]) => void;
    unregisterRoutes: () => void;
    currentPath: string;
  };

  // State cache for MFE-specific persistence across mount/unmount
  cache: {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T, options?: CacheOptions) => void;
    clear: () => void;
  };

  // Shared state atoms (cross-MFE, shell-owned)
  // Uses nanostores for framework-agnostic reactivity
  shared: SharedState;
}

interface CacheOptions {
  ttl?: number;                  // Time-to-live in ms (default: 5 min)
  version?: number;              // Schema version for migration
}

interface SharedState {
  // User & authentication
  user: WritableAtom<User | null>;

  // UI preferences
  theme: WritableAtom<'light' | 'dark'>;
  settings: MapStore<Settings>;

  // Cross-MFE business data
  cart: MapStore<CartState>;
  notifications: WritableAtom<Notification[]>;
}

interface Settings {
  language: string;
  timezone: string;
  currency: string;
}

interface CartState {
  items: CartItem[];
  total: number;
}

interface MfeRoute {
  label: string;                 // Display label
  path: string;                  // Full path (should start with basePath)
  icon?: string;                 // Icon identifier
  order?: number;                // Sort order
  permissions?: string[];        // Required permissions
  external?: boolean;            // If true, opens in new tab
}
```

---

## MFE Implementation Examples

### React MFE

```tsx
// mfes/react-example/src/main.tsx
import { createRoot, Root } from 'react-dom/client';
import App from './App';
import type { MfeProps, MfeRoute } from '@micro-ui/types';

let root: Root | null = null;

export async function bootstrap(props: MfeProps) {
  console.log('[React MFE] Bootstrapping');
}

export async function mount(props: MfeProps) {
  const { container, auth, eventBus, navigate, basePath, navigation } = props;

  // Register dynamic routes for this MFE
  const routes: MfeRoute[] = [
    { label: 'Overview', path: basePath, icon: 'home', order: 1 },
    { label: 'Analytics', path: `${basePath}/analytics`, icon: 'chart', order: 2 },
    { label: 'Reports', path: `${basePath}/reports`, icon: 'file', order: 3 },
  ];

  // Add admin routes if user has permission
  if (auth.user?.roles?.includes('admin')) {
    routes.push({
      label: 'Admin',
      path: `${basePath}/admin`,
      icon: 'shield',
      order: 100,
      permissions: ['admin'],
    });
  }

  // Add external documentation link
  routes.push({
    label: 'Docs',
    path: 'https://docs.example.com/dashboard',
    icon: 'external-link',
    order: 999,
    external: true,
  });

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
}

export async function unmount(props: MfeProps) {
  // Clean up registered routes
  props.navigation.unregisterRoutes();

  if (root) {
    root.unmount();
    root = null;
  }
}
```

### Vue MFE

```typescript
// mfes/vue-example/src/main.ts
import { createApp, App as VueApp } from 'vue';
import App from './App.vue';
import type { MfeProps } from '@micro-ui/types';

let app: VueApp | null = null;

export async function bootstrap(props: MfeProps) {
  console.log('[Vue MFE] Bootstrapping');
}

export async function mount(props: MfeProps) {
  const { container, auth, eventBus, navigate, basePath } = props;

  app = createApp(App, { auth, eventBus, navigate, basePath });
  app.mount(container);
}

export async function unmount(props: MfeProps) {
  if (app) {
    app.unmount();
    app = null;
  }
}
```

### Svelte MFE

```typescript
// mfes/svelte-example/src/main.ts
import App from './App.svelte';
import type { MfeProps } from '@micro-ui/types';

let app: App | null = null;

export async function bootstrap(props: MfeProps) {
  console.log('[Svelte MFE] Bootstrapping');
}

export async function mount(props: MfeProps) {
  const { container, auth, eventBus, navigate, basePath } = props;

  app = new App({
    target: container,
    props: { auth, eventBus, navigate, basePath },
  });
}

export async function unmount(props: MfeProps) {
  if (app) {
    app.$destroy();
    app = null;
  }
}
```

### Angular MFE

```typescript
// mfes/angular-example/src/main.ts
import { createApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import type { MfeProps } from '@micro-ui/types';

let appRef: any = null;

export async function bootstrap(props: MfeProps) {
  console.log('[Angular MFE] Bootstrapping');
}

export async function mount(props: MfeProps) {
  const { container } = props;

  const app = await createApplication(appConfig);
  appRef = app;

  const rootComponent = app.bootstrap(AppComponent);
  container.appendChild(rootComponent.location.nativeElement);
}

export async function unmount(props: MfeProps) {
  if (appRef) {
    appRef.destroy();
    appRef = null;
  }
}
```

### SolidJS MFE

SolidJS offers React-like syntax with superior performance through fine-grained reactivity (no Virtual DOM). It has the highest developer satisfaction rating (90.87% in State of JS).

```typescript
// mfes/solid-example/src/main.tsx
import { render } from 'solid-js/web';
import { onCleanup } from 'solid-js';
import App from './App';
import type { MfeProps } from '@micro-ui/types';

let dispose: (() => void) | null = null;

export async function bootstrap(props: MfeProps) {
  console.log('[SolidJS MFE] Bootstrapping');
}

export async function mount(props: MfeProps) {
  const { container, auth, eventBus, navigate, basePath } = props;

  // SolidJS render returns a dispose function for cleanup
  dispose = render(
    () => (
      <App
        auth={auth}
        eventBus={eventBus}
        navigate={navigate}
        basePath={basePath}
      />
    ),
    container
  );
}

export async function unmount(props: MfeProps) {
  if (dispose) {
    dispose();
    dispose = null;
  }
}
```

**Key SolidJS Concepts:**

```tsx
// mfes/solid-example/src/App.tsx
import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';

interface AppProps {
  auth: AuthContext;
  eventBus: EventBus;
  navigate: (path: string) => void;
  basePath: string;
}

export default function App(props: AppProps) {
  // Signals are SolidJS's reactive primitives (like React useState but finer-grained)
  const [count, setCount] = createSignal(0);

  // onMount runs once when component mounts
  onMount(() => {
    console.log('[SolidJS] Component mounted');

    // Subscribe to events from other MFEs
    const unsubscribe = props.eventBus.on('user:updated', (user) => {
      console.log('User updated:', user);
    });

    // onCleanup registers cleanup logic (runs on unmount or when effect re-runs)
    onCleanup(() => {
      unsubscribe();
      console.log('[SolidJS] Cleanup complete');
    });
  });

  // createEffect automatically tracks dependencies and re-runs when they change
  createEffect(() => {
    console.log('Count changed to:', count());
  });

  const handleClick = () => {
    setCount(count() + 1);
    props.eventBus.emit('notification:show', {
      type: 'info',
      message: `SolidJS count: ${count()}`,
    });
  };

  return (
    <div class="solid-app">
      <h1>SolidJS Micro-Frontend</h1>
      <p>User: {props.auth.user?.name ?? 'Not logged in'}</p>
      <button onClick={handleClick}>Count: {count()}</button>
      <button onClick={() => props.navigate('/react')}>Go to React MFE</button>
    </div>
  );
}
```

**Why SolidJS is Different:**

| Concept | React | SolidJS |
|---------|-------|---------|
| **Reactivity** | Component re-renders on state change | Only the specific DOM node updates |
| **State** | `useState` returns `[value, setter]` | `createSignal` returns `[getter, setter]` |
| **Reading state** | `count` (direct value) | `count()` (call the getter) |
| **Components** | Re-run on every render | Run once, only effects re-run |
| **Performance** | Virtual DOM diffing | Direct DOM updates, no diffing |

---

## Shell Components

### App.svelte (Root)

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import Navigation from './components/Navigation.svelte';
  import SecondaryNav from './components/SecondaryNav.svelte';
  import Footer from './components/Footer.svelte';
  import MfeContainer from './components/MfeContainer.svelte';
  import { loadManifest, type MfeRegistration } from './lib/manifest';
  import { auth } from './lib/auth.svelte';
  import { dynamicRoutes } from './lib/routeRegistry.svelte';

  let mfes = $state<MfeRegistration[]>([]);
  let activeMfe = $state<MfeRegistration | null>(null);
  let currentPath = $state(window.location.pathname);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Compute merged navigation for active MFE
  let secondaryNavRoutes = $derived(() => {
    if (!activeMfe) return [];

    // Merge static (manifest) and dynamic (registered) routes
    const staticRoutes = activeMfe.menu?.children ?? [];
    const mfeDynamicRoutes = dynamicRoutes.get(activeMfe.id) ?? [];

    const routeMap = new Map();
    for (const route of staticRoutes) routeMap.set(route.path, route);
    for (const route of mfeDynamicRoutes) routeMap.set(route.path, route);

    return Array.from(routeMap.values()).sort((a, b) =>
      (a.order ?? 0) - (b.order ?? 0)
    );
  });

  onMount(async () => {
    try {
      const manifest = await loadManifest('/manifest.json');
      mfes = manifest.mfes;
      handleRoute(window.location.pathname);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load manifest';
    } finally {
      loading = false;
    }

    const handlePopState = () => handleRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });

  function handleRoute(path: string) {
    currentPath = path;
    const mfe = mfes.find(m =>
      path.startsWith(m.route) ||
      m.activeWhen?.some(p => path.startsWith(p))
    );
    activeMfe = mfe ?? null;
  }

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    handleRoute(path);
  }
</script>

<div class="shell">
  <Header user={auth.user} onLogout={auth.logout} />

  <div class="shell-body">
    <Navigation {mfes} {activeMfe} {navigate} />

    <div class="shell-main">
      {#if activeMfe && secondaryNavRoutes.length > 0}
        <SecondaryNav
          routes={secondaryNavRoutes}
          {currentPath}
          {navigate}
        />
      {/if}

      <main class="shell-content">
        {#if loading}
          <div class="loading">Loading...</div>
        {:else if error}
          <div class="error">{error}</div>
        {:else if activeMfe}
          <MfeContainer mfe={activeMfe} {navigate} {currentPath} />
        {:else}
          <div class="welcome">Select an application from the menu</div>
        {/if}
      </main>
    </div>
  </div>

  <Footer />
</div>
```

### SecondaryNav.svelte

```svelte
<script lang="ts">
  import type { MfeRoute } from '../types/mfe';

  interface Props {
    routes: MfeRoute[];
    currentPath: string;
    navigate: (path: string) => void;
  }

  let { routes, currentPath, navigate }: Props = $props();

  function isActive(route: MfeRoute): boolean {
    if (route.path === currentPath) return true;
    // Handle exact match for root, prefix match for others
    if (route.path !== '/' && currentPath.startsWith(route.path + '/')) return true;
    return false;
  }

  function handleClick(route: MfeRoute, event: MouseEvent) {
    if (route.external) {
      // External links open in new tab (let default behavior happen)
      return;
    }
    event.preventDefault();
    navigate(route.path);
  }
</script>

<nav class="secondary-nav">
  <ul class="secondary-nav-list">
    {#each routes as route}
      <li class="secondary-nav-item">
        <a
          href={route.path}
          class="secondary-nav-link"
          class:active={isActive(route)}
          target={route.external ? '_blank' : undefined}
          rel={route.external ? 'noopener noreferrer' : undefined}
          onclick={(e) => handleClick(route, e)}
        >
          {#if route.icon}
            <span class="nav-icon">{route.icon}</span>
          {/if}
          {route.label}
          {#if route.external}
            <span class="external-indicator">↗</span>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .secondary-nav {
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    background: var(--bg-secondary, #f5f5f5);
  }

  .secondary-nav-list {
    display: flex;
    gap: 0.5rem;
    padding: 0 1rem;
    margin: 0;
    list-style: none;
  }

  .secondary-nav-link {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    text-decoration: none;
    color: var(--text-secondary, #666);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .secondary-nav-link:hover {
    color: var(--text-primary, #333);
    background: var(--bg-hover, #e8e8e8);
  }

  .secondary-nav-link.active {
    color: var(--primary-color, #007bff);
    border-bottom-color: var(--primary-color, #007bff);
  }

  .external-indicator {
    font-size: 0.75rem;
    opacity: 0.7;
  }
</style>
```

### MfeContainer.svelte

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { loadMfe, unloadMfe } from '../lib/federation';
  import { auth } from '../lib/auth.svelte';
  import { eventBus } from '../lib/eventBus';
  import { registerRoutes, unregisterRoutes } from '../lib/routeRegistry.svelte';
  import type { MfeRegistration } from '../lib/manifest';
  import type { MfeRoute } from '../types/mfe';

  interface Props {
    mfe: MfeRegistration;
    navigate: (path: string) => void;
    currentPath: string;
  }

  let { mfe, navigate, currentPath }: Props = $props();

  let container: HTMLElement;
  let currentMfe: MfeRegistration | null = null;
  let loading = $state(true);
  let error = $state<string | null>(null);

  $effect(() => {
    if (mfe && mfe.id !== currentMfe?.id) {
      loadCurrentMfe();
    }
  });

  // Create navigation API for MFE
  function createNavigationApi(mfeId: string) {
    return {
      registerRoutes: (routes: MfeRoute[]) => {
        registerRoutes(mfeId, routes);
        eventBus.emit('navigation:routes-registered', { mfeId, routes });
      },
      unregisterRoutes: () => {
        unregisterRoutes(mfeId);
        eventBus.emit('navigation:routes-unregistered', { mfeId });
      },
      get currentPath() {
        return currentPath;
      },
    };
  }

  async function loadCurrentMfe() {
    loading = true;
    error = null;

    // Unmount previous MFE and clean up its routes
    if (currentMfe) {
      unregisterRoutes(currentMfe.id);
      await unloadMfe(currentMfe.id);
    }

    try {
      await loadMfe(mfe, container, {
        basePath: mfe.route,
        auth: {
          user: auth.user,
          token: auth.token,
          isAuthenticated: auth.isAuthenticated,
          login: auth.login,
          logout: auth.logout,
        },
        eventBus,
        navigate,
        theme: 'light',
        navigation: createNavigationApi(mfe.id),
      });
      currentMfe = mfe;

      // Emit navigation event
      eventBus.emit('navigation:changed', { path: currentPath, mfeId: mfe.id });
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load MFE';
      console.error(`[Shell] Failed to load MFE ${mfe.id}:`, e);
    } finally {
      loading = false;
    }
  }

  onDestroy(async () => {
    if (currentMfe) {
      unregisterRoutes(currentMfe.id);
      await unloadMfe(currentMfe.id);
    }
  });
</script>

<div class="mfe-container" bind:this={container}>
  {#if loading}
    <div class="mfe-loading">
      <span>Loading {mfe.name}...</span>
    </div>
  {/if}

  {#if error}
    <div class="mfe-error">
      <h3>Failed to load {mfe.name}</h3>
      <p>{error}</p>
      <button onclick={loadCurrentMfe}>Retry</button>
    </div>
  {/if}
</div>
```

### routeRegistry.svelte.ts

```typescript
// shell/src/lib/routeRegistry.svelte.ts
import type { MfeRoute } from '../types/mfe';

// Reactive map of MFE ID → registered routes
export let dynamicRoutes = $state(new Map<string, MfeRoute[]>());

export function registerRoutes(mfeId: string, routes: MfeRoute[]) {
  dynamicRoutes.set(mfeId, routes);
  // Trigger reactivity by reassigning
  dynamicRoutes = new Map(dynamicRoutes);
  console.log(`[RouteRegistry] Registered ${routes.length} routes for ${mfeId}`);
}

export function unregisterRoutes(mfeId: string) {
  dynamicRoutes.delete(mfeId);
  dynamicRoutes = new Map(dynamicRoutes);
  console.log(`[RouteRegistry] Unregistered routes for ${mfeId}`);
}

export function getRoutes(mfeId: string): MfeRoute[] {
  return dynamicRoutes.get(mfeId) ?? [];
}
```

### sharedState.ts (Nanostores)

Cross-MFE shared state using [nanostores](https://github.com/nanostores/nanostores):

```typescript
// shell/src/lib/sharedState.ts
import { atom, map, computed } from 'nanostores';
import type { User, Settings, CartState, Notification } from '../types';

// ============================================
// User & Authentication
// ============================================
export const $user = atom<User | null>(null);
export const $isAuthenticated = computed($user, user => user !== null);

// ============================================
// Theme & UI Preferences
// ============================================
export const $theme = atom<'light' | 'dark'>('light');

export function toggleTheme() {
  $theme.set($theme.get() === 'light' ? 'dark' : 'light');
}

// ============================================
// Global Settings
// ============================================
export const $settings = map<Settings>({
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  currency: 'USD',
});

// ============================================
// Cart (Example of shared business data)
// ============================================
export const $cart = map<CartState>({
  items: [],
  total: 0,
});

export function addToCart(item: CartItem) {
  const current = $cart.get();
  $cart.set({
    items: [...current.items, item],
    total: current.total + item.price,
  });
}

export function removeFromCart(itemId: string) {
  const current = $cart.get();
  const item = current.items.find(i => i.id === itemId);
  if (item) {
    $cart.set({
      items: current.items.filter(i => i.id !== itemId),
      total: current.total - item.price,
    });
  }
}

export function clearCart() {
  $cart.set({ items: [], total: 0 });
}

// ============================================
// Notifications
// ============================================
export const $notifications = atom<Notification[]>([]);

export function addNotification(notification: Omit<Notification, 'id'>) {
  const id = crypto.randomUUID();
  $notifications.set([...$notifications.get(), { ...notification, id }]);

  // Auto-dismiss after duration
  if (notification.duration !== 0) {
    setTimeout(() => {
      dismissNotification(id);
    }, notification.duration ?? 5000);
  }
}

export function dismissNotification(id: string) {
  $notifications.set($notifications.get().filter(n => n.id !== id));
}

// ============================================
// Export shared state object for MFEs
// ============================================
export const sharedState: SharedState = {
  user: $user,
  theme: $theme,
  settings: $settings,
  cart: $cart,
  notifications: $notifications,
};
```

### stateCache.ts

MFE state cache with TTL and size limits:

```typescript
// shell/src/lib/stateCache.ts
interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  version?: number;
}

interface CacheOptions {
  ttl?: number;
  version?: number;
}

class StateCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 50;
  private defaultTtl = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, options?: CacheOptions): void {
    // Enforce size limit (LRU-style: remove oldest)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const ttl = options?.ttl ?? this.defaultTtl;
    this.cache.set(key, {
      value,
      expiresAt: ttl > 0 ? Date.now() + ttl : null,
      version: options?.version,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Create a namespaced cache for a specific MFE
  forMfe(mfeId: string) {
    const prefix = `${mfeId}:`;
    return {
      get: <T>(key: string) => this.get<T>(`${prefix}${key}`),
      set: <T>(key: string, value: T, options?: CacheOptions) =>
        this.set(`${prefix}${key}`, value, options),
      clear: () => {
        for (const key of this.cache.keys()) {
          if (key.startsWith(prefix)) {
            this.cache.delete(key);
          }
        }
      },
    };
  }
}

export const stateCache = new StateCache();
```

---

## Shared State Usage in MFEs

### React MFE

```tsx
// Using @nanostores/react
import { useStore } from '@nanostores/react';

function App({ shared }: { shared: SharedState }) {
  const user = useStore(shared.user);
  const theme = useStore(shared.theme);
  const cart = useStore(shared.cart);

  return (
    <div className={`app theme-${theme}`}>
      <p>Welcome, {user?.name}</p>
      <p>Cart: {cart.items.length} items (${cart.total})</p>
    </div>
  );
}
```

### Vue MFE

```vue
<script setup>
import { useStore } from '@nanostores/vue';

const props = defineProps(['shared']);
const user = useStore(props.shared.user);
const theme = useStore(props.shared.theme);
const cart = useStore(props.shared.cart);
</script>

<template>
  <div :class="`app theme-${theme}`">
    <p>Welcome, {{ user?.name }}</p>
    <p>Cart: {{ cart.items.length }} items (${{ cart.total }})</p>
  </div>
</template>
```

### Svelte MFE

```svelte
<script>
  // Nanostores work natively with Svelte
  export let shared;
  $: user = $shared.user;
  $: theme = $shared.theme;
  $: cart = $shared.cart;
</script>

<div class="app theme-{$theme}">
  <p>Welcome, {$user?.name}</p>
  <p>Cart: {$cart.items.length} items (${$cart.total})</p>
</div>
```

### SolidJS MFE

```tsx
import { useStore } from '@nanostores/solid';

function App(props: { shared: SharedState }) {
  const user = useStore(props.shared.user);
  const theme = useStore(props.shared.theme);
  const cart = useStore(props.shared.cart);

  return (
    <div class={`app theme-${theme()}`}>
      <p>Welcome, {user()?.name}</p>
      <p>Cart: {cart().items.length} items (${cart().total})</p>
    </div>
  );
}
```

---

## Inter-MFE Communication

### Event Bus

The shell provides a simple event bus for cross-MFE communication:

```typescript
// shell/src/lib/eventBus.ts
type EventHandler = (payload: any) => void;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  emit(event: string, payload: any): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`[EventBus] Error in handler for ${event}:`, e);
        }
      });
    }
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }
}

export const eventBus = new EventBus();
```

### Usage in MFEs

```tsx
// React MFE
function App({ eventBus }) {
  useEffect(() => {
    const unsubscribe = eventBus.on('user:updated', (user) => {
      console.log('User updated:', user);
    });
    return unsubscribe;
  }, [eventBus]);

  const handleClick = () => {
    eventBus.emit('notification:show', {
      type: 'success',
      message: 'Action completed!',
    });
  };

  return <button onClick={handleClick}>Do Something</button>;
}
```

### Standard Events

| Event | Payload | Description |
|-------|---------|-------------|
| `notification:show` | `{ type, message, duration? }` | Display toast notification |
| `user:updated` | `User` | User profile changed |
| `theme:changed` | `'light' \| 'dark'` | Theme preference changed |
| `navigate` | `{ path: string }` | Request navigation |

---

## Authentication

### Mock Auth for Development

```typescript
// shell/src/lib/auth.svelte.ts
interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

function createAuth(): AuthState {
  let user = $state<User | null>(null);
  let token = $state<string | null>(null);

  return {
    get user() { return user; },
    get token() { return token; },
    get isAuthenticated() { return user !== null; },

    login() {
      // Mock login - replace with real auth
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
```

### Real Auth Integration

For production, replace with your auth provider:

```typescript
// OAuth/OIDC example
import { OidcClient } from 'oidc-client-ts';

const oidc = new OidcClient({
  authority: 'https://auth.example.com',
  client_id: 'micro-ui-shell',
  redirect_uri: window.location.origin + '/callback',
});

export const auth = {
  async login() {
    await oidc.signinRedirect();
  },

  async logout() {
    await oidc.signoutRedirect();
  },

  async getUser() {
    return await oidc.getUser();
  },
};
```

---

## Routing Strategy

### URL Structure

```
https://app.example.com/{mfe-route}/{mfe-internal-routes}

Examples:
  /react                    → React MFE home
  /react/dashboard          → React MFE dashboard page
  /vue                      → Vue MFE home
  /vue/settings/profile     → Vue MFE settings page
```

### Route Ownership

| Level | Owner | Responsibility |
|-------|-------|----------------|
| Top-level (`/react`, `/vue`) | Shell | Which MFE to load |
| Internal (`/react/dashboard`) | MFE | Page routing within MFE |

### MFE Router Configuration

Each MFE must configure its router with the correct base path:

```typescript
// React (react-router)
<BrowserRouter basename={basePath}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</BrowserRouter>

// Vue (vue-router)
const router = createRouter({
  history: createWebHistory(basePath),
  routes: [
    { path: '/', component: Home },
    { path: '/dashboard', component: Dashboard },
  ],
});
```

---

## Navigation Patterns

The shell supports two levels of navigation:

1. **Primary Navigation** — Top-level MFE selection (from manifest)
2. **Secondary Navigation** — Sub-pages within the active MFE (static or dynamic)

### Navigation Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  Header                                                              │
├───────────────┬─────────────────────────────────────────────────────┤
│               │  Secondary Nav (sub-pages of active MFE)            │
│  Primary Nav  │  ┌───────────────────────────────────────────────┐  │
│  ───────────  │  │ Overview | Analytics | Reports | Settings    │  │
│  Dashboard ●  │  └───────────────────────────────────────────────┘  │
│  Settings     ├─────────────────────────────────────────────────────┤
│  Users        │                                                     │
│  Reports      │  MFE Content Area                                   │
│               │                                                     │
│               │                                                     │
└───────────────┴─────────────────────────────────────────────────────┘
```

### Static Sub-Navigation (Manifest)

Define sub-routes in the manifest for pages known at build time:

```json
{
  "id": "dashboard",
  "name": "Dashboard",
  "entry": "/mfes/dashboard/remoteEntry.js",
  "route": "/dashboard",
  "menu": {
    "label": "Dashboard",
    "icon": "dashboard",
    "order": 1,
    "children": [
      { "label": "Overview", "path": "/dashboard", "icon": "home" },
      { "label": "Analytics", "path": "/dashboard/analytics", "icon": "chart" },
      { "label": "Reports", "path": "/dashboard/reports", "icon": "file" }
    ]
  }
}
```

**Best for:**
- Pages known at build time
- Simple, predictable navigation
- When MFE doesn't need to control its own nav

### Dynamic Sub-Navigation (Runtime)

MFEs can register routes dynamically for pages determined at runtime:

```typescript
// mfes/dashboard/src/main.tsx
export async function mount(props: MfeProps) {
  const { container, navigation, basePath, auth } = props;

  // Register dynamic routes based on user permissions or data
  const routes: MfeRoute[] = [
    { label: 'Overview', path: basePath, icon: 'home', order: 1 },
    { label: 'Analytics', path: `${basePath}/analytics`, icon: 'chart', order: 2 },
  ];

  // Add admin-only routes
  if (auth.user?.roles.includes('admin')) {
    routes.push({
      label: 'Admin Settings',
      path: `${basePath}/admin`,
      icon: 'shield',
      order: 100,
      permissions: ['admin'],
    });
  }

  // Add external link
  routes.push({
    label: 'Documentation',
    path: 'https://docs.example.com',
    icon: 'external-link',
    order: 999,
    external: true,
  });

  navigation.registerRoutes(routes);

  // Render the app
  root = createRoot(container);
  root.render(<App {...props} />);
}

export async function unmount(props: MfeProps) {
  // Clean up registered routes
  props.navigation.unregisterRoutes();

  if (root) {
    root.unmount();
    root = null;
  }
}
```

**Best for:**
- Permission-based routes (admin sections)
- Data-driven routes (user's projects, dynamic entities)
- External links
- Routes that change based on feature flags

### Combining Static and Dynamic

You can use both approaches together:

1. **Static (manifest)**: Core pages that always exist
2. **Dynamic (runtime)**: Additional pages based on context

The shell merges them, with dynamic routes taking precedence for the same path.

```typescript
// Shell merges navigation sources
function getMergedNavigation(mfe: MfeRegistration): MfeRoute[] {
  const staticRoutes = mfe.menu?.children ?? [];
  const dynamicRoutes = dynamicRouteRegistry.get(mfe.id) ?? [];

  // Dynamic routes override static routes with same path
  const routeMap = new Map<string, MfeRoute>();

  for (const route of staticRoutes) {
    routeMap.set(route.path, route);
  }
  for (const route of dynamicRoutes) {
    routeMap.set(route.path, route);
  }

  return Array.from(routeMap.values()).sort((a, b) =>
    (a.order ?? 0) - (b.order ?? 0)
  );
}
```

### Listening to Navigation Changes

MFEs can listen for navigation events to sync internal router state:

```typescript
// In MFE component
useEffect(() => {
  const unsubscribe = props.eventBus.on('navigation:changed', ({ path }) => {
    // Sync internal router if needed
    if (path.startsWith(props.basePath)) {
      const internalPath = path.slice(props.basePath.length) || '/';
      internalRouter.navigate(internalPath);
    }
  });

  return unsubscribe;
}, []);
```

### Navigation Events

| Event | Payload | Description |
|-------|---------|-------------|
| `navigation:changed` | `{ path: string, mfeId: string }` | User navigated to a new path |
| `navigation:routes-registered` | `{ mfeId: string, routes: MfeRoute[] }` | MFE registered new routes |
| `navigation:routes-unregistered` | `{ mfeId: string }` | MFE removed its routes |

---

## Development Workflow

### Running Locally

```bash
# Start all services
npm run dev

# Or individually:
cd shell && npm run dev          # Shell on :5000
cd mfes/react-example && npm run dev    # React MFE on :5001
cd mfes/vue-example && npm run dev      # Vue MFE on :5002
```

### Standalone MFE Development

Each MFE can run independently without the shell:

```bash
cd mfes/react-example
npm run dev:standalone
```

This loads a minimal wrapper that mocks the shell context.

### Building for Production

```bash
# Build all
npm run build

# Outputs:
# dist/
#   shell/
#   mfes/react-example/
#   mfes/vue-example/
#   ...
```

---

## Error Handling

### MFE Load Failures

The shell gracefully handles MFE failures:

1. **Network error** - Show retry button
2. **JavaScript error** - Show error boundary, don't crash shell
3. **Timeout** - Show timeout message after 10 seconds

### Error Boundary

```svelte
<!-- ErrorBoundary.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    children: any;
    fallback?: any;
  }

  let { children, fallback }: Props = $props();
  let hasError = $state(false);
  let errorMessage = $state('');

  // Svelte 5 error boundary using $effect
  $effect(() => {
    const handleError = (event: ErrorEvent) => {
      hasError = true;
      errorMessage = event.message;
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  });
</script>

{#if hasError}
  {#if fallback}
    {@render fallback()}
  {:else}
    <div class="error-boundary">
      <h2>Something went wrong</h2>
      <p>{errorMessage}</p>
      <button onclick={() => window.location.reload()}>Reload</button>
    </div>
  {/if}
{:else}
  {@render children()}
{/if}
```

---

## Performance

### Loading Optimization

```typescript
// Preload MFE on hover
function preloadMfe(mfe: MfeRegistration) {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = mfe.entry;
  document.head.appendChild(link);
}
```

### Caching Strategy

| Resource | Cache Strategy |
|----------|----------------|
| Shell HTML | `no-cache` |
| Shell JS (hashed) | `immutable, max-age=31536000` |
| MFE bundles (versioned) | `immutable, max-age=31536000` |
| manifest.json | `max-age=300` or `no-cache` |

---

## Security

### Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://api.example.com;
```

### Token Handling

- Shell manages auth tokens
- Tokens passed to MFEs via props (not globals)
- MFEs should not store tokens in localStorage
- Use HttpOnly cookies for API authentication when possible

---

## MFE Loading & Deployment

### How MFEs Are Loaded

The shell dynamically loads MFEs at runtime using the manifest `entry` URL:

```
1. User navigates to /react
2. Shell matches route → finds "react-example" MFE in manifest
3. Shell fetches: GET {entry}/remoteEntry.js
4. Shell imports the module and calls bootstrap() → mount()
5. MFE renders into the container
```

### Production: Kubernetes Route-Based Loading

In production, MFEs are deployed as independent services behind a single ingress. The shell and all MFEs share the same origin, with Kubernetes routing requests to the appropriate service based on URL path:

```
                         ┌─────────────────────┐
                         │   Ingress (nginx)   │
                         │   app.example.com   │
                         └──────────┬──────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
            ▼                       ▼                       ▼
    /shell/*               /mfes/dashboard/*        /mfes/settings/*
            │                       │                       │
            ▼                       ▼                       ▼
   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
   │  Shell Service  │    │ Dashboard MFE   │    │ Settings MFE    │
   │  (Svelte)       │    │ (React)         │    │ (Vue)           │
   │                 │    │                 │    │                 │
   │  ClusterIP:80   │    │  ClusterIP:80   │    │  ClusterIP:80   │
   └─────────────────┘    └─────────────────┘    └─────────────────┘
```

**Ingress Configuration:**

```yaml
# kubernetes/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: micro-ui-ingress
spec:
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /mfes/dashboard
            pathType: Prefix
            backend:
              service:
                name: dashboard-mfe
                port:
                  number: 80
          - path: /mfes/settings
            pathType: Prefix
            backend:
              service:
                name: settings-mfe
                port:
                  number: 80
          - path: /
            pathType: Prefix
            backend:
              service:
                name: shell
                port:
                  number: 80
```

**Manifest for Kubernetes:**

```json
{
  "version": "1.0.0",
  "mfes": [
    {
      "id": "dashboard",
      "name": "Dashboard",
      "entry": "/mfes/dashboard/remoteEntry.js",
      "route": "/dashboard"
    },
    {
      "id": "settings",
      "name": "Settings",
      "entry": "/mfes/settings/remoteEntry.js",
      "route": "/settings"
    }
  ]
}
```

All requests go through the same origin—no CORS configuration needed.

### Local Development: Port-Based Override

For local development, each MFE runs on a different port. The manifest uses absolute URLs pointing to localhost:

```json
{
  "version": "1.0.0-dev",
  "mfes": [
    {
      "id": "dashboard",
      "name": "Dashboard",
      "entry": "http://localhost:5001/remoteEntry.js",
      "route": "/dashboard"
    },
    {
      "id": "settings",
      "name": "Settings",
      "entry": "http://localhost:5002/remoteEntry.js",
      "route": "/settings"
    }
  ]
}
```

**Local dev setup:**

```bash
# Terminal 1: Shell on port 5000
cd shell && npm run dev -- --port 5000

# Terminal 2: Dashboard MFE on port 5001
cd mfes/dashboard && npm run dev -- --port 5001

# Terminal 3: Settings MFE on port 5002
cd mfes/settings && npm run dev -- --port 5002
```

**Switching manifests:**

```typescript
// shell/src/lib/manifest.ts
const MANIFEST_URL = import.meta.env.DEV
  ? '/manifest.dev.json'    // localhost URLs
  : '/manifest.json';       // relative paths for k8s

export async function loadManifest(): Promise<MfeManifest> {
  const response = await fetch(MANIFEST_URL);
  return response.json();
}
```

### Dynamic Manifest (Alternative)

For larger deployments, the manifest can be fetched from a service registry instead of a static file:

```typescript
// shell/src/lib/manifest.ts
export async function loadManifest(): Promise<MfeManifest> {
  // Static file (used in this example)
  if (import.meta.env.VITE_MANIFEST_MODE === 'static') {
    return fetch('/manifest.json').then(r => r.json());
  }

  // Dynamic: fetch from service registry
  const response = await fetch('https://registry.example.com/api/mfes');
  return response.json();

  // Dynamic: aggregate from each service
  // Each MFE exposes its own manifest fragment
  const services = ['dashboard', 'settings', 'reports'];
  const mfes = await Promise.all(
    services.map(async (name) => {
      const res = await fetch(`/mfes/${name}/mfe.json`);
      return res.json();
    })
  );
  return { version: '1.0.0', mfes };
}
```

**When to use dynamic manifest:**
- Many MFEs with frequent additions/removals
- Feature flags controlling MFE availability
- Multi-tenant deployments with different MFE sets
- Canary deployments with gradual rollout

**This example uses static manifest** for simplicity and debuggability.

### The remoteEntry.js File

Native Federation generates a `remoteEntry.js` file that:

1. Declares what the MFE exports (lifecycle functions)
2. Sets up shared dependency resolution (React, Vue, etc.)
3. Provides dynamic imports for the actual app chunks

```javascript
// Simplified view of what remoteEntry.js does
globalThis["dashboard"] = {
  async get(module) {
    if (module === "./lifecycle") {
      return import("./lifecycle-abc123.js");
    }
  },
  init(sharedScope) {
    // Register shared dependencies to avoid duplicates
  }
};
```

The shell imports this and calls the lifecycle functions without bundling the MFE code.

---

## References

- [shell-framework-decision.md](./shell-framework-decision.md) - Why Svelte for the shell
- [mfe-registration-patterns.md](./mfe-registration-patterns.md) - Registration pattern options
- [Native Federation](https://github.com/manfredsteyer/native-federation-core-microfrontend)
- [Svelte 5 Documentation](https://svelte.dev/)
- [Micro Frontends (martinfowler.com)](https://martinfowler.com/articles/micro-frontends.html)
