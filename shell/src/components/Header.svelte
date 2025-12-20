<script lang="ts">
  import type { User } from '../types/mfe';

  interface Props {
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
  }

  let { user, onLogin, onLogout }: Props = $props();
</script>

<header class="shell-header">
  <div class="header-brand">
    <h1>Micro UI</h1>
  </div>

  <div class="header-actions">
    {#if user}
      <span class="user-info">
        <span class="user-name">{user.name}</span>
        <span class="user-email">{user.email}</span>
      </span>
      <button class="btn btn-secondary" onclick={onLogout}>
        Logout
      </button>
    {:else}
      <button class="btn btn-primary" onclick={onLogin}>
        Login
      </button>
    {/if}
  </div>
</header>

<style>
  .shell-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.5rem;
    height: 60px;
    background: var(--header-bg, #1a1a2e);
    color: var(--header-text, #ffffff);
    border-bottom: 1px solid var(--border-color, #2d2d44);
  }

  .header-brand h1 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .user-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 0.875rem;
  }

  .user-name {
    font-weight: 500;
  }

  .user-email {
    opacity: 0.7;
    font-size: 0.75rem;
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

  .btn-secondary {
    background: var(--secondary-bg, #374151);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--secondary-hover, #4b5563);
  }
</style>
