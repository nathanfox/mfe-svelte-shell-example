# Micro-Frontend Registration Patterns

## Overview

This document evaluates different approaches for how micro-frontends (MFEs) register with and are discovered by the shell application. The registration pattern affects deployment flexibility, development experience, and runtime behavior.

---

## The Registration Problem

The shell needs to answer these questions at runtime:

1. **What MFEs exist?** - Discovery of available micro-frontends
2. **Where are they?** - URLs to load MFE bundles from
3. **When to load them?** - Route matching / activation rules
4. **What do they need?** - Permissions, feature flags, shared dependencies
5. **How to display them?** - Menu placement, icons, labels

Different registration patterns solve these problems with different tradeoffs.

---

## Pattern 1: Static Manifest File

### Description

A JSON file lists all registered MFEs. The shell fetches this file at startup and uses it to configure routing and navigation.

```
┌─────────────────────────────────────────────────────────────┐
│                        CDN / Static Host                     │
├─────────────────────────────────────────────────────────────┤
│  /shell/                                                     │
│    └── index.html, main.js                                   │
│                                                              │
│  /registry/                                                  │
│    └── manifest.json  ◄── Shell fetches at startup          │
│                                                              │
│  /mfe/react-app/                                             │
│    └── remoteEntry.js                                        │
│  /mfe/vue-app/                                               │
│    └── remoteEntry.js                                        │
└─────────────────────────────────────────────────────────────┘
```

### Manifest Schema

```typescript
interface MfeManifest {
  mfes: MfeRegistration[];
  version: string;
  generatedAt: string;
}

interface MfeRegistration {
  // Identity
  id: string;                      // Unique identifier: "react-dashboard"
  name: string;                    // Display name: "Dashboard"

  // Loading
  entry: string;                   // URL to remoteEntry.js or ES module

  // Routing
  route: string;                   // Base route: "/dashboard"
  activeWhen?: string[];           // Additional activation paths

  // Menu
  menu?: {
    label: string;
    icon?: string;
    order?: number;
    section?: string;
  };

  // Access Control (optional)
  permissions?: string[];
  featureFlag?: string;
}
```

### Example manifest.json

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-01-15T10:30:00Z",
  "mfes": [
    {
      "id": "react-dashboard",
      "name": "Dashboard",
      "entry": "/mfe/react-dashboard/remoteEntry.js",
      "route": "/dashboard",
      "menu": {
        "label": "Dashboard",
        "icon": "home",
        "order": 1,
        "section": "main"
      }
    },
    {
      "id": "vue-settings",
      "name": "Settings",
      "entry": "/mfe/vue-settings/remoteEntry.js",
      "route": "/settings",
      "menu": {
        "label": "Settings",
        "icon": "cog",
        "order": 100,
        "section": "admin"
      },
      "permissions": ["admin"]
    },
    {
      "id": "angular-reports",
      "name": "Reports",
      "entry": "/mfe/angular-reports/remoteEntry.js",
      "route": "/reports",
      "activeWhen": ["/reports", "/analytics"],
      "menu": {
        "label": "Reports",
        "icon": "chart",
        "order": 2,
        "section": "main"
      }
    }
  ]
}
```

### Shell Integration (Svelte)

```svelte
<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';
  import { loadMfe, unloadMfe } from './federation.js';

  let manifest = $state(null);
  let activeMfe = $state(null);
  let loading = $state(true);
  let error = $state(null);

  onMount(async () => {
    try {
      const res = await fetch('/registry/manifest.json');
      manifest = await res.json();
      loading = false;

      // Initial route handling
      handleRoute(window.location.pathname);

      // Listen for navigation
      window.addEventListener('popstate', () => {
        handleRoute(window.location.pathname);
      });
    } catch (e) {
      error = e.message;
      loading = false;
    }
  });

  function handleRoute(path) {
    const mfe = manifest?.mfes.find(m =>
      path.startsWith(m.route) || m.activeWhen?.some(p => path.startsWith(p))
    );

    if (mfe && mfe.id !== activeMfe?.id) {
      loadMfe(mfe, document.getElementById('mfe-container'));
      activeMfe = mfe;
    }
  }
