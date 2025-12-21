import { useState, useEffect } from 'react';

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

export default function App({ auth: initialAuth, eventBus, navigate, basePath }: AppProps) {
  const [count, setCount] = useState(0);
  const [messages, setMessages] = useState<string[]>([]);
  const [auth, setAuth] = useState(initialAuth);

  useEffect(() => {
    // Listen for events from other MFEs
    const unsubNotification = eventBus.on('notification:show', (payload) => {
      const msg = payload as { message: string };
      setMessages((prev) => [...prev, msg.message]);
    });

    // Listen for auth changes from shell
    const unsubAuth = eventBus.on('auth:changed', (payload) => {
      const authPayload = payload as { user: User | null; token: string | null; isAuthenticated: boolean };
      setAuth((prev) => ({
        ...prev,
        user: authPayload.user,
        token: authPayload.token,
        isAuthenticated: authPayload.isAuthenticated,
      }));
    });

    return () => {
      unsubNotification();
      unsubAuth();
    };
  }, [eventBus]);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    eventBus.emit('notification:show', {
      type: 'info',
      message: `React counter: ${newCount}`,
    });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>React Dashboard</h1>
        <p style={styles.subtitle}>
          Welcome, {auth.user?.name ?? 'Guest'}!
        </p>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Counter Demo</h2>
          <p style={styles.counter}>{count}</p>
          <button style={styles.button} onClick={handleIncrement}>
            Increment
          </button>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Navigation</h2>
          <div style={styles.navButtons}>
            <button
              style={styles.navButton}
              onClick={() => handleNavigate(`${basePath}/analytics`)}
            >
              Go to Analytics
            </button>
            <button
              style={styles.navButton}
              onClick={() => handleNavigate('/vue')}
            >
              Go to Vue MFE
            </button>
            <button
              style={styles.navButton}
              onClick={() => handleNavigate('/svelte')}
            >
              Go to Svelte MFE
            </button>
          </div>
        </div>

        {messages.length > 0 && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Event Log</h2>
            <ul style={styles.messageList}>
              {messages.slice(-5).map((msg, i) => (
                <li key={i} style={styles.message}>
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={styles.info}>
          <p>
            <strong>Base Path:</strong> {basePath}
          </p>
          <p>
            <strong>Auth Status:</strong>{' '}
            {auth.isAuthenticated ? 'Logged In' : 'Not Logged In'}
          </p>
          {auth.user && (
            <p>
              <strong>Roles:</strong> {auth.user.roles.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '2rem',
    minHeight: '100%',
    background: 'linear-gradient(135deg, #1e3a5f 0%, #0f1f3a 100%)',
  },
  card: {
    maxWidth: '800px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  title: {
    margin: '0 0 0.5rem',
    fontSize: '2rem',
    color: '#61dafb',
  },
  subtitle: {
    margin: '0 0 2rem',
    color: '#a0a0b0',
  },
  section: {
    marginBottom: '2rem',
    padding: '1.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
  },
  sectionTitle: {
    margin: '0 0 1rem',
    fontSize: '1.25rem',
    color: '#ffffff',
  },
  counter: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#61dafb',
    margin: '0 0 1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    background: '#61dafb',
    color: '#1e3a5f',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  navButtons: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  navButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    background: 'rgba(97, 218, 251, 0.2)',
    color: '#61dafb',
    border: '1px solid #61dafb',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  messageList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  message: {
    padding: '0.5rem',
    marginBottom: '0.5rem',
    background: 'rgba(97, 218, 251, 0.1)',
    borderRadius: '4px',
    color: '#a0a0b0',
    fontSize: '0.875rem',
  },
  info: {
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#a0a0b0',
  },
};
