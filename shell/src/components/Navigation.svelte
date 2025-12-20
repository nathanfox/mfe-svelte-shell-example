<script lang="ts">
  import type { MfeRegistration } from '../types/mfe';

  interface Props {
    mfes: MfeRegistration[];
    activeMfe: MfeRegistration | null;
    navigate: (path: string) => void;
  }

  let { mfes, activeMfe, navigate }: Props = $props();

  // Sort MFEs by menu order
  let sortedMfes = $derived(
    [...mfes].sort((a, b) => (a.menu?.order ?? 0) - (b.menu?.order ?? 0))
  );

  function handleClick(mfe: MfeRegistration, event: MouseEvent) {
    event.preventDefault();
    navigate(mfe.route);
  }
</script>

<nav class="shell-nav">
  <ul class="nav-list">
    {#each sortedMfes as mfe}
      <li class="nav-item">
        <a
          href={mfe.route}
          class="nav-link"
          class:active={activeMfe?.id === mfe.id}
          onclick={(e) => handleClick(mfe, e)}
        >
          {#if mfe.menu?.icon}
            <span class="nav-icon">{mfe.menu.icon}</span>
          {/if}
          <span class="nav-label">{mfe.menu?.label ?? mfe.name}</span>
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .shell-nav {
    width: 220px;
    min-width: 220px;
    background: var(--nav-bg, #16162a);
    border-right: 1px solid var(--border-color, #2d2d44);
    padding: 1rem 0;
  }

  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .nav-item {
    margin: 0.25rem 0;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    color: var(--nav-text, #a0a0b0);
    text-decoration: none;
    transition: all 0.2s;
    border-left: 3px solid transparent;
  }

  .nav-link:hover {
    color: var(--nav-text-hover, #ffffff);
    background: var(--nav-hover-bg, rgba(255, 255, 255, 0.05));
  }

  .nav-link.active {
    color: var(--primary-color, #6366f1);
    background: var(--nav-active-bg, rgba(99, 102, 241, 0.1));
    border-left-color: var(--primary-color, #6366f1);
  }

  .nav-icon {
    font-size: 1.25rem;
    width: 1.5rem;
    text-align: center;
  }

  .nav-label {
    font-size: 0.9rem;
    font-weight: 500;
  }
</style>
