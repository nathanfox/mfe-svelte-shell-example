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
    border-bottom: 1px solid var(--border-color, #2d2d44);
    background: var(--secondary-nav-bg, #1e1e36);
  }

  .secondary-nav-list {
    display: flex;
    gap: 0.25rem;
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
    color: var(--secondary-nav-text, #a0a0b0);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    font-size: 0.875rem;
  }

  .secondary-nav-link:hover {
    color: var(--secondary-nav-hover, #ffffff);
    background: var(--secondary-nav-hover-bg, rgba(255, 255, 255, 0.05));
  }

  .secondary-nav-link.active {
    color: var(--primary-color, #6366f1);
    border-bottom-color: var(--primary-color, #6366f1);
  }

  .nav-icon {
    font-size: 0.875rem;
  }

  .external-indicator {
    font-size: 0.75rem;
    opacity: 0.7;
  }
</style>
