# Shell Framework Decision Document

## Context

This document evaluates framework options for the micro-frontend **shell/orchestrator application**. The shell is responsible for:

- Global chrome (header, footer, navigation)
- Authentication and session management
- Routing orchestration (loading/unloading micro-frontends)
- Error boundaries and loading states
- Inter-app communication infrastructure

The shell must remain **framework-agnostic** to allow micro-frontends to use any framework (Vue, React, Angular, Svelte, etc.).

---

## Decision Drivers

| Priority | Driver | Rationale |
|----------|--------|-----------|
| **Critical** | Framework agnosticism | MFEs must be able to use any framework without conflicts |
| **Critical** | Minimal runtime footprint | Shell should be as thin as possible; logic lives in MFEs |
| **High** | Long-term stability | Shell changes infrequently; needs low maintenance burden |
| **High** | Native Federation compatibility | Prefer bundler-agnostic module loading (ES Modules, Import Maps) |
| **Medium** | Developer experience | Team familiarity and productivity |
| **Medium** | AI-assisted development | Simpler APIs are easier for AI tools to generate correct code |
| **Low** | Ecosystem size | Shell has minimal dependencies; large ecosystem less important |

---

## Options Evaluated

### Option 1: Vanilla JavaScript + Web Components

**Description**: Pure JavaScript shell with no framework. Use native Web Components for any reusable UI.

| Aspect | Assessment |
|--------|------------|
| **Runtime size** | ~0 KB framework overhead |
| **Framework conflicts** | None possible |
| **Native Federation** | Excellent - pure ES Modules |
| **Team familiarity** | Lower - requires discipline |
| **Maintenance** | Higher - more boilerplate |
| **AI code generation** | Good - simple, predictable patterns |

**Pros**:
- Zero framework overhead
- Impossible to conflict with MFE frameworks
- Future-proof (no framework to deprecate)
- Direct DOM manipulation for maximum performance
- Works with any bundler or none at all
- No build step required if desired

**Cons**:
- More boilerplate code
- No reactive state management (must implement manually)
- Requires strong conventions to maintain consistency
- Less familiar to developers used to frameworks
- Manual DOM updates prone to bugs

**Best for**: Teams prioritizing absolute minimal footprint and maximum isolation, or shells with truly minimal UI chrome.

---

### Option 2: Svelte 5

**Description**: Svelte compiles to vanilla JavaScript at build time, leaving minimal runtime. Svelte 5 (released October 2024) introduces "Runes" for explicit reactivity.

| Aspect | Assessment |
|--------|------------|
| **Runtime size** | ~1.6-3 KB gzipped (compiles away) |
| **Framework conflicts** | Very low - no runtime |
| **Native Federation** | Excellent - Vite native |
| **Team familiarity** | Lower (new framework) |
| **Maintenance** | Low - simple mental model |
| **AI code generation** | Excellent - clean, intuitive syntax |

**Pros**:
- Near-zero runtime (compiles to vanilla JS) — 26x smaller than React
- Extremely clean, readable syntax
- Built-in state management, transitions, animations
- No Virtual DOM overhead — direct DOM manipulation
- High developer satisfaction (89.6% in State of JS, 72.8% Stack Overflow 2024)
- Svelte 5 Runes provide explicit, intuitive reactivity
- Excellent Vite support and Native Federation compatibility
- Benchmarks show 2-3x faster startup than React equivalents
- Compiler optimizations produce smaller bundles than previous versions

**Cons**:
- Smaller ecosystem than React/Vue
- Fewer developers with Svelte experience
- Some learning curve for team
- Less battle-tested at scale (though adoption growing rapidly)

**Best for**: Teams wanting framework ergonomics without framework runtime overhead.

---

### Option 3: Vue.js

**Description**: Use Vue 3 for the shell application.

| Aspect | Assessment |
|--------|------------|
| **Runtime size** | ~33 KB min+gzip |
| **Framework conflicts** | Medium - version conflicts with Vue MFEs |
| **Native Federation** | Good - vite-plugin-federation available |
| **Maintenance** | Low - large community |
| **AI code generation** | Good - well-documented |

**Pros**:
- Large ecosystem and documentation
- Can share code patterns with Vue-based MFEs
- Composition API is modern and clean
- Good tooling (Vite, Vue DevTools)
- Gentle learning curve

**Cons**:
- Runtime overhead unnecessary for simple shell
- Version conflicts possible with Vue MFEs (Vue 3.x vs 3.y)
- Shared singleton complexity in Module Federation
- Shell becomes opinionated toward Vue

**Best for**: Teams already using Vue who prioritize velocity over isolation.

---

### Option 4: React

**Description**: Use React for the shell application.

