<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
  }

  interface AuthContext {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
  }

  interface EventBus {
    emit: (event: string, payload: unknown) => void;
    on: (event: string, handler: (payload: unknown) => void) => () => void;
  }

  interface Props {
    auth: AuthContext;
    eventBus: EventBus;
    navigate: (path: string) => void;
    basePath: string;
  }

  let { auth: initialAuth, eventBus, navigate, basePath }: Props = $props();

  let count = $state(0);
  let messages = $state<string[]>([]);
  let auth = $state<AuthContext>(initialAuth);
  let unsubNotification: (() => void) | null = null;
  let unsubAuth: (() => void) | null = null;

  onMount(() => {
    unsubNotification = eventBus.on('notification:show', (payload) => {
      const msg = payload as { message: string };
      messages = [...messages, msg.message].slice(-5);
    });

    // Listen for auth changes from shell
    unsubAuth = eventBus.on('auth:changed', (payload) => {
      const authPayload = payload as { user: User | null; token: string | null; isAuthenticated: boolean };
      auth = {
        ...auth,
        user: authPayload.user,
        token: authPayload.token,
        isAuthenticated: authPayload.isAuthenticated,
      };
    });
  });

  onDestroy(() => {
    if (unsubNotification) unsubNotification();
    if (unsubAuth) unsubAuth();
  });

  function increment() {
    count++;
    eventBus.emit('notification:show', {
      type: 'info',
      message: `Svelte counter: ${count}`,
    });
  }

  function handleNavigate(path: string) {
    navigate(path);
  }
</script>

<div class="container">
  <div class="card">
    <h1 class="title">Svelte Reports</h1>
    <p class="subtitle">Welcome, {auth.user?.name ?? 'Guest'}!</p>

    <div class="section">
      <h2 class="section-title">Counter Demo</h2>
      <p class="counter">{count}</p>
      <button class="button" onclick={increment}>Increment</button>
    </div>

    <div class="section">
      <h2 class="section-title">Navigation</h2>
      <div class="nav-buttons">
        <button class="nav-button" onclick={() => handleNavigate(`${basePath}/charts`)}>
          Go to Charts
        </button>
        <button class="nav-button" onclick={() => handleNavigate('/react')}>
          Go to React MFE
        </button>
        <button class="nav-button" onclick={() => handleNavigate('/vue')}>
          Go to Vue MFE
        </button>
      </div>
    </div>

    {#if messages.length > 0}
      <div class="section">
        <h2 class="section-title">Event Log</h2>
        <ul class="message-list">
          {#each messages as msg, i}
            <li class="message">{msg}</li>
          {/each}
        </ul>
      </div>
    {/if}

    <div class="info">
      <p><strong>Base Path:</strong> {basePath}</p>
      <p><strong>Auth Status:</strong> {auth.isAuthenticated ? 'Logged In' : 'Not Logged In'}</p>
      {#if auth.user}
        <p><strong>Roles:</strong> {auth.user.roles.join(', ')}</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .container {
    padding: 2rem;
    min-height: 100%;
    background: linear-gradient(135deg, #4a1d1d 0%, #2d0f0f 100%);
  }

  .card {
    max-width: 800px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .title {
    margin: 0 0 0.5rem;
    font-size: 2rem;
    color: #ff3e00;
  }

  .subtitle {
    margin: 0 0 2rem;
    color: #a0a0b0;
  }

  .section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .section-title {
    margin: 0 0 1rem;
    font-size: 1.25rem;
    color: #ffffff;
  }

  .counter {
    font-size: 3rem;
    font-weight: bold;
    color: #ff3e00;
    margin: 0 0 1rem;
  }

  .button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #ff3e00;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  }

  .button:hover {
    background: #e63600;
  }

  .nav-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .nav-button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    background: rgba(255, 62, 0, 0.2);
    color: #ff3e00;
    border: 1px solid #ff3e00;
    border-radius: 6px;
    cursor: pointer;
  }

  .nav-button:hover {
    background: rgba(255, 62, 0, 0.3);
  }

  .message-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .message {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background: rgba(255, 62, 0, 0.1);
    border-radius: 4px;
    color: #a0a0b0;
    font-size: 0.875rem;
  }

  .info {
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    font-size: 0.875rem;
    color: #a0a0b0;
  }

  .info p {
    margin: 0.25rem 0;
  }
</style>