</script>
```

### Pros

| Advantage | Description |
|-----------|-------------|
| **Simple** | Just a JSON file, no backend required |
| **Fast** | Single HTTP request at startup |
| **Cacheable** | Can use CDN caching with versioned URLs |
| **Predictable** | No runtime surprises, what you deploy is what you get |
| **Debuggable** | Easy to inspect and understand |
| **Works offline** | Can be bundled with shell for offline-first apps |

### Cons

| Disadvantage | Description |
|--------------|-------------|
| **Deployment coupling** | Must update manifest when deploying new MFE |
| **No dynamic discovery** | New MFEs require manifest update + shell cache invalidation |
| **Stale data risk** | Cached manifest may reference old MFE versions |
| **Central bottleneck** | Single file that multiple teams need to update |

### Best For

- Example/reference implementations
- Small to medium applications (< 20 MFEs)
- Teams with coordinated deployment processes
- Environments where simplicity is valued over flexibility

---

## Pattern 2: Self-Registration at Runtime

### Description

MFEs register themselves with the shell when they load. The shell exposes a global registration API that MFEs call during their bootstrap phase.

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Runtime                         │
├─────────────────────────────────────────────────────────────┤
│  Shell loads first, exposes:                                 │
│    window.__MFE_SHELL__.register(config)                     │
│                                                              │
│  MFEs load via script tags or dynamic import:                │
│    1. react-app loads → calls register()                     │
│    2. vue-app loads → calls register()                       │
│    3. Shell updates menu & routes dynamically                │
└─────────────────────────────────────────────────────────────┘
```

### Shell Registration API

```typescript
// shell/src/registry.ts
interface MfeRegistration {
  id: string;
  name: string;
  route: string;
  mount: (container: HTMLElement, props: MfeProps) => Promise<void>;
  unmount: (container: HTMLElement) => Promise<void>;
  menu?: MenuConfig;
}

interface MfeProps {
  basePath: string;
  auth: AuthContext;
  eventBus: EventBus;
  navigate: (path: string) => void;
}

class MfeRegistry {
  private mfes = new Map<string, MfeRegistration>();
  private listeners = new Set<() => void>();

  register(config: MfeRegistration) {
    this.mfes.set(config.id, config);
    this.notifyListeners();
    console.log(`[Shell] MFE registered: ${config.id}`);
  }

  unregister(id: string) {
    this.mfes.delete(id);
    this.notifyListeners();
  }

  getAll(): MfeRegistration[] {
    return Array.from(this.mfes.values());
  }

  findByRoute(path: string): MfeRegistration | undefined {
    return this.getAll().find(mfe => path.startsWith(mfe.route));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn());
  }
}

// Expose globally for MFEs
const registry = new MfeRegistry();
window.__MFE_SHELL__ = {
  register: (config) => registry.register(config),
  unregister: (id) => registry.unregister(id),
  auth: authContext,
  eventBus: eventBus,
};

export { registry };
```

### MFE Self-Registration (React Example)

```typescript
// mfe-react/src/bootstrap.ts
import { createRoot } from 'react-dom/client';
import App from './App';

let root = null;

// Register with shell
if (window.__MFE_SHELL__) {
  window.__MFE_SHELL__.register({
    id: 'react-dashboard',
    name: 'Dashboard',
    route: '/dashboard',
    menu: {
      label: 'Dashboard',
      icon: 'home',
      order: 1,
    },

    async mount(container, props) {
      root = createRoot(container);
      root.render(<App {...props} />);
    },

    async unmount(container) {
      if (root) {
        root.unmount();
        root = null;
      }
    },
  });
}

// Also support standalone mode for development
if (!window.__MFE_SHELL__) {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
}
```

### Loading MFEs

The shell needs to know which scripts to load. Options:

**Option A: Hardcoded script list in shell**
```html
<!-- index.html -->
<script src="/mfe/react-dashboard/bundle.js" defer></script>
<script src="/mfe/vue-settings/bundle.js" defer></script>
```

**Option B: Minimal discovery manifest**
```json
{
  "scripts": [
    "/mfe/react-dashboard/bundle.js",
    "/mfe/vue-settings/bundle.js"
  ]
}
```