| Aspect | Assessment |
|--------|------------|
| **Runtime size** | ~42 KB min+gzip (React + ReactDOM) |
| **Framework conflicts** | Medium - version conflicts with React MFEs |
| **Native Federation** | Good - well supported |
| **Maintenance** | Low - massive community |
| **AI code generation** | Excellent - most training data |

**Pros**:
- Largest ecosystem and community
- Most AI training data (best AI code generation)
- Largest hiring pool
- Excellent tooling and documentation

**Cons**:
- Larger runtime than needed for shell
- Version conflicts with React MFEs
- Hooks complexity for simple use cases

**Best for**: Teams already using React or prioritizing hiring flexibility.

---

### Option 5: Preact

**Description**: Lightweight React alternative with compatible API.

| Aspect | Assessment |
|--------|------------|
| **Runtime size** | ~4 KB min+gzip |
| **Framework conflicts** | Low - smaller footprint |
| **Native Federation** | Good |
| **Maintenance** | Medium - smaller community |
| **AI code generation** | Good - React patterns apply |

**Pros**:
- React-compatible API, much smaller
- Can use React ecosystem (with aliasing)
- Good for performance-critical shells

**Cons**:
- Some React features missing or different
- Smaller community than React

**Best for**: Teams wanting React patterns without React size.

---

### Option 6: Lit (Web Components Framework)

**Description**: Google's library for building Web Components with minimal overhead.

| Aspect | Assessment |
|--------|------------|
| **Runtime size** | ~5 KB min+gzip |
| **Framework conflicts** | None - outputs standard Web Components |
| **Native Federation** | Excellent - standard ES Modules |
| **Team familiarity** | Low |
| **Maintenance** | Low - stable, backed by Google |
| **AI code generation** | Medium - less training data |

**Pros**:
- Outputs standard Web Components
- Small, focused library
- Reactive templates with lit-html
- Framework-agnostic by design
- Backed by Google, used in production

**Cons**:
- Less familiar syntax
- Smaller ecosystem
- Learning curve for team

**Best for**: Teams committed to Web Components standard.

---

## Comparison Matrix

| Criterion | Vanilla | Svelte 5 | Vue | React | Preact | Lit |
|-----------|---------|----------|-----|-------|--------|-----|
| **Runtime Size** | 0 KB | ~1.6-3 KB | ~33 KB | ~42 KB | ~4 KB | ~5 KB |
| **Framework Conflicts** | None | Very Low | Medium | Medium | Low | None |
| **Developer Satisfaction** | N/A | 89.6% | 77.3% | 83.0% | ~83% | ~85% |
| **AI Code Generation** | Good | Excellent | Good | Excellent | Good | Medium |
| **Ecosystem Size** | N/A | Small | Large | Largest | Medium | Small |
| **Native Federation** | Excellent | Excellent | Good | Good | Good | Excellent |
| **Long-term Stability** | Excellent | Good | Good | Good | Good | Excellent |

---

## Deep Dive: Svelte 5 vs Vanilla JS for Shell

Given that both Svelte and Vanilla JS produce minimal/zero runtime overhead, this section provides a detailed comparison for the shell use case specifically.

### Bundle Size Reality

| Approach | Typical Shell Size | Notes |
|----------|-------------------|-------|
| **Vanilla JS** | 0 KB framework | Just your code |
| **Svelte 5** | ~1.6-3 KB gzipped | Compiles away, minimal runtime |
| Vue 3 | ~33 KB | For comparison |
| React | ~42 KB | For comparison |

The difference between 0 KB and ~2 KB is **negligible** for a shell app. Both are effectively "zero framework overhead" in practice.

### Feature Comparison: What Svelte Provides vs Manual Implementation

| Feature | Vanilla JS | Svelte 5 |
|---------|-----------|----------|
| **Reactive state** | Manual (Proxy, events, pub/sub pattern) | `let count = $state(0)` — just works |
| **DOM updates** | `element.innerHTML` or manual diffing | Automatic, surgical updates |
| **Component structure** | Roll your own (classes, Web Components) | Built-in `.svelte` files |
| **Event handling** | `addEventListener` boilerplate | `onclick={handler}` |
| **Transitions/animations** | CSS + JS orchestration | `transition:fade` built-in |
| **Scoped styles** | BEM, CSS Modules, Shadow DOM | Automatic per-component |
| **Conditionals/loops** | Template literals or manual DOM | `{#if}`, `{#each}` |
| **Cleanup** | Manual `removeEventListener`, etc. | Automatic on component destroy |

### Code Comparison: Auth State in Shell Header

**Vanilla JS Implementation:**

