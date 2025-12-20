# State Management Patterns

## Overview

This document explores state management strategies for micro-frontend architectures. It covers the lifecycle of MFE state, cross-MFE shared state, and caching strategies.

The key challenge: **MFEs mount and unmount as users navigate, but state expectations vary.**

---

## The State Lifecycle Problem

When a user navigates between MFEs:

```
User on /dashboard (React MFE)
  → Local store has: filters, scroll position, draft data

User clicks /settings (Vue MFE)
  → Dashboard MFE unmounts
  → What happens to filters? Draft data?

User returns to /dashboard
  → Dashboard MFE mounts fresh
  → Is their work preserved or lost?
```

Different applications need different answers. This document presents the options.

---

## State Categories

Not all state is equal. Categorizing state helps determine the right strategy:

| Category | Examples | Typical Strategy |
|----------|----------|------------------|
| **Ephemeral** | Hover states, dropdown open, tooltips | Destroy on unmount |
| **View State** | Scroll position, tab selection, filters | Cache with TTL |
| **Draft Data** | Unsaved forms, partially completed wizards | Persist or warn user |
| **Shared** | User profile, theme, cart, notifications | Shell-level store |
| **Server Cache** | API responses, entity data | Query cache (React Query, etc.) |

---

## Pattern 1: Clean Slate (Destroy on Unmount)

### Description

Each MFE is fully independent. When it unmounts, all state is destroyed.

```typescript
// MFE store is scoped to component tree
export async function mount(props: MfeProps) {
  const store = createStore(); // Fresh store
  root = createRoot(container);
  root.render(<App store={store} />);
}

export async function unmount(props: MfeProps) {
  root.unmount();
  root = null;
  // Store is garbage collected
}
```

### Pros
- Simple mental model
- No memory leaks
- True isolation
- Predictable behavior

### Cons
- Poor UX for stateful workflows
- Users lose scroll position, filters, drafts
- Feels "broken" for SPA-like expectations

### Best For
- Stateless MFEs
- Read-only dashboards
- Simple CRUD operations
- MFEs that are rarely revisited

---

## Pattern 2: Module-Level Singleton (Persist Across Navigation)

### Description

Store is created at module level, surviving mount/unmount cycles.

```typescript
// store.ts - Created once, persists across mount/unmount
import { create } from 'zustand';

export const useStore = create((set) => ({
  filters: { status: 'all', search: '' },
  scrollPosition: 0,
  setFilters: (filters) => set({ filters }),
  setScrollPosition: (pos) => set({ scrollPosition: pos }),
}));

// main.tsx
export async function mount(props: MfeProps) {
  // Store already exists with previous state
  root = createRoot(container);
  root.render(<App />);
}

export async function unmount(props: MfeProps) {
  // Store survives!
  root.unmount();
  root = null;
}
```

### Pros
- Seamless UX when returning to MFE
- No explicit cache management
- Simple implementation

### Cons
- Memory grows with each MFE loaded
- No TTL or eviction
- Store exists even if MFE won't be revisited
- Side effects (subscriptions, timers) may leak

### Best For
- Core MFEs that users frequently navigate between
- MFEs with significant view state
- Applications with predictable MFE usage patterns

### Caution: Side Effect Cleanup

Even if store persists, side effects must be cleaned:

```typescript
// Dangerous: interval keeps running after unmount
useEffect(() => {
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval); // MUST clean up
}, []);
```

---

## Pattern 3: Shell-Provided Cache (Explicit Persistence)

### Description

Shell provides a cache API. MFEs explicitly save/restore state on mount/unmount.

```typescript
interface MfeProps {
  cache: {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T, options?: CacheOptions) => void;
    clear: () => void;
  };
}

interface CacheOptions {
  ttl?: number;        // Time-to-live in milliseconds
  version?: number;    // Schema version for migration
}
```

### MFE Implementation

```typescript
export async function mount(props: MfeProps) {
  const { container, cache } = props;

  // Restore cached state if available
  const cached = cache.get<DashboardState>('dashboard-state');

  const store = createStore(cached ?? getDefaultState());

  root = createRoot(container);
  root.render(<App store={store} />);
}

export async function unmount(props: MfeProps) {
  const { cache } = props;

  // Persist state before unmounting
  const state = store.getState();
  cache.set('dashboard-state', {
    filters: state.filters,
    scrollPosition: state.scrollPosition,
    // Don't cache ephemeral state like hover/focus
  }, { ttl: 5 * 60 * 1000 }); // 5 minutes

  root.unmount();
  root = null;
}
```

