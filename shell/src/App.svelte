<script lang="ts">
  import { onMount } from 'svelte';
  import Header from './components/Header.svelte';
  import Navigation from './components/Navigation.svelte';
  import SecondaryNav from './components/SecondaryNav.svelte';
  import Footer from './components/Footer.svelte';
  import MfeContainer from './components/MfeContainer.svelte';
  import ErrorBoundary from './components/ErrorBoundary.svelte';
  import { loadManifest, type MfeRegistration } from './lib/manifest';
  import { auth } from './lib/auth.svelte';
  import { getRoutes, getDynamicRoutes } from './lib/routeRegistry.svelte';
  import type { MfeRoute, MenuChild } from './types/mfe';

  let mfes = $state<MfeRegistration[]>([]);
  let activeMfe = $state<MfeRegistration | null>(null);
  let currentPath = $state(window.location.pathname);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Compute merged navigation for active MFE
  let secondaryNavRoutes = $derived.by(() => {
    if (!activeMfe) return [];

    const dynamicRoutes = getDynamicRoutes();

    // Convert static menu children to MfeRoute format
    const staticRoutes: MfeRoute[] = (activeMfe.menu?.children ?? []).map(
      (child: MenuChild) => ({
        label: child.label,
        path: child.path,
        icon: child.icon,
        permissions: child.permissions,
      })
    );

    // Get dynamic routes for this MFE
    const mfeDynamicRoutes = dynamicRoutes.get(activeMfe.id) ?? [];

    // Merge: dynamic routes override static routes with same path
    const routeMap = new Map<string, MfeRoute>();
    for (const route of staticRoutes) routeMap.set(route.path, route);
    for (const route of mfeDynamicRoutes) routeMap.set(route.path, route);

    return Array.from(routeMap.values()).sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
  });

  onMount(() => {
    loadManifest()
      .then((manifest) => {
        mfes = manifest.mfes;
        handleRoute(window.location.pathname);
      })
      .catch((e) => {
        error = e instanceof Error ? e.message : 'Failed to load manifest';
      })
      .finally(() => {
        loading = false;
      });

    const handlePopState = () => handleRoute(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  });

  function handleRoute(path: string) {
    currentPath = path;
    const mfe = mfes.find(
      (m) =>
        path.startsWith(m.route) ||
        m.activeWhen?.some((p) => path.startsWith(p))
    );
    activeMfe = mfe ?? null;
  }

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    handleRoute(path);
  }
</script>

<ErrorBoundary>
  {#snippet children()}
    <div class="shell">
      <Header user={auth.user} onLogin={auth.login} onLogout={auth.logout} />

      <div class="shell-body">
        <Navigation {mfes} {activeMfe} {navigate} />

        <div class="shell-main">
          {#if activeMfe && secondaryNavRoutes.length > 0}
            <SecondaryNav routes={secondaryNavRoutes} {currentPath} {navigate} />
          {/if}

          <main class="shell-content">
            {#if loading}
              <div class="shell-loading">
                <div class="spinner"></div>
                <span>Loading application...</span>
              </div>
            {:else if error}
              <div class="shell-error">
                <h2>Failed to load application</h2>
                <p>{error}</p>
                <button onclick={() => window.location.reload()}>Reload</button>
              </div>
            {:else if activeMfe}
              <MfeContainer mfe={activeMfe} {navigate} {currentPath} />
            {:else}
              <div class="shell-welcome">
                <h2>Welcome to Micro UI</h2>
                <p>Select an application from the navigation menu to get started.</p>
                {#if !auth.isAuthenticated}
                  <button class="btn btn-primary" onclick={auth.login}>
                    Login to continue
                  </button>
                {/if}
              </div>
            {/if}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  {/snippet}
</ErrorBoundary>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
      Oxygen-Sans, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
    background: var(--app-bg, #0f0f1a);
    color: var(--app-text, #e5e5e5);
  }

  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .shell-body {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  .shell-main {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }

  .shell-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: auto;
  }

  .shell-loading,
  .shell-error,
  .shell-welcome {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
    gap: 1rem;
    text-align: center;
    padding: 2rem;
  }

  .shell-welcome h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--heading-color, #ffffff);
  }

  .shell-welcome p {
    margin: 0;
    color: var(--text-secondary, #9ca3af);
  }

  .shell-error h2 {
    margin: 0;
    color: var(--error-color, #ef4444);
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

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
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