```javascript
// state.js - Manual reactive state
const state = {
  user: null,
  listeners: new Set(),

  setUser(user) {
    this.user = user;
    this.listeners.forEach(fn => fn(user));
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
};

// header.js - Manual DOM management
class Header {
  constructor(container) {
    this.container = container;
    this.unsubscribe = state.subscribe(user => this.render(user));
    this.render(state.user);
  }

  render(user) {
    // Clean up old listeners
    this.cleanup();

    this.container.innerHTML = user
      ? `<span class="user-name">${this.escapeHtml(user.name)}</span>
         <button id="logout">Logout</button>`
      : `<button id="login">Login</button>`;

    // Attach new listeners
    const logout = this.container.querySelector('#logout');
    const login = this.container.querySelector('#login');

    if (logout) {
      this.logoutHandler = () => auth.logout();
      logout.addEventListener('click', this.logoutHandler);
    }
    if (login) {
      this.loginHandler = () => auth.login();
      login.addEventListener('click', this.loginHandler);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  cleanup() {
    const logout = this.container.querySelector('#logout');
    const login = this.container.querySelector('#login');
    if (logout && this.logoutHandler) {
      logout.removeEventListener('click', this.logoutHandler);
    }
    if (login && this.loginHandler) {
      login.removeEventListener('click', this.loginHandler);
    }
  }

  destroy() {
    this.cleanup();
    this.unsubscribe();
  }
}
```

**Svelte 5 Implementation:**

```svelte
<!-- Header.svelte -->
<script>
  import { user } from './state.svelte.js';
  import { auth } from './auth.js';
</script>

{#if user}
  <span class="user-name">{user.name}</span>
  <button onclick={auth.logout}>Logout</button>
{:else}
  <button onclick={auth.login}>Login</button>
{/if}

<style>
  .user-name { font-weight: 500; }
</style>
```

```javascript
// state.svelte.js
export let user = $state(null);

export function setUser(newUser) {
  user = newUser;
}
```

**Key observations:**
- Svelte version is ~10 lines vs ~60 lines for vanilla
- Svelte handles escaping, cleanup, and event binding automatically
- Svelte compiles to similar output as the vanilla version
- Less code = fewer bugs, easier maintenance

### Shell-Specific Requirements Analysis

| Requirement | Vanilla Complexity | Svelte Complexity | Notes |
|-------------|-------------------|-------------------|-------|
| Header with auth state | Medium | Trivial | Reactive state shines |
| Navigation menu (dynamic from registry) | Medium | Trivial | `{#each}` vs manual loops |
| Loading spinners | Low | Trivial | Both simple |
| Error boundaries | Medium | Low | Svelte has `<svelte:boundary>` |
| Route orchestration | Same | Same | Single-SPA/Native Federation handles this |
| Event bus | Same | Same | Framework-agnostic anyway |
| MFE mounting | Same | Same | Native Federation API calls |
| Theming (CSS variables) | Same | Same | Both use CSS custom properties |
| Notifications/toasts | Medium | Low | Transitions built into Svelte |

### Decision Framework: When to Choose Each

**Choose Vanilla JS when:**
- Shell is truly minimal (just a mount point, almost no UI)
- Team has established vanilla patterns and conventions
- Zero dependencies is a hard requirement
- No build step is preferred
- Shell chrome is static (no reactive state needed)

**Choose Svelte 5 when:**
- Shell has typical chrome (header, nav, footer, notifications)
- Reactive state is needed (auth, theme, loading states)
- Team values developer experience and less boilerplate
- AI-assisted development is part of the workflow
- Animations/transitions are desired
- Long-term maintainability is prioritized

### The "Compiles to Vanilla" Advantage

Svelte's key insight: you get framework ergonomics at development time, but vanilla JS at runtime.

```
Development Time          Build Time           Runtime
     ↓                        ↓                   ↓
┌─────────────┐         ┌──────────┐        ┌─────────────┐
│  Svelte 5   │   →→→   │ Compiler │  →→→   │ Vanilla JS  │
│  .svelte    │         │          │        │ (optimized) │
└─────────────┘         └──────────┘        └─────────────┘
   - Reactive              - Tree             - No runtime
   - Components            - Dead code        - Direct DOM
   - Scoped CSS            - Minification     - ~1.6 KB overhead
```

This means:
- No framework conflict risk with MFEs
- Performance equivalent to hand-written vanilla JS
- Developer productivity of a modern framework

---

## The GenAI Factor

An important consideration for modern development: **AI-assisted coding changes the ecosystem calculus**.

Traditional ecosystem advantages:
- More npm packages available
- More Stack Overflow answers
- More tutorials and examples

With GenAI agents:
- AI can generate custom implementations on demand
- Documentation gaps are less critical (AI can explain)
- Boilerplate generation is automated
- Migration between frameworks becomes easier

