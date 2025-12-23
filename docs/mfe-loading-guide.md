# MFE Loading Guide

This document explains how micro-frontends (MFEs) are loaded into the shell and what requirements an MFE must meet to be compatible.

## Overview

The shell uses a federation-style approach to dynamically load MFEs at runtime. Each MFE is a standalone JavaScript module that exports lifecycle functions. The shell orchestrates loading, mounting, and unmounting MFEs based on route changes.

## Loading Flow

```
1. User navigates to /react
         │
         ▼
2. Shell matches route to MFE in manifest.json
         │
         ▼
3. Shell loads CSS file (if exists)
   GET /mfes/react-example/remoteEntry.css
         │
         ▼
4. Shell dynamically imports JS module
   import('/mfes/react-example/remoteEntry.js')
         │
         ▼
5. Shell calls bootstrap(props) - once per MFE lifetime
         │
         ▼
6. Shell calls mount(props) - renders into container
         │
         ▼
7. User navigates away
         │
         ▼
8. Shell calls unmount(props) - cleanup
         │
         ▼
9. Shell removes CSS stylesheet
```

## MFE Requirements

### 1. Lifecycle Exports

Every MFE must export these three functions from its entry point:

```typescript
// Required lifecycle functions
export async function bootstrap(props: MfeProps): Promise<void>;
export async function mount(props: MfeProps): Promise<void>;
export async function unmount(props: MfeProps): Promise<void>;
```

#### bootstrap(props)
- Called **once** when the MFE is first loaded
- Use for one-time initialization (e.g., setting up global state)
- The module is cached after bootstrap, so this won't run again

#### mount(props)
- Called **every time** the MFE should render
- Receives a container element to render into
- Must render the MFE's UI into `props.container`

#### unmount(props)
- Called **every time** the user navigates away
- Must clean up all DOM elements, event listeners, and subscriptions
- Failure to clean up causes memory leaks and stale UI

### 2. Props Interface

The shell provides these props to all lifecycle functions:

```typescript
interface MfeProps {
  container: HTMLElement;      // DOM element to render into
  basePath: string;            // Base route (e.g., "/react")
  auth: AuthContext;           // Authentication state
  eventBus: EventBus;          // Cross-MFE communication
  navigate: (path: string) => void;  // Shell navigation
  theme: 'light' | 'dark';     // Current theme
  navigation: NavigationApi;   // Route registration
  cache: MfeCache;             // Persistent state cache
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
```

### 3. Bundle Format

The MFE must be bundled as an ES module with a single entry point:

```javascript
// vite.config.ts example
export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],           // ES module format
      fileName: 'remoteEntry',
    },
    rollupOptions: {
      output: {
        entryFileNames: 'remoteEntry.js',
      },
    },
  },
});
```

### 4. Manifest Registration

Register the MFE in `shell/public/manifest.json`:

```json
{
  "id": "my-mfe",
  "name": "My MFE",
  "entry": "/mfes/my-mfe/remoteEntry.js",
  "route": "/my-mfe",
  "menu": {
    "label": "My MFE",
    "icon": "🚀",
    "order": 1
  }
}
```

For development, also add to `shell/public/manifest.dev.json` with absolute URL:

```json
{
  "id": "my-mfe",
  "name": "My MFE",
  "entry": "http://localhost:5006/remoteEntry.js",
  "route": "/my-mfe",
  "menu": {
    "label": "My MFE",
    "icon": "🚀",
    "order": 1
  }
}
```

## Framework-Specific Implementation

### React

```typescript
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import App from './App';

let root: Root | null = null;

export async function bootstrap(): Promise<void> {
  console.log('[React MFE] Bootstrap');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, auth, eventBus, navigate, basePath } = props;

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

export async function unmount(): Promise<void> {
  if (root) {
    root.unmount();
    root = null;
  }
}
```

### Vue

```typescript
import { createApp, App as VueApp } from 'vue';
import App from './App.vue';

let app: VueApp | null = null;

export async function bootstrap(): Promise<void> {
  console.log('[Vue MFE] Bootstrap');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, auth, eventBus, navigate, basePath } = props;

  app = createApp(App, { auth, eventBus, navigate, basePath });
  app.mount(container);
}

export async function unmount(): Promise<void> {
  if (app) {
    app.unmount();
    app = null;
  }
}
```

### Svelte (v5)

```typescript
import App from './App.svelte';
import { mount as svelteMount, unmount as svelteUnmount } from 'svelte';

let app: Record<string, unknown> | null = null;

export async function bootstrap(): Promise<void> {
  console.log('[Svelte MFE] Bootstrap');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, auth, eventBus, navigate, basePath } = props;

  app = svelteMount(App, {
    target: container,
    props: { auth, eventBus, navigate, basePath },
  });
}

export async function unmount(): Promise<void> {
  if (app) {
    svelteUnmount(app);
    app = null;
  }
}
```

### SolidJS