**Option C: Import maps (browser-native)**
```html
<script type="importmap">
{
  "imports": {
    "@mfe/react-dashboard": "/mfe/react-dashboard/main.js",
    "@mfe/vue-settings": "/mfe/vue-settings/main.js"
  }
}
</script>
```

### Pros

| Advantage | Description |
|-----------|-------------|
| **Decoupled deployment** | MFEs own their registration metadata |
| **Dynamic menu** | Menu builds itself as MFEs load |
| **MFE autonomy** | Teams control their own configuration |
| **Gradual loading** | MFEs can load on-demand, registering when ready |
| **Standalone dev** | MFEs can run independently without shell |

### Cons

| Disadvantage | Description |
|--------------|-------------|
| **Complexity** | More moving parts, harder to debug |
| **Race conditions** | Menu may flash/reorder as MFEs register |
| **Load order issues** | Route conflicts if MFEs load in different orders |
| **Slower initial load** | Must load MFE bundles before knowing routes |
| **Still need discovery** | Need some mechanism to know which scripts to load |

### Best For

- Large organizations with independent MFE teams
- Applications where MFEs are truly autonomous
- Plugin-style architectures
- Systems where MFEs may be enabled/disabled dynamically

---

## Pattern 3: Build-Time Discovery (Import Maps)

### Description

The shell discovers MFEs during the build process. An import map is generated that maps MFE identifiers to their bundle URLs. This is resolved at build time but used at runtime.

```
┌─────────────────────────────────────────────────────────────┐
│                        Build Time                            │
├─────────────────────────────────────────────────────────────┤
│  1. Each MFE publishes its manifest to a known location      │
│  2. Shell build process discovers all MFE manifests          │
│  3. Import map is generated and embedded in shell HTML       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Runtime                               │
├─────────────────────────────────────────────────────────────┤
│  Browser uses import map to resolve:                         │
│    import('@mfe/dashboard') → /mfe/dashboard/v1.2.3/main.js │
└─────────────────────────────────────────────────────────────┘
```

### Generated Import Map

```html
<!-- Generated by shell build process -->
<script type="importmap">
{
  "imports": {
    "@mfe/dashboard": "https://cdn.example.com/mfe/dashboard/v1.2.3/main.js",
    "@mfe/settings": "https://cdn.example.com/mfe/settings/v2.0.0/main.js",
    "@mfe/reports": "https://cdn.example.com/mfe/reports/v1.0.0/main.js",

    "react": "https://cdn.example.com/shared/react/18.2.0/react.production.js",
    "react-dom": "https://cdn.example.com/shared/react-dom/18.2.0/react-dom.production.js"
  }
}
</script>
```

### MFE Manifest (per MFE)

Each MFE publishes a small manifest that the shell build discovers:

```json
// https://cdn.example.com/mfe/dashboard/latest/mfe-manifest.json
{
  "id": "dashboard",
  "name": "Dashboard",
  "version": "1.2.3",
  "entry": "./main.js",
  "route": "/dashboard",
  "menu": {
    "label": "Dashboard",
    "icon": "home",
    "order": 1
  }
}
```

### Shell Build Script

```javascript
// scripts/generate-import-map.js
import { readFile, writeFile } from 'fs/promises';

const MFE_REGISTRY_URL = 'https://cdn.example.com/mfe';
const MFES = ['dashboard', 'settings', 'reports'];

async function generateImportMap() {
  const imports = {};
  const mfeConfigs = [];

  for (const mfeId of MFES) {
    // Fetch each MFE's manifest
    const manifestUrl = `${MFE_REGISTRY_URL}/${mfeId}/latest/mfe-manifest.json`;
    const res = await fetch(manifestUrl);
    const manifest = await res.json();

    // Add to import map
    const entryUrl = `${MFE_REGISTRY_URL}/${mfeId}/v${manifest.version}/${manifest.entry}`;
    imports[`@mfe/${mfeId}`] = entryUrl;

    // Collect configs for shell
    mfeConfigs.push({
      ...manifest,
      entry: `@mfe/${mfeId}`,
    });
  }

  // Write import map
  await writeFile('dist/importmap.json', JSON.stringify({ imports }, null, 2));

  // Write MFE config for shell runtime
  await writeFile('dist/mfe-config.json', JSON.stringify(mfeConfigs, null, 2));
}

generateImportMap();
```

