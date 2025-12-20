# MFE Development Loading Strategies

## The Problem

In a micro-frontend architecture, the shell application dynamically imports MFE bundles at runtime:

```typescript
const module = await import('http://localhost:5001/src/main.tsx');
```

This works fine in production where MFEs are pre-built, but causes issues in development because:

1. **Vite's React plugin** injects a "preamble" for Fast Refresh via HTML `<script>` tags
2. **Cross-origin imports** bypass the HTML page, missing the preamble injection
3. **Result**: `@vitejs/plugin-react can't detect preamble` error

This affects any framework with dev-time transformations (React, Vue, Svelte, etc.).

---

## Solution Options

### 1. Build + Serve (Recommended for Simplicity)

**Approach**: Build MFEs in watch mode and serve the built output.

```json
{
  "scripts": {
    "dev": "vite build --watch & vite preview --port 5001",
    "dev:standalone": "vite --port 5001"
  }
}
```

**Pros**:
- Simple setup, no additional dependencies
- Works with any framework
- Consistent behavior between dev and prod

**Cons**:
- No HMR (Hot Module Replacement) - requires page refresh
- Slightly slower feedback loop (rebuild on each change)
- MFE must be rebuilt before shell can load changes

**Best for**: Prototypes, small teams, simpler setups

---

### 2. Module Federation (Vite Federation Plugin)

**Approach**: Use `@originjs/vite-plugin-federation` to enable proper module sharing.

```typescript
// vite.config.ts (MFE)
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'react-mfe',
      filename: 'remoteEntry.js',
      exposes: {
        './main': './src/main.tsx',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
});
```

```typescript
// vite.config.ts (Shell)
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    svelte(),
    federation({
      name: 'shell',
      remotes: {
        'react-mfe': 'http://localhost:5001/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
});
```

**Pros**:
- Proper dependency sharing (single React instance)
- Better dev experience with faster loads
- Industry-standard approach

**Cons**:
- More complex configuration
- Plugin compatibility issues across framework versions
- Requires all MFEs to use the same shared dependency versions

**Best for**: Production applications, teams with federation experience

---

### 3. Import Maps

**Approach**: Use browser-native import maps to share dependencies.

```html
<!-- index.html -->
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "vue": "https://esm.sh/vue@3.5.13"
  }
}
</script>
```

```typescript
// vite.config.ts (MFE)
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
});
```

**Pros**:
- Browser-native, no plugins needed
- Perfect dependency deduplication
- Works across all frameworks

**Cons**:
- CDN dependency for shared modules
- Complex setup for dev vs prod environments
- Import map must be defined before any imports

**Best for**: Applications prioritizing bundle size, CDN-based deployments

---

### 4. Proxy Through Shell

**Approach**: Shell dev server proxies requests to MFE dev servers.

```typescript
// shell/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/mfes/react': {
        target: 'http://localhost:5001',
        rewrite: (path) => path.replace(/^\/mfes\/react/, ''),
      },
    },
  },
});
```

**Pros**:
- Same-origin requests (no CORS)
- Can work with raw dev servers

**Cons**:
- Complex proxy configuration
- Still doesn't solve the preamble injection issue for React
- Tight coupling between shell and MFE dev setups

**Best for**: Specific CORS requirements

---

### 5. Single Dev Server with Workspaces

**Approach**: Monorepo with single Vite instance serving all apps.

```
micro-ui/
├── packages/
│   ├── shell/
│   ├── react-mfe/
│   └── vue-mfe/
├── vite.config.ts  # Root config
└── package.json    # Workspaces
```

**Pros**:
- Single dev server, HMR works
- Simplified dependency management
- Easiest local development

**Cons**:
- Doesn't reflect production architecture
- Loses independent deployment benefit
- All MFEs must use same build tool

**Best for**: Early development, small teams

---

## Recommendation Matrix

| Scenario | Recommended Approach |
|----------|---------------------|
| Quick prototype / POC | Build + Serve |
| Production with shared deps | Module Federation |
| Minimal bundle size | Import Maps |
| Enterprise / complex | Module Federation + Import Maps |
| Monorepo setup | Single Dev Server |

---

## This Repository

This example uses **Build + Serve** for simplicity:

```bash
# Terminal 1: Shell
cd shell && npm run dev

# Terminal 2: React MFE
cd mfes/react-example && npm run dev

# Terminal 3: Vue MFE (optional)
cd mfes/vue-example && npm run dev
```

The `dev` script builds in watch mode and serves the output:
- Changes trigger automatic rebuild
- Shell loads the built `remoteEntry.js`
- Refresh browser to see changes

For standalone MFE development with HMR:
```bash
cd mfes/react-example && npm run dev:standalone
```

---

## Future Improvements

1. **Add Module Federation** for better dev experience
2. **Implement shared dependency extraction** via import maps
3. **Add a root `dev` script** that starts all services with `concurrently`