### Shell Cache Implementation

```typescript
// shell/src/lib/stateCache.svelte.ts
interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  version?: number;
}

class StateCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 50; // Limit number of entries

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
    // Enforce size limit (LRU eviction)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: options?.ttl ? Date.now() + options.ttl : null,
      version: options?.version,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear all entries for a specific MFE
  clearMfe(mfeId: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${mfeId}:`)) {
        this.cache.delete(key);
      }
    }
  }
}

export const stateCache = new StateCache();
```

### Pros
- Shell controls memory usage (size limits, TTL)
- MFEs opt-in to caching
- Explicit about what's cached
- Version support for schema migrations

### Cons
- More code in MFEs
- Must serialize state (no functions, circular refs)
- MFEs must handle cache miss gracefully

### Best For
- Applications with memory constraints
- MFEs with varying state persistence needs
- Complex state that needs version management

---

## Pattern 4: Shared State Layer (Cross-MFE State)

### Description

State that spans multiple MFEs lives in the shell. MFEs read from and write to shared stores.

### State Ownership

```
┌─────────────────────────────────────────────────────────────────┐
│  Shell - Owns Shared State                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  • User profile & roles                                    │  │
│  │  • Theme (dark/light)                                      │  │
│  │  • Global settings                                         │  │
│  │  • Notifications                                           │  │
│  │  • Cart / shared business data                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │  React MFE          │    │  Vue MFE            │            │
│  │  ┌───────────────┐  │    │  ┌───────────────┐  │            │
│  │  │ Local State   │  │    │  │ Pinia Store   │  │            │
│  │  │ (filters, UI) │  │    │  │ (local only)  │  │            │
│  │  └───────────────┘  │    │  └───────────────┘  │            │
│  └─────────────────────┘    └─────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Framework-Agnostic Approach: Nanostores