### Pros

| Advantage | Description |
|-----------|-------------|
| **Browser-native** | Uses standard import maps, no custom loader |
| **Version locked** | Shell build pins exact MFE versions |
| **Shared dependencies** | Import map can dedupe React, Vue, etc. |
| **Type safety** | Can generate TypeScript types at build time |
| **Predictable** | What you build is what you ship |

### Cons

| Disadvantage | Description |
|--------------|-------------|
| **Requires shell rebuild** | New MFE version = rebuild & redeploy shell |
| **Build complexity** | Need custom build tooling |
| **Not fully dynamic** | Can't add new MFEs without shell rebuild |
| **Import map size** | Large apps = large import maps |

### Best For

- Applications prioritizing stability over flexibility
- Teams with unified CI/CD pipelines
- Projects using native ES modules
- Scenarios where shared dependency deduplication is critical

---

## Pattern 4: Registry Service

### Description

A backend service manages MFE registrations. MFEs register on deployment (via CI/CD), and the shell queries the registry at runtime.

```
┌─────────────────────────────────────────────────────────────┐
│                      Registry Service                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  POST /api/registry/mfes         - Register MFE         │ │
│  │  GET  /api/registry/mfes         - List all MFEs        │ │
│  │  GET  /api/registry/mfes/:id     - Get specific MFE     │ │
│  │  DEL  /api/registry/mfes/:id     - Unregister           │ │
│  │  GET  /api/registry/routes       - Get route config     │ │
│  │  GET  /api/registry/menu         - Get menu (filtered)  │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
           ▲                              ▲
           │                              │
    ┌──────┴──────┐              ┌────────┴────────┐
    │  CI/CD      │              │  Shell          │
    │  Pipeline   │              │  (runtime)      │
    │             │              │                 │
    │ On deploy:  │              │ On startup:     │
    │ POST /mfes  │              │ GET /mfes       │
    └─────────────┘              └─────────────────┘
```

### Registry API

```typescript
// Registry Service API
interface RegistryApi {
  // List all registered MFEs (with optional filtering)
  GET: '/api/registry/mfes'
    => { mfes: MfeRegistration[], version: string }

  // Register or update an MFE
  POST: '/api/registry/mfes'
    body: MfeRegistration
    => { success: boolean, id: string }

  // Get menu items (filtered by user permissions)
  GET: '/api/registry/menu?userId=:userId'
    => { sections: MenuSection[] }

  // Health check for specific MFE
  GET: '/api/registry/mfes/:id/health'
    => { healthy: boolean, lastCheck: string }
}

interface MfeRegistration {
  id: string;
  name: string;
  version: string;
  entry: string;
  route: string;
  menu?: MenuConfig;
  permissions?: string[];
  featureFlag?: string;
  healthEndpoint?: string;
  metadata?: {
    team?: string;
    repository?: string;
    deployedAt?: string;
  };
}
```

### CI/CD Integration

```yaml
# .github/workflows/deploy-mfe.yml
name: Deploy MFE

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build MFE
        run: npm run build

      - name: Deploy to CDN
        run: |
          VERSION=$(jq -r .version package.json)
          aws s3 sync dist/ s3://mfe-bucket/${{ env.MFE_ID }}/v${VERSION}/

      - name: Register with Registry
        run: |
          VERSION=$(jq -r .version package.json)
          curl -X POST ${{ secrets.REGISTRY_URL }}/api/registry/mfes \
            -H "Authorization: Bearer ${{ secrets.REGISTRY_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{
              "id": "${{ env.MFE_ID }}",
              "name": "${{ env.MFE_NAME }}",
              "version": "'${VERSION}'",
              "entry": "https://cdn.example.com/${{ env.MFE_ID }}/v'${VERSION}'/remoteEntry.js",
              "route": "${{ env.MFE_ROUTE }}",
              "menu": ${{ env.MFE_MENU_CONFIG }}
            }'
```

