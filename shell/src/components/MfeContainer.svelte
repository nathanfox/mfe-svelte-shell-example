<script lang="ts">
  import { onDestroy } from 'svelte';
  import { loadMfe, unloadMfe } from '../lib/federation';
  import { auth } from '../lib/auth.svelte';
  import { eventBus } from '../lib/eventBus';
  import { registerRoutes, unregisterRoutes } from '../lib/routeRegistry.svelte';
  import { stateCache } from '../lib/stateCache';
  import type { MfeRegistration, MfeRoute } from '../types/mfe';

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
        theme: 'dark',
        navigation: createNavigationApi(mfe.id),
        cache: stateCache.forMfe(mfe.id),
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
      <div class="spinner"></div>
      <span>Loading {mfe.name}...</span>
    </div>
  {/if}

  {#if error}
    <div class="mfe-error">
      <h3>Failed to load {mfe.name}</h3>
      <p class="error-message">{error}</p>
      <button class="btn btn-primary" onclick={loadCurrentMfe}>Retry</button>
    </div>
  {/if}
</div>

<style>
  .mfe-container {
    flex: 1;
    position: relative;
    min-height: 0;
    overflow: auto;
  }

  .mfe-loading {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    height: 100%;
    min-height: 200px;
    color: var(--text-secondary, #9ca3af);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border-color, #2d2d44);
    border-top-color: var(--primary-color, #6366f1);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .mfe-error {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    min-height: 200px;
    text-align: center;
    padding: 2rem;
  }

  .mfe-error h3 {
    margin: 0 0 1rem;
    color: var(--error-color, #ef4444);
  }

  .error-message {
    color: var(--text-secondary, #9ca3af);
    margin-bottom: 1.5rem;
    font-family: monospace;
    font-size: 0.875rem;
  }

  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-primary {
    background: var(--primary-color, #6366f1);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-hover, #4f46e5);
  }
</style>