[Nanostores](https://github.com/nanostores/nanostores) provides tiny (~300 bytes), framework-agnostic stores:

```typescript
// shell/src/lib/sharedState.ts
import { atom, map, computed } from 'nanostores';

// User & Auth
export const $user = atom<User | null>(null);
export const $isAuthenticated = computed($user, user => user !== null);

// Theme
export const $theme = atom<'light' | 'dark'>('light');

// Notifications
export const $notifications = atom<Notification[]>([]);

// Cart (example of shared business data)
export const $cart = map<CartState>({
  items: [],
  total: 0,
});

// Settings
export const $settings = map<Settings>({
  language: 'en',
  timezone: 'UTC',
  currency: 'USD',
});
```

### Usage in React MFE

```tsx
// Using @nanostores/react
import { useStore } from '@nanostores/react';
import { $user, $theme, $cart } from '@shell/sharedState';

function Header() {
  const user = useStore($user);
  const theme = useStore($theme);
  const cart = useStore($cart);

  return (
    <header className={theme}>
      <span>Welcome, {user?.name}</span>
      <span>Cart: {cart.items.length} items</span>
    </header>
  );
}

// Writing to shared state
import { $cart } from '@shell/sharedState';

function addToCart(item: CartItem) {
  const current = $cart.get();
  $cart.set({
    items: [...current.items, item],
    total: current.total + item.price,
  });
}
```

### Usage in Vue MFE

```vue
<script setup>
// Using @nanostores/vue
import { useStore } from '@nanostores/vue';
import { $user, $theme, $cart } from '@shell/sharedState';

const user = useStore($user);
const theme = useStore($theme);
const cart = useStore($cart);

function addToCart(item) {
  const current = $cart.get();
  $cart.set({
    items: [...current.items, item],
    total: current.total + item.price,
  });
}
</script>

<template>
  <header :class="theme">
    <span>Welcome, {{ user?.name }}</span>
    <span>Cart: {{ cart.items.length }} items</span>
  </header>
</template>
```

### Usage in Svelte MFE

```svelte
<script>
  // Nanostores work natively with Svelte's $ syntax
  import { $user, $theme, $cart } from '@shell/sharedState';
</script>

<header class={$theme}>
  <span>Welcome, {$user?.name}</span>
  <span>Cart: {$cart.items.length} items</span>
</header>
```

### Usage in SolidJS MFE

```tsx
// Using @nanostores/solid
import { useStore } from '@nanostores/solid';
import { $user, $theme, $cart } from '@shell/sharedState';

function Header() {
  const user = useStore($user);
  const theme = useStore($theme);
  const cart = useStore($cart);

  return (
    <header class={theme()}>
      <span>Welcome, {user()?.name}</span>
      <span>Cart: {cart().items.length} items</span>
    </header>
  );
}
```

### Pros
- True cross-MFE reactivity
- Framework-agnostic
- No serialization needed
- Small bundle size (~300 bytes)
- Shell controls lifecycle

### Cons
- Another dependency for MFEs
- Must define shared state upfront
- Potential for MFEs to conflict on shared writes

### Best For
- User authentication state
- Theme and preferences
- Shopping cart
- Notifications
- Any state multiple MFEs need to read/write

---

## Pattern 5: Hybrid Approach (Recommended)

### Description

Combine patterns based on state category:

| State Category | Strategy | Implementation |
|----------------|----------|----------------|
| **Shared** | Shell nanostores | `$user`, `$theme`, `$cart` |
| **View State** | Shell cache with TTL | `cache.set('mfe:filters', ...)` |
| **Local** | MFE-owned stores | Pinia, Zustand, etc. (destroyed on unmount) |
| **Ephemeral** | Component state | React useState, Vue ref (destroyed on unmount) |

### MfeProps Interface

```typescript
interface MfeProps {
  // ... existing props (container, auth, eventBus, navigate, navigation)

  // State cache for MFE-specific persistence
  cache: {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T, options?: CacheOptions) => void;
    clear: () => void;
  };

  // Shared state atoms (read/write)
  shared: {
    user: WritableAtom<User | null>;
    theme: WritableAtom<'light' | 'dark'>;
    settings: MapStore<Settings>;
    notifications: WritableAtom<Notification[]>;
    cart: MapStore<CartState>;
  };
}

interface CacheOptions {
  ttl?: number;       // Time-to-live in ms (default: 5 minutes)
  version?: number;   // For schema migration
}
```

### Complete MFE Example

```typescript
// mfes/react-example/src/main.tsx
import { createRoot } from 'react-dom/client';
import { create } from 'zustand';
import App from './App';
import type { MfeProps } from '@micro-ui/types';

let root = null;
let store = null;

// Local store type
interface DashboardState {
  filters: FilterState;
  scrollPosition: number;
  expandedPanels: string[];
}

export async function mount(props: MfeProps) {
  const { container, cache, shared } = props;

  // 1. Restore cached view state
  const cached = cache.get<Partial<DashboardState>>('dashboard-view');

  // 2. Create local store with cached or default state
  store = create<DashboardState>((set) => ({
    filters: cached?.filters ?? { status: 'all', search: '' },
    scrollPosition: cached?.scrollPosition ?? 0,
    expandedPanels: cached?.expandedPanels ?? [],
    setFilters: (filters) => set({ filters }),
    setScrollPosition: (pos) => set({ scrollPosition: pos }),
  }));

  // 3. Render with access to shared state
  root = createRoot(container);
  root.render(<App store={store} shared={shared} />);

  // 4. Restore scroll position after render
  if (cached?.scrollPosition) {
    requestAnimationFrame(() => {
      window.scrollTo(0, cached.scrollPosition);
    });
  }
}

export async function unmount(props: MfeProps) {
  const { cache } = props;

  // Cache view state before unmount
  if (store) {
    const state = store.getState();
    cache.set('dashboard-view', {
      filters: state.filters,
      scrollPosition: window.scrollY,
      expandedPanels: state.expandedPanels,
    }, { ttl: 10 * 60 * 1000 }); // 10 minutes
  }

  // Clean up
  root?.unmount();
  root = null;
  store = null;
}
```

### App Component Using Shared State

```tsx
// mfes/react-example/src/App.tsx
import { useStore } from '@nanostores/react';
import type { SharedState } from '@micro-ui/types';

interface AppProps {
  store: DashboardStore;
  shared: SharedState;
}

function App({ store, shared }: AppProps) {
  // Local state (from MFE store)
  const filters = store((s) => s.filters);

  // Shared state (from shell)
  const user = useStore(shared.user);
  const theme = useStore(shared.theme);
  const cart = useStore(shared.cart);

  const addToCart = (item: CartItem) => {
    const current = shared.cart.get();
    shared.cart.set({
      items: [...current.items, item],
      total: current.total + item.price,
    });
  };

  return (
    <div className={`dashboard theme-${theme}`}>
      <h1>Welcome, {user?.name}</h1>
      <p>Cart has {cart.items.length} items</p>
      <FilterPanel filters={filters} onChange={store.getState().setFilters} />
      <ProductList onAddToCart={addToCart} />
    </div>
  );
}
```

---

## Considerations and Pitfalls

### 1. Memory Leaks

Persisted stores can hold references that prevent garbage collection:

```typescript
// Dangerous: Closure over large data
const store = create((set) => ({
  results: largeDataArray, // May not be GC'd if store persists
}));
```

**Mitigation**: Clear large data explicitly, use weak references where possible.

### 2. Stale State

Cached state may become invalid:

```typescript
// Cached 30 minutes ago
const filters = cache.get('filters');
// Server data has changed, filters reference deleted entities
```

**Mitigation**:
- Use reasonable TTLs
- Validate cached state on restore
- Include version numbers for schema changes

### 3. Schema Migration

MFE v1 saves state, MFE v2 has different schema:

```typescript
// v1 saved: { filter: 'active' }
// v2 expects: { filters: ['active'] }
```

**Mitigation**: Version your cache entries:

```typescript
const CACHE_VERSION = 2;

// Saving
cache.set('dashboard-state', state, { version: CACHE_VERSION });

// Restoring
const cached = cache.get('dashboard-state');
if (cached?.version !== CACHE_VERSION) {
  // Migrate or discard
  cache.clear();
}
```

### 4. Cross-MFE State Conflicts

Multiple MFEs writing to same shared state:

```typescript
// Products MFE adds item
shared.cart.set({ ...cart, items: [...items, product] });

// Cart MFE removes item (race condition!)
shared.cart.set({ ...cart, items: items.filter(i => i.id !== id) });
```

**Mitigation**:
- Use actions/methods instead of direct sets
- Implement optimistic locking
- Designate clear ownership

```typescript
// Better: Actions that handle concurrency
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
```

### 5. Hydration Timing

Shared state may not be ready when MFE mounts:

```typescript
export async function mount(props: MfeProps) {
  const user = props.shared.user.get();
  // user might be null during initial auth check
}
```

**Mitigation**: Handle loading states, subscribe to changes:

```tsx
function App({ shared }: AppProps) {
  const user = useStore(shared.user);

  if (user === undefined) {
    return <Loading />;
  }

  if (user === null) {
    return <LoginPrompt />;
  }

  return <Dashboard user={user} />;
}
```

### 6. Testing Challenges

Shared state complicates MFE testing:

**Mitigation**: Provide mock shared state for tests:

```typescript
// test-utils.ts
export function createMockSharedState(): SharedState {
  return {
    user: atom({ id: '1', name: 'Test User' }),
    theme: atom('light'),
    cart: map({ items: [], total: 0 }),
    // ...
  };
}

// In test
const mockShared = createMockSharedState();
render(<App shared={mockShared} />);
```

---

## Decision Matrix

| Factor | Clean Slate | Singleton | Shell Cache | Shared State |
|--------|-------------|-----------|-------------|--------------|
| **Complexity** | Low | Low | Medium | Medium |
| **Memory Usage** | Lowest | Grows | Controlled | Controlled |
| **UX on Return** | Poor | Best | Good | N/A |
| **Cross-MFE** | No | No | No | Yes |
| **Isolation** | Full | Full | Full | Partial |
| **Best For** | Simple MFEs | Core MFEs | Complex state | Shared data |

---

## Recommendation

For this reference implementation:

1. **Shared State (nanostores)**: User, theme, settings, cart, notifications
2. **Shell Cache**: View state (filters, scroll, panel states) with 5-10 min TTL
3. **Local Stores**: Ephemeral UI state, destroyed on unmount
4. **Document All Patterns**: Let implementers choose based on their needs

This hybrid approach balances:
- Good UX (state persists where it matters)
- Memory efficiency (TTL, size limits)
- Framework flexibility (nanostores works everywhere)
- Simplicity (clear patterns for each state type)

---

## References

- [Nanostores](https://github.com/nanostores/nanostores) - Framework-agnostic state
- [Zustand](https://github.com/pmndrs/zustand) - React state management
- [Pinia](https://pinia.vuejs.org/) - Vue state management
- [Micro Frontends in Action](https://micro-frontends.org/) - State sharing patterns