### Shell Integration

```svelte
<!-- App.svelte -->
<script>
  import { onMount } from 'svelte';

  let mfes = $state([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await fetch('/api/registry/mfes', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      const data = await res.json();
      mfes = data.mfes;
    } catch (e) {
      console.error('Failed to load MFE registry:', e);
      // Fallback to cached version or static manifest
      mfes = await loadCachedManifest();
    } finally {
      loading = false;
    }
  });
</script>
```

### Pros

| Advantage | Description |
|-----------|-------------|
| **Fully dynamic** | Add/remove MFEs without any shell changes |
| **Permission-aware** | Filter MFEs by user permissions server-side |
| **Audit trail** | Track who deployed what and when |
| **Health monitoring** | Registry can track MFE health |
| **Rollback support** | Easy to point to previous versions |
| **Feature flags** | Integrate with feature flag systems |
| **Multi-environment** | Different registrations per environment |

### Cons

| Disadvantage | Description |
|--------------|-------------|
| **Infrastructure** | Requires running and maintaining a service |
| **Single point of failure** | Registry down = shell can't load MFEs |
| **Latency** | Network request before shell can initialize |
| **Complexity** | Most complex option to implement |
| **Consistency** | Must handle eventual consistency issues |

### Mitigations

- **Fallback**: Shell caches last known good manifest in localStorage
- **CDN**: Put registry responses behind CDN with short TTL
- **Circuit breaker**: Fall back to static manifest if registry unavailable

### Best For

- Large enterprise applications
- Multi-team organizations with frequent deployments
- Systems requiring permission-based MFE access
- Environments with complex deployment pipelines

---

## Comparison Matrix

| Aspect | Static Manifest | Self-Registration | Build-Time Import Map | Registry Service |
|--------|-----------------|-------------------|----------------------|------------------|
| **Complexity** | Low | Medium | Medium | High |
| **Shell rebuild required** | No | No | Yes | No |
| **Manifest update required** | Yes | No | No (auto-discovered) | No (auto-registered) |
| **Dynamic MFE addition** | Manifest update | Script tag addition | Shell rebuild | API call |
| **Permission filtering** | Client-side | Client-side | Build-time | Server-side |
| **Infrastructure needed** | CDN only | CDN only | CDN + build tooling | CDN + service |
| **Failure mode** | Manifest 404 | Partial load | Build failure | Service down |
| **Best for scale** | Small-Medium | Medium | Medium | Large |
| **Development complexity** | Trivial | Low | Medium | High |

---

## Recommendation for This Project

### Primary: Static Manifest File

For a **reference implementation designed for GenAI agents**, the static manifest approach is recommended:

**Rationale:**

1. **Simplicity** - Easy to understand, copy, and modify
2. **No infrastructure** - Just files on a CDN or static server
3. **Debuggable** - AI agents can read and understand the manifest
4. **Portable** - Works anywhere, no backend dependencies
5. **Educational** - Clearly shows the relationship between shell and MFEs

### Implementation Strategy

```
micro-ui-example/
├── shell/                          # Svelte shell application
│   ├── public/
│   │   └── manifest.json           # Static MFE manifest
│   └── src/
│       └── ...
├── mfes/
│   ├── react-example/              # React MFE
│   ├── vue-example/                # Vue MFE
│   ├── svelte-example/             # Svelte MFE
│   └── angular-example/            # Angular MFE
└── docs/
```

### Upgrade Path

The static manifest can evolve into more dynamic patterns:

```
Static Manifest → Self-Registration → Registry Service
     ↓                    ↓                  ↓
  Start here         As teams grow      At enterprise scale
```

The manifest schema is designed to be compatible with all patterns - the same `MfeRegistration` interface works whether it comes from a JSON file, a registration call, or an API response.

---

## References

- [Native Federation](https://github.com/manfredsteyer/native-federation-core-microfrontend)
- [Import Maps Spec](https://github.com/WICG/import-maps)
- [Single-SPA](https://single-spa.js.org/)
- [Module Federation](https://webpack.js.org/concepts/module-federation/)
