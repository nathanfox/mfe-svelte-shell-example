# Micro-UI Example

A reference implementation of a micro-frontend architecture demonstrating framework-agnostic patterns for building scalable frontend applications.

**Live Demo:** https://mfe-svelte-shell-example.nathanfox.net

## Purpose

This repository serves as a **pattern library for GenAI agents** and developers to understand and implement micro-frontend architectures. It demonstrates:

- A lightweight **Svelte 5 shell** that orchestrates multiple micro-frontends
- **Framework-agnostic MFE loading** supporting React, Vue, Angular, Svelte, SolidJS, and others
- **Static manifest registration** for simple, debuggable MFE discovery
- **Cross-MFE communication** via event bus
- **Mock authentication** with patterns for real auth integration

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                      Shell (Svelte 5)                     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Header (auth, user menu)                           │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌──────────────┐  ┌────────────────────────────────┐     │
│  │  Navigation  │  │  MFE Container                 │     │
│  │  (from       │  │  ┌──────────────────────────┐  │     │
│  │   manifest)  │  │  │ React / Vue / Svelte /   │  │     │
│  │              │  │  │ etc. (loaded on demand)  │  │     │
│  └──────────────┘  │  └──────────────────────────┘  │     │
│                    └────────────────────────────────┘     │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Footer                                             │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

## Project Structure

```
mfe-svelte-shell-example/
├── shell/                    # Svelte 5 shell application
├── mfes/
│   ├── react-example/        # React 18 micro-frontend
│   ├── vue-example/          # Vue 3 micro-frontend
│   ├── svelte-example/       # Svelte 5 micro-frontend
│   ├── solid-example/        # SolidJS micro-frontend
│   └── angular-example/      # Angular 17+ micro-frontend
├── shared/
│   └── types/                # Shared TypeScript types
└── docs/
    ├── micro-frontend-architecture.md
    ├── shell-framework-decision.md
    ├── mfe-registration-patterns.md
    └── state-management-patterns.md
```

## Quick Start

### Development

First, install dependencies for each app:

```bash
# Install root dependencies (concurrently)
npm install

# Install shell dependencies
cd shell && npm install && cd ..

# Install MFE dependencies
cd mfes/react-example && npm install && cd ../..
cd mfes/vue-example && npm install && cd ../..
cd mfes/svelte-example && npm install && cd ../..
cd mfes/solid-example && npm install && cd ../..
cd mfes/angular-example && npm install && cd ../..
```

Then start all apps:

```bash
# Start shell + all MFEs concurrently
npm run dev
```

This runs:
- **Shell** at http://localhost:5000
- **React MFE** at http://localhost:5001
- **Vue MFE** at http://localhost:5002
- **Svelte MFE** at http://localhost:5003
- **SolidJS MFE** at http://localhost:5004
- **Angular MFE** at http://localhost:5005

Open http://localhost:5000 to see the shell with all MFEs.

### Production Build

```bash
# Build all apps and combine into shell/dist
npm run build
```

The output in `shell/dist/` can be deployed to any static hosting (Netlify, Vercel, GitHub Pages, etc.).

## Key Concepts

### MFE Lifecycle

Every micro-frontend must export these functions:

```typescript
export async function bootstrap(props: MfeProps): Promise<void>;
export async function mount(props: MfeProps): Promise<void>;
export async function unmount(props: MfeProps): Promise<void>;
```

### MFE Props

The shell provides these props to every MFE:

```typescript
interface MfeProps {
  container: HTMLElement;      // DOM element to render into
  basePath: string;            // Base route for this MFE
  auth: AuthContext;           // User, token, login/logout
  eventBus: EventBus;          // Cross-MFE communication
  navigate: (path: string) => void;
  theme: 'light' | 'dark';
}
```

### Static Manifest

MFEs are registered via `manifest.json`:

```json
{
  "version": "1.0.0",
  "mfes": [
    {
      "id": "react-example",
      "name": "React Dashboard",
      "entry": "/mfes/react-example/remoteEntry.js",
      "route": "/react",
      "menu": { "label": "React", "icon": "react", "order": 1 }
    }
  ]
}
```

## Documentation

| Document | Description |
|----------|-------------|
| [MFE Loading Guide](docs/mfe-loading-guide.md) | How MFEs load into the shell, requirements, and examples |
| [Architecture](docs/micro-frontend-architecture.md) | Full architecture guide with code examples |
| [Shell Framework Decision](docs/shell-framework-decision.md) | Why Svelte 5 for the shell |
| [Registration Patterns](docs/mfe-registration-patterns.md) | Static manifest vs runtime registration |
| [State Management](docs/state-management-patterns.md) | Cross-MFE shared state and caching patterns |
| [Troubleshooting](docs/troubleshooting.md) | Common issues and solutions (CSS, Svelte 5, Netlify, Angular) |

## Why Svelte for the Shell?

- **~1.6 KB runtime** — compiles to vanilla JS
- **No framework conflicts** — no runtime to clash with MFE frameworks
- **Clean syntax** — easy for developers and AI agents to understand
- **Built-in reactivity** — no external state management needed

See [shell-framework-decision.md](docs/shell-framework-decision.md) for full analysis.

## Adding a New MFE

1. Create a new directory in `mfes/`
2. Implement the lifecycle functions (bootstrap, mount, unmount)
3. Configure your bundler to output a federation entry
4. Add entry to `shell/public/manifest.json`

See [micro-frontend-architecture.md](docs/micro-frontend-architecture.md) for detailed examples in React, Vue, Svelte, SolidJS, and Angular.

## For GenAI Agents

This repository is designed as a reference for AI coding assistants. Key patterns:

- **Lifecycle contract**: All MFEs use the same bootstrap/mount/unmount pattern
- **Props interface**: Consistent context passing from shell to MFEs
- **Event bus**: Simple pub/sub for cross-MFE communication
- **Static manifest**: JSON-based registration, easy to read and modify

When implementing micro-frontends, follow the patterns in this repository for consistent, maintainable code.

## License

MIT