```typescript
import { render } from 'solid-js/web';
import App from './App';

let dispose: (() => void) | null = null;

export async function bootstrap(): Promise<void> {
  console.log('[Solid MFE] Bootstrap');
}

export async function mount(props: MfeProps): Promise<void> {
  const { container, auth, eventBus, navigate, basePath } = props;

  dispose = render(
    () => <App auth={auth} eventBus={eventBus} navigate={navigate} basePath={basePath} />,
    container
  );
}

export async function unmount(): Promise<void> {
  if (dispose) {
    dispose();
    dispose = null;
  }
}
```

### Angular

Angular requires a different approach since it bootstraps an entire application:

```typescript
import { createApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { ApplicationRef } from '@angular/core';
import { AppComponent } from './app/app.component';

let appRef: ApplicationRef | null = null;

export async function bootstrap(): Promise<void> {
  console.log('[Angular MFE] Bootstrap');
}

export async function mount(props: MfeProps): Promise<void> {
  // Store props globally for Angular components to access
  (window as any).__MFE_PROPS__ = props;

  const app = await createApplication(appConfig);
  appRef = app;

  const root = document.createElement('app-root');
  props.container.appendChild(root);

  app.bootstrap(AppComponent);
}

export async function unmount(): Promise<void> {
  if (appRef) {
    appRef.destroy();
    appRef = null;
  }
}
```

## CSS Handling

### How CSS is Loaded

The shell automatically loads CSS files that match the MFE entry point:

1. If entry is `/mfes/my-mfe/remoteEntry.js`
2. Shell checks for `/mfes/my-mfe/remoteEntry.css`
3. If found, creates a `<link>` tag in `<head>`
4. On unmount, the stylesheet is removed

### CSS Best Practices

1. **Scope your styles** - Use CSS modules, scoped styles, or CSS-in-JS to prevent conflicts

2. **Avoid global styles** - Don't modify `body`, `html`, or other global elements

3. **Use the container** - Style relative to the container element, not the page

4. **Clean up dynamic styles** - If you inject styles at runtime, remove them on unmount

### Framework CSS Handling

| Framework | Recommended Approach |
|-----------|---------------------|
| React | CSS Modules, styled-components, or Tailwind |
| Vue | Scoped styles (`<style scoped>`) |
| Svelte | Component styles (scoped by default) |
| SolidJS | CSS Modules or solid-styled-components |
| Angular | Component styles (encapsulated by default) |

## Auth State Synchronization

MFEs receive initial auth state via props, but should also listen for changes:

```typescript
export async function mount(props: MfeProps): Promise<void> {
  const { eventBus, auth } = props;

  // Initial auth state
  let currentAuth = auth;

  // Listen for auth changes from shell
  const unsubscribe = eventBus.on('auth:changed', (payload) => {
    currentAuth = payload as AuthContext;
    // Update your app's auth state
  });

  // Store unsubscribe for cleanup
}

export async function unmount(props: MfeProps): Promise<void> {
  // Call unsubscribe in cleanup
}
```

## Event Bus Communication

MFEs can communicate with each other via the event bus:

```typescript
// Emit an event
eventBus.emit('notification:show', {
  message: 'Hello from React MFE!'
});

// Listen for events
const unsubscribe = eventBus.on('notification:show', (payload) => {
  console.log('Received:', payload);
});

// Clean up on unmount
unsubscribe();
```

## Common Patterns

### Preserving State Across Remounts

Use the cache API to persist state when users navigate away and back:

```typescript
export async function mount(props: MfeProps): Promise<void> {
  const { cache } = props;

  // Restore previous state
  const savedState = cache.get<MyState>('my-state');

  // ... render with savedState or default
}

export async function unmount(props: MfeProps): Promise<void> {
  const { cache } = props;

  // Save state before unmount
  cache.set('my-state', currentState);
}
```

### Registering Sub-Routes

MFEs can register their own navigation items:

```typescript
export async function mount(props: MfeProps): Promise<void> {
  const { navigation, basePath } = props;

  navigation.registerRoutes([
    { label: 'Overview', path: basePath, icon: '🏠' },
    { label: 'Settings', path: `${basePath}/settings`, icon: '⚙️' },
    { label: 'Reports', path: `${basePath}/reports`, icon: '📊' },
  ]);
}

export async function unmount(props: MfeProps): Promise<void> {
  props.navigation.unregisterRoutes();
}
```

## Troubleshooting

### MFE fails to load
- Check browser console for import errors
- Verify the entry path in manifest.json matches the build output
- Ensure CORS is enabled on the MFE server (for dev mode)

### CSS missing on remount
- The shell handles this automatically
- If using CSS-in-JS, ensure styles are injected on each mount

### Memory leaks
- Always clean up event listeners in unmount
- Clear intervals/timeouts
- Unsubscribe from observables

### Auth state not updating
- Subscribe to `auth:changed` events on the event bus
- Don't rely solely on initial props

## File Structure Example

```
mfes/my-mfe/
├── src/
│   ├── main.ts          # Entry point with lifecycle exports
│   ├── App.tsx          # Root component
│   └── components/
├── dist/
│   ├── remoteEntry.js   # Built entry point
│   └── remoteEntry.css  # Extracted styles (if any)
├── package.json
├── vite.config.ts
└── tsconfig.json
```