**Implication**: Frameworks with **cleaner, simpler APIs** (Svelte, Lit) may be *easier* for AI to generate correct code for than frameworks with more complex patterns (React hooks, Vue reactivity system).

This shifts the decision toward frameworks optimized for:
1. Simple, predictable syntax
2. Fewer footguns and edge cases
3. Clear, readable output

---

## Orchestration Layer Considerations

### Native Federation (Recommended)

For maximum framework agnosticism, use **Native Federation** rather than Webpack Module Federation:

- Bundler-agnostic (works with Vite, Rollup, esbuild)
- Uses browser-native ES Modules and Import Maps
- Same mental model as Module Federation
- Better future-proofing as bundler landscape evolves

```
Shell (any framework)
  │
  ├── Native Federation / Import Maps
  │
  ├── React MFE ──────────┐
  ├── Vue MFE ────────────┼── Each loads independently
  ├── Svelte MFE ─────────┤   via ES Module imports
  └── Angular MFE ────────┘
```

### Web Components as Boundaries

Regardless of shell framework, consider using **Web Components** as the boundary between shell and MFEs:

```html
<!-- Each MFE exposes a custom element -->
<orders-app auth-token="..." user-id="..."></orders-app>
<inventory-app auth-token="..." user-id="..."></inventory-app>
```

Benefits:
- Standard browser API
- Framework isolation guaranteed
- Props passed as attributes
- Events via CustomEvent

---

## Recommendations

### Primary Recommendation: Svelte 5

**Rationale**:

1. **Near-zero runtime** — Compiles away, leaving ~1.6 KB overhead (26x smaller than React)
2. **Clean developer experience** — 6x less code than equivalent vanilla JS
3. **No framework conflicts** — No runtime to conflict with MFE frameworks
4. **Excellent AI compatibility** — Simple, intuitive syntax generates reliably
5. **High satisfaction** — 89.6% satisfaction rate, teams that use it love it
6. **Native Vite support** — First-class Native Federation compatibility
7. **Automatic cleanup** — No manual event listener management
8. **Built-in transitions** — Animations without additional libraries

The shell is a thin layer with limited complexity. Svelte provides framework ergonomics (reactivity, components, transitions) without framework runtime baggage. The compiled output is effectively the same vanilla JS you'd write by hand.

### Alternative Recommendation: Vanilla JS

For teams prioritizing absolute minimalism:

1. Use **vanilla JavaScript** for all shell logic
2. Consider **Lit** (~5 KB) if reusable components are needed
3. Outputs standard Web Components
4. Zero framework lock-in, zero build step if desired

**Choose this if:**
- Shell is truly minimal (just MFE mount points)
- Team has established vanilla JS patterns
- Zero dependencies is a hard requirement

---

## Decision

For this reference implementation, we have chosen **Svelte 5** for the shell:

| Aspect | Decision |
|--------|----------|
| **Shell Framework** | Svelte 5 |
| **Module Loading** | Native Federation |
| **MFE Boundary** | Lifecycle functions (bootstrap, mount, unmount) |
| **Communication** | Event bus + shared props |

### Rationale

1. **Near-zero runtime** — Best of both worlds: framework DX with vanilla JS output
2. **Framework agnostic** — No runtime to conflict with any MFE framework
3. **AI-friendly** — Clean syntax for GenAI code generation
4. **Educational** — Simple enough for developers to understand the patterns
5. **Production-ready** — Used by companies like Apple, Spotify, The New York Times

---

## References

### Framework Documentation
- [Svelte 5 Documentation](https://svelte.dev/)
- [Svelte 5 Runes](https://svelte.dev/blog/runes)
- [Lit Documentation](https://lit.dev/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

### Micro-Frontend Resources
- [Native Federation Core](https://github.com/manfredsteyer/native-federation-core-microfrontend)
- [micro-frontend-architecture.md](./micro-frontend-architecture.md) - Parent architecture document

### Surveys & Benchmarks
- [State of JS 2024 - Frontend Frameworks](https://stateofjs.com/)
- [Stack Overflow Developer Survey 2024](https://survey.stackoverflow.co/2024/)
- [Svelte 5 vs React 2024 Comparison](https://sveltetalk.com/posts/svelte-5-vs-react-2024-complete-framework-comparison)

### Analysis Articles
- [What's New in Svelte 5 - Vercel](https://vercel.com/blog/whats-new-in-svelte-5)
- [Svelte 5 2025 Review - Scalable Path](https://www.scalablepath.com/javascript/svelte-5-review)
- [Svelte vs Vanilla.JS Comparison - StackShare](https://stackshare.io/stackups/svelte-vs-vanilla-js)

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2025-01-XX | | Initial draft |
