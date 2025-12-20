<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    fallback?: Snippet<[{ error: string; reset: () => void }]>;
  }

  let { children, fallback }: Props = $props();
  let hasError = $state(false);
  let errorMessage = $state('');

  function reset() {
    hasError = false;
    errorMessage = '';
  }

  $effect(() => {
    const handleError = (event: ErrorEvent) => {
      hasError = true;
      errorMessage = event.message;
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      hasError = true;
      errorMessage = event.reason?.message ?? 'An unexpected error occurred';
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  });
</script>

{#if hasError}
  {#if fallback}
    {@render fallback({ error: errorMessage, reset })}
  {:else}
    <div class="error-boundary">
      <div class="error-content">
        <h2>Something went wrong</h2>
        <p class="error-message">{errorMessage}</p>
        <div class="error-actions">
          <button class="btn btn-primary" onclick={reset}>
            Try Again
          </button>
          <button class="btn btn-secondary" onclick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  {@render children()}
{/if}

<style>
  .error-boundary {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    padding: 2rem;
  }

  .error-content {
    text-align: center;
    max-width: 400px;
  }

  .error-content h2 {
    margin: 0 0 1rem;
    color: var(--error-color, #ef4444);
  }

  .error-message {
    color: var(--text-secondary, #9ca3af);
    margin-bottom: 1.5rem;
    font-family: monospace;
    font-size: 0.875rem;
    background: var(--code-bg, rgba(0, 0, 0, 0.2));
    padding: 0.75rem;
    border-radius: 4px;
  }

  .error-actions {
    display: flex;
    justify-content: center;
    gap: 1rem;
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
