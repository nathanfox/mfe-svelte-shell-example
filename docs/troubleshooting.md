# Troubleshooting & Gotchas

This document captures issues encountered during development of this micro-frontend architecture and their solutions. Use this as a reference when debugging MFE loading, styling, or deployment issues.

---

## Table of Contents

1. [CSS Issues](#css-issues)
2. [Svelte 5 Reactivity Issues](#svelte-5-reactivity-issues)
3. [Deployment Issues](#deployment-issues)
4. [Development Mode Issues](#development-mode-issues)
5. [Angular-Specific Issues](#angular-specific-issues)
6. [Manifest Configuration](#manifest-configuration)

---

## CSS Issues

### CSS Not Loading / Flash of Unstyled Content (FOUC)

**Symptoms:**
- MFE renders without styles momentarily
- Styles "pop in" after the component is already visible

**Cause:**
The CSS `<link>` element was added to the DOM, but the MFE mounted before the stylesheet finished downloading.

**Solution:**
Wait for the stylesheet's `onload` event before proceeding with MFE mount:

```typescript
// shell/src/lib/federation.ts
await new Promise<void>((resolve, reject) => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = cssPath;
  link.onload = () => resolve();  // Wait for this!
  link.onerror = () => reject();
  document.head.appendChild(link);
});
```

**Commit:** `a64a174`

---

### CSS Not Loading on MFE Remount

**Symptoms:**
- First visit to an MFE shows styles correctly
- Navigate away, then back - styles are missing
- Console shows no CSS loading attempts

**Cause:**
CSS loading was inside the lifecycle cache check. When an MFE was cached (already bootstrapped), the CSS loading code was skipped entirely. But the stylesheet had been removed during unmount.

**Solution:**
Move CSS loading outside the cache check so it runs on every mount:

```typescript
// Always ensure CSS is loaded (it may have been removed on unmount)
await loadMfeStyles(mfe);

// Then check the module cache
let lifecycle = loadedMfes.get(mfe.id);
if (!lifecycle) {
  // ... import and bootstrap
}
```

**Commit:** `f1e55be`

---

### CSS Path Resolution - Vite's assets/ Subfolder

**Symptoms:**
- CSS loads in dev mode but not in production
- 404 errors for `/mfes/my-mfe/remoteEntry.css`
- CSS file actually exists at `/mfes/my-mfe/assets/remoteEntry.css`

**Cause:**
Vite outputs CSS to an `assets/` subfolder by default, but the shell was only checking the same directory as the JS file.

**Solution:**
Check multiple paths, trying `assets/` first:

```typescript
const cssPaths = [
  `${basePath}/assets/${fileName}`,  // Vite default
  `${basePath}/${fileName}`,          // Fallback
];

for (const cssPath of cssPaths) {
  const response = await fetch(cssPath, { method: 'HEAD' });
  if (response.ok) {
    // Load from this path
    break;
  }
}
```

**Commit:** `d40be0e`

---

### MFE Stylesheets Not Cleaned Up

**Symptoms:**
- Styles from previously loaded MFEs bleed into current MFE
- Cumulative style conflicts as user navigates between MFEs
- Memory grows over time with orphaned `<link>` tags

**Cause:**
The unmount function wasn't removing the stylesheet `<link>` element from the document head.

**Solution:**
Remove the stylesheet during unmount:

```typescript
export async function unloadMfe(mfeId: string): Promise<void> {
  // ... unmount lifecycle

  // Clean up stylesheet
  if (loadedStylesheets.has(mfeId)) {
    const link = document.getElementById(`mfe-styles-${mfeId}`);
    if (link) {
      link.remove();
    }
    loadedStylesheets.delete(mfeId);
  }
}
```

**Commit:** `2b060ac`

---

## Svelte 5 Reactivity Issues

### Infinite Loop in MfeContainer

**Symptoms:**
- Browser tab freezes or becomes unresponsive
- Console shows repeated "[Federation] Loading MFE" messages
- High CPU usage

**Cause:**
Svelte 5's `$effect` runs whenever any reactive dependency changes. The original code read `mfe` inside the effect and also triggered a state change (`loading = true`), which caused the effect to re-run infinitely:

```typescript
// BROKEN - infinite loop
$effect(() => {
  if (mfe) {
    loading = true;  // This triggers re-run
    loadCurrentMfe();
  }
});
```

**Solution:**
Use multiple guards:
1. `isMounted` flag to prevent running before DOM is ready
2. `isLoading` flag (non-reactive) to prevent re-entry
3. `$effect.pre` instead of `$effect` for synchronous checks
4. Compare against `loadedMfeId` to only react to actual changes

```typescript
let isLoading = false;      // Non-reactive guard
let isMounted = false;      // DOM ready flag
let loadedMfeId: string | null = null;

onMount(() => {
  isMounted = true;
  loadCurrentMfe();
});

$effect.pre(() => {
  const mfeId = mfe?.id;
  if (isMounted && mfeId && mfeId !== loadedMfeId && !isLoading) {
    loadCurrentMfe();
  }
});
```

**Commit:** `b059d4f`

---

## Deployment Issues

### Netlify SPA Fallback Breaks Static Assets

**Symptoms:**
- Works perfectly on localhost
- On Netlify: MFE JS/CSS files return HTML (index.html content)
- Console shows "Unexpected token '<'" errors when loading MFE
- Network tab shows 200 status but wrong content-type

**Cause:**
The SPA fallback rule `/* -> /index.html` was catching ALL requests, including requests for static MFE assets like `/mfes/react-example/remoteEntry.js`.

```toml
# BROKEN - catches everything
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Solution:**
Add explicit rules for static asset paths BEFORE the SPA fallback. Netlify processes rules in order, so more specific rules must come first:

```toml
# netlify.toml

# Serve static assets directly (these rules come FIRST)
[[redirects]]
  from = "/mfes/*"
  to = "/mfes/:splat"
  status = 200

[[redirects]]
  from = "/assets/*"
  to = "/assets/:splat"
  status = 200

# SPA fallback - MUST come last
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Commit:** `52e5441`

---

## Development Mode Issues

### Vite React Plugin Preamble Error

**Symptoms:**
- Error: `@vitejs/plugin-react can't detect preamble`
- Only happens when shell loads MFE via dynamic import
- Works fine when running MFE standalone

**Cause:**
Vite's React plugin injects a "preamble" script for Fast Refresh via HTML `<script>` tags. When the shell dynamically imports the MFE's entry point directly (bypassing HTML), the preamble is never injected.

```typescript
// This bypasses the MFE's index.html, missing preamble injection
const module = await import('http://localhost:5001/src/main.tsx');
```

**Solution:**
Use "build + serve" approach for development:

```json
{
  "scripts": {
    "dev": "vite build --watch & vite preview --port 5001",
    "dev:standalone": "vite --port 5001"
  }
}
```

This builds the MFE in watch mode and serves the built output, avoiding the HMR/preamble issue entirely. Trade-off: no HMR, requires page refresh.

See [mfe-dev-loading.md](./mfe-dev-loading.md) for alternative approaches including Module Federation.

**Commit:** `b059d4f` (documented in `b034e71`)

---

## Angular-Specific Issues

### Zone.js Conflicts

**Symptoms:**
- Multiple Zone.js instances loaded
- Change detection not working reliably
- Console warnings about Zone.js

**Cause:**
Angular normally requires Zone.js for change detection, but loading Zone.js in an MFE can conflict with other frameworks or create multiple Zone instances.

**Solution:**
Use Angular's experimental zoneless change detection:

```typescript
// app.config.ts
import { provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
  ],
};
```

Note: Zoneless requires Angular 17+ and may need `ChangeDetectorRef.markForCheck()` in some cases.

**Commit:** `b059d4f`

---

### Props via window.__MFE_PROPS__ (Anti-pattern)

**Symptoms:**
- Props accessible but feels hacky
- No TypeScript type safety
- Potential conflicts with other scripts

**Original approach (don't do this):**
```typescript
// main.ts
export async function mount(props: MfeProps) {
  (window as any).__MFE_PROPS__ = props;
  // ... bootstrap Angular
}

// component.ts
const props = (window as any).__MFE_PROPS__;
```

**Better solution - Dependency Injection:**

```typescript
// app.config.ts
import { InjectionToken } from '@angular/core';

export const MFE_PROPS = new InjectionToken<MfeProps>('MFE_PROPS');

export function createMfeAppConfig(props: MfeProps): ApplicationConfig {
  return {
    providers: [
      provideExperimentalZonelessChangeDetection(),
      { provide: MFE_PROPS, useValue: props },
    ],
  };
}
```

```typescript
// main.ts
export async function mount(props: MfeProps) {
  const mfeConfig = createMfeAppConfig(props);
  appRef = await createApplication(mfeConfig);
  // ...
}
```

```typescript
// component.ts
import { inject } from '@angular/core';
import { MFE_PROPS } from './app.config';

export class MyComponent {
  private props = inject(MFE_PROPS);

  get user() {
    return this.props.auth.user;
  }
}
```

**Commit:** `2b060ac`

---

## Manifest Configuration

### Production vs Development Entry Paths

**Symptoms:**
- MFEs load in dev but 404 in production (or vice versa)
- Entry paths have wrong prefix (`/dist/` in production)

**Cause:**
Development uses absolute URLs pointing to local dev servers, while production uses relative paths from the shell's origin. These need different manifest files.

**Solution:**
Maintain two manifest files:

**manifest.dev.json** (development):
```json
{
  "mfes": [
    {
      "id": "react-example",
      "entry": "http://localhost:5001/remoteEntry.js",
      "route": "/react"
    }
  ]
}
```

**manifest.json** (production):
```json
{
  "mfes": [
    {
      "id": "react-example",
      "entry": "/mfes/react-example/remoteEntry.js",
      "route": "/react"
    }
  ]
}
```

The shell detects the environment and loads the appropriate manifest:

```typescript
const isDev = import.meta.env.DEV;
const manifestPath = isDev ? '/manifest.dev.json' : '/manifest.json';
```

**Important:** Production paths should NOT include `/dist/` - the build script copies files directly to the output structure.

**Commit:** `6396fe2`

---

## Quick Reference

| Issue | Key Symptom | Solution |
|-------|------------|----------|
| FOUC | Styles "pop in" | Wait for CSS `onload` |
| CSS missing on remount | Styles gone after nav | Load CSS outside cache check |
| CSS 404 in prod | Wrong path | Check `assets/` subfolder |
| Style bleed | Other MFE styles showing | Remove stylesheet on unmount |
| Infinite loop | Browser freezes | Use guards with `$effect.pre` |
| Netlify 404/HTML | MFE returns index.html | Add static asset redirects before SPA fallback |
| React preamble error | HMR error in shell | Use build+serve for dev |
| Angular Zone conflicts | Change detection issues | Use zoneless change detection |
| Angular props | No type safety | Use InjectionToken + DI |
| Wrong manifest paths | 404 in dev or prod | Separate manifest.json files |
