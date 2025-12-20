import { createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';

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

interface AppProps {
  auth: AuthContext;
  eventBus: EventBus;
  navigate: (path: string) => void;
  basePath: string;
}

export default function App(props: AppProps) {
  // Signals are SolidJS's reactive primitives
  const [count, setCount] = createSignal(0);
  const [messages, setMessages] = createSignal<string[]>([]);

  onMount(() => {
    console.log('[SolidJS] Component mounted');

    // Subscribe to events from other MFEs
    const unsubscribe = props.eventBus.on('notification:show', (payload) => {
      const msg = payload as { message: string };
      setMessages((prev) => [...prev, msg.message].slice(-5));
    });

    // onCleanup registers cleanup logic
    onCleanup(() => {
      unsubscribe();
      console.log('[SolidJS] Cleanup complete');
    });
  });

  // createEffect automatically tracks dependencies
  createEffect(() => {
    if (count() > 0) {
      console.log('Count changed to:', count());
    }
  });

  const handleIncrement = () => {
    setCount(count() + 1);
    props.eventBus.emit('notification:show', {
      type: 'info',
      message: `SolidJS count: ${count() + 1}`,
    });
  };

  const handleNavigate = (path: string) => {
    props.navigate(path);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>SolidJS App</h1>
        <p style={styles.subtitle}>
          Welcome, {props.auth.user?.name ?? 'Guest'}!
        </p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Counter Demo (Fine-Grained Reactivity)</h2>
          <p style={styles.counter}>{count()}</p>
          <button style={styles.button} onClick={handleIncrement}>
            Increment
          </button>
          <p style={styles.note}>
            Note: Only the counter DOM node updates, not the entire component!
          </p>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Navigation</h2>
          <div style={styles.navButtons}>
            <button
              style={styles.navButton}
              onClick={() => handleNavigate(`${props.basePath}/signals`)}
            >
              Go to Signals
            </button>
            <button
              style={styles.navButton}
              onClick={() => handleNavigate('/react')}
            >
              Go to React MFE
            </button>
            <button
              style={styles.navButton}
              onClick={() => handleNavigate('/vue')}
            >
              Go to Vue MFE
            </button>
          </div>
        </div>

        <Show when={messages().length > 0}>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Event Log</h2>
            <ul style={styles.messageList}>
              <For each={messages()}>
                {(msg) => <li style={styles.message}>{msg}</li>}
              </For>
            </ul>
          </div>
        </Show>

        <div style={styles.info}>
          <p>
            <strong>Base Path:</strong> {props.basePath}
          </p>
          <p>
            <strong>Auth Status:</strong>{' '}
            {props.auth.isAuthenticated ? 'Logged In' : 'Not Logged In'}
          </p>
          <Show when={props.auth.user}>
            <p>
              <strong>Roles:</strong> {props.auth.user!.roles.join(', ')}
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, string> = {
  container: `
    padding: 2rem;
    min-height: 100%;
    background: linear-gradient(135deg, #1e3a5f 0%, #0f1f3a 100%);
  `,
  card: `
    max-width: 800px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `,
  title: `
    margin: 0 0 0.5rem;
    font-size: 2rem;
    color: #4f88c6;
  `,
  subtitle: `
    margin: 0 0 2rem;
    color: #a0a0b0;
  `,
  section: `
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  `,
  sectionTitle: `
    margin: 0 0 1rem;
    font-size: 1.25rem;
    color: #ffffff;
  `,
  counter: `
    font-size: 3rem;
    font-weight: bold;
    color: #4f88c6;
    margin: 0 0 1rem;
  `,
  button: `
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    background: #4f88c6;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
  `,
  note: `
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #a0a0b0;
    font-style: italic;
  `,
  navButtons: `
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  `,
  navButton: `
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    background: rgba(79, 136, 198, 0.2);
    color: #4f88c6;
    border: 1px solid #4f88c6;
    border-radius: 6px;
    cursor: pointer;
  `,
  messageList: `
    list-style: none;
    padding: 0;
    margin: 0;
  `,
  message: `
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    background: rgba(79, 136, 198, 0.1);
    border-radius: 4px;
    color: #a0a0b0;
    font-size: 0.875rem;
  `,
  info: `
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    font-size: 0.875rem;
    color: #a0a0b0;
  `,
};
