import { createSignal, createEffect, createMemo, onMount, onCleanup, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

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
  currentPath: string;
}

// ============ Home Tab Component ============
function HomeTab(props: { auth: () => AuthContext; eventBus: EventBus }) {
  const [count, setCount] = createSignal(0);

  // createEffect automatically tracks signal dependencies
  createEffect(() => {
    if (count() > 0) {
      console.log('[SolidJS] Count changed to:', count());
    }
  });

  const handleIncrement = () => {
    setCount(count() + 1);
    props.eventBus.emit('notification:show', {
      type: 'info',
      message: `SolidJS count: ${count() + 1}`,
    });
  };

  // Derived value using createMemo
  const doubleCount = createMemo(() => count() * 2);

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>SolidJS Overview</h2>
      <p style={styles.description}>
        Fine-grained reactivity with signals - only the exact DOM nodes that depend on data update.
      </p>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{count()}</div>
          <div style={styles.statLabel}>Count</div>
          <button style={styles.button} onClick={handleIncrement}>
            Increment
          </button>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{doubleCount()}</div>
          <div style={styles.statLabel}>Double (Memo)</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{props.auth().isAuthenticated ? '1' : '0'}</div>
          <div style={styles.statLabel}>Sessions</div>
        </div>
      </div>

      <div style={styles.infoBox}>
        <strong>Fine-Grained Updates:</strong> Unlike React, only the {`{count()}`} text node updates, not the entire component tree.
      </div>
    </div>
  );
}

// ============ Signals Tab Component ============
function SignalsTab(props: { eventBus: EventBus }) {
  // Multiple independent signals
  const [firstName, setFirstName] = createSignal('John');
  const [lastName, setLastName] = createSignal('Doe');
  const [age, setAge] = createSignal(25);

  // Derived signals with createMemo
  const fullName = createMemo(() => `${firstName()} ${lastName()}`);
  const canVote = createMemo(() => age() >= 18);
  const ageCategory = createMemo(() => {
    const a = age();
    if (a < 13) return 'Child';
    if (a < 20) return 'Teen';
    if (a < 60) return 'Adult';
    return 'Senior';
  });

  // Effect that runs when signals change
  createEffect(() => {
    console.log('[Signals] Full name changed to:', fullName());
  });

  const emitSignalEvent = () => {
    props.eventBus.emit('notification:show', {
      type: 'success',
      message: `Signal state: ${fullName()}, Age: ${age()}`,
    });
  };

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>Signals Demo</h2>
      <p style={styles.description}>
        Signals are SolidJS's reactive primitives - fine-grained observable values.
      </p>

      <div style={styles.formGroup}>
        <label style={styles.inputLabel}>First Name</label>
        <input
          type="text"
          value={firstName()}
          onInput={(e) => setFirstName(e.currentTarget.value)}
          style={styles.textInput}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.inputLabel}>Last Name</label>
        <input
          type="text"
          value={lastName()}
          onInput={(e) => setLastName(e.currentTarget.value)}
          style={styles.textInput}
        />
      </div>

      <div style={styles.formGroup}>
        <label style={styles.inputLabel}>Age: {age()}</label>
        <input
          type="range"
          min="1"
          max="100"
          value={age()}
          onInput={(e) => setAge(parseInt(e.currentTarget.value))}
          style={styles.rangeInput}
        />
      </div>

      <div style={styles.derivedValues}>
        <div style={styles.derivedItem}>
          <span style={styles.derivedLabel}>Full Name (memo):</span>
          <span style={styles.derivedValue}>{fullName()}</span>
        </div>
        <div style={styles.derivedItem}>
          <span style={styles.derivedLabel}>Can Vote:</span>
          <span style={`${styles.derivedValue} color: ${canVote() ? '#22c55e' : '#ef4444'};`}>
            {canVote() ? 'Yes' : 'No'}
          </span>
        </div>
        <div style={styles.derivedItem}>
          <span style={styles.derivedLabel}>Category:</span>
          <span style={styles.derivedValue}>{ageCategory()}</span>
        </div>
      </div>

      <button style={styles.button} onClick={emitSignalEvent}>
        Emit Signal State
      </button>

      <div style={styles.infoBox}>
        <strong>createMemo:</strong> Derived values are cached and only recompute when their dependencies change.
      </div>
    </div>
  );
}

// ============ Store Tab Component ============
function StoreTab(props: { eventBus: EventBus }) {
  // SolidJS Store for complex nested state
  const [store, setStore] = createStore({
    todos: [
      { id: 1, text: 'Learn SolidJS', completed: true },
      { id: 2, text: 'Build MFE', completed: false },
      { id: 3, text: 'Deploy to production', completed: false },
    ],
    filter: 'all' as 'all' | 'active' | 'completed',
  });

  const [newTodo, setNewTodo] = createSignal('');

  // Derived values from store
  const filteredTodos = createMemo(() => {
    switch (store.filter) {
      case 'active':
        return store.todos.filter((t) => !t.completed);
      case 'completed':
        return store.todos.filter((t) => t.completed);
      default:
        return store.todos;
    }
  });

  const stats = createMemo(() => ({
    total: store.todos.length,
    completed: store.todos.filter((t) => t.completed).length,
    active: store.todos.filter((t) => !t.completed).length,
  }));

  const addTodo = () => {
    if (newTodo().trim()) {
      setStore('todos', (todos) => [
        ...todos,
        { id: Date.now(), text: newTodo(), completed: false },
      ]);
      props.eventBus.emit('notification:show', {
        type: 'success',
        message: `Added: ${newTodo()}`,
      });
      setNewTodo('');
    }
  };

  const toggleTodo = (id: number) => {
    setStore('todos', (todo) => todo.id === id, 'completed', (c) => !c);
  };

  const deleteTodo = (id: number) => {
    const todo = store.todos.find((t) => t.id === id);
    setStore('todos', (todos) => todos.filter((t) => t.id !== id));
    props.eventBus.emit('notification:show', {
      type: 'warning',
      message: `Deleted: ${todo?.text}`,
    });
  };

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>Store Demo</h2>
      <p style={styles.description}>
        SolidJS stores provide nested reactivity for complex state management.
      </p>

      <div style={styles.todoInputGroup}>
        <input
          type="text"
          value={newTodo()}
          onInput={(e) => setNewTodo(e.currentTarget.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
          style={styles.todoInput}
        />
        <button style={styles.button} onClick={addTodo}>
          Add
        </button>
      </div>

      <div style={styles.filterButtons}>
        <For each={['all', 'active', 'completed'] as const}>
          {(filter) => (
            <button
              style={`${styles.filterBtn} ${store.filter === filter ? styles.filterBtnActive : ''}`}
              onClick={() => setStore('filter', filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          )}
        </For>
      </div>

      <div style={styles.todoList}>
        <For each={filteredTodos()}>
          {(todo) => (
            <div style={styles.todoItem}>
              <label style={styles.todoLabel}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                  style={styles.checkbox}
                />
                <span
                  style={`${styles.todoText} text-decoration: ${todo.completed ? 'line-through' : 'none'}; opacity: ${todo.completed ? 0.6 : 1};`}
                >
                  {todo.text}
                </span>
              </label>
              <button style={styles.deleteBtn} onClick={() => deleteTodo(todo.id)}>
                Delete
              </button>
            </div>
          )}
        </For>
      </div>

      <div style={styles.todoStats}>
        <span>Total: {stats().total}</span>
        <span>Active: {stats().active}</span>
        <span>Completed: {stats().completed}</span>
      </div>

      <div style={styles.infoBox}>
        <strong>createStore:</strong> Updates to nested properties only re-render affected DOM nodes, not the entire list.
      </div>
    </div>
  );
}

// ============ Main App ============
export default function App(props: AppProps) {
  const [messages, setMessages] = createSignal<string[]>([]);
  const [auth, setAuth] = createSignal<AuthContext>(props.auth);
  const [currentPath, setCurrentPath] = createSignal(props.currentPath);

  // Determine active tab from currentPath
  const activeTab = createMemo(() => {
    const path = currentPath();
    if (path === props.basePath || path === `${props.basePath}/`) return 'home';
    if (path.startsWith(`${props.basePath}/signals`)) return 'signals';
    if (path.startsWith(`${props.basePath}/store`)) return 'store';
    return 'home';
  });

  onMount(() => {
    console.log('[SolidJS] Component mounted');

    const unsubNotification = props.eventBus.on('notification:show', (payload) => {
      const msg = payload as { message: string };
      setMessages((prev) => [...prev, msg.message].slice(-5));
    });

    const unsubAuth = props.eventBus.on('auth:changed', (payload) => {
      const authPayload = payload as { user: User | null; token: string | null; isAuthenticated: boolean };
      setAuth((prev) => ({
        ...prev,
        user: authPayload.user,
        token: authPayload.token,
        isAuthenticated: authPayload.isAuthenticated,
      }));
    });

    const unsubNav = props.eventBus.on('navigation:changed', (payload) => {
      const navPayload = payload as { path: string };
      setCurrentPath(navPayload.path);
    });

    onCleanup(() => {
      unsubNotification();
      unsubAuth();
      unsubNav();
      console.log('[SolidJS] Cleanup complete');
    });
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>SolidJS App</h1>
        <p style={styles.subtitle}>Welcome, {auth().user?.name ?? 'Guest'}!</p>
      </div>

      <Show when={activeTab() === 'home'}>
        <HomeTab auth={auth} eventBus={props.eventBus} />
      </Show>

      <Show when={activeTab() === 'signals'}>
        <SignalsTab eventBus={props.eventBus} />
      </Show>

      <Show when={activeTab() === 'store'}>
        <StoreTab eventBus={props.eventBus} />
      </Show>

      <Show when={messages().length > 0}>
        <div style={styles.eventLog}>
          <h3 style={styles.eventLogTitle}>Event Log</h3>
          <ul style={styles.messageList}>
            <For each={messages()}>
              {(msg) => <li style={styles.message}>{msg}</li>}
            </For>
          </ul>
        </div>
      </Show>

      <div style={styles.footer}>
        <p>
          <strong>Base Path:</strong> {props.basePath} | <strong>Current:</strong> {currentPath()} |{' '}
          <strong>Auth:</strong> {auth().isAuthenticated ? 'Logged In' : 'Not Logged In'}
        </p>
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
  header: `
    margin-bottom: 2rem;
  `,
  title: `
    margin: 0 0 0.5rem;
    font-size: 2rem;
    color: #4f88c6;
  `,
  subtitle: `
    margin: 0;
    color: #a0a0b0;
  `,
  tabContent: `
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 1.5rem;
  `,
  tabTitle: `
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    color: #ffffff;
  `,
  description: `
    margin: 0 0 1.5rem;
    color: #a0a0b0;
    font-size: 0.9rem;
  `,
  statsGrid: `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  `,
  statCard: `
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
  `,
  statValue: `
    font-size: 2.5rem;
    font-weight: bold;
    color: #4f88c6;
  `,
  statLabel: `
    font-size: 0.875rem;
    color: #a0a0b0;
    margin-bottom: 0.5rem;
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
  infoBox: `
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(79, 136, 198, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(79, 136, 198, 0.3);
    font-size: 0.875rem;
    color: #a0a0b0;
  `,
  formGroup: `
    margin-bottom: 1.5rem;
  `,
  inputLabel: `
    display: block;
    margin-bottom: 0.5rem;
    color: #a0a0b0;
    font-size: 0.9rem;
  `,
  textInput: `
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #ffffff;
  `,
  rangeInput: `
    width: 100%;
    accent-color: #4f88c6;
  `,
  derivedValues: `
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  `,
  derivedItem: `
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  `,
  derivedLabel: `
    color: #a0a0b0;
  `,
  derivedValue: `
    color: #4f88c6;
    font-weight: 500;
  `,
  todoInputGroup: `
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  `,
  todoInput: `
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: #ffffff;
  `,
  filterButtons: `
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  `,
  filterBtn: `
    padding: 0.5rem 1rem;
    background: rgba(79, 136, 198, 0.2);
    color: #4f88c6;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
  `,
  filterBtnActive: `
    border-color: #4f88c6;
    background: rgba(79, 136, 198, 0.4);
  `,
  todoList: `
    margin-bottom: 1rem;
  `,
  todoItem: `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    margin-bottom: 0.5rem;
  `,
  todoLabel: `
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    color: #ffffff;
  `,
  checkbox: `
    width: 18px;
    height: 18px;
    accent-color: #4f88c6;
  `,
  todoText: `
    font-size: 1rem;
  `,
  deleteBtn: `
    padding: 0.25rem 0.75rem;
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid #ef4444;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
  `,
  todoStats: `
    display: flex;
    gap: 1.5rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    color: #a0a0b0;
    font-size: 0.9rem;
  `,
  eventLog: `
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  `,
  eventLogTitle: `
    margin: 0 0 0.5rem;
    color: #ffffff;
    font-size: 0.9rem;
  `,
  messageList: `
    list-style: none;
    padding: 0;
    margin: 0;
  `,
  message: `
    padding: 0.5rem;
    margin-bottom: 0.25rem;
    background: rgba(79, 136, 198, 0.1);
    border-radius: 4px;
    color: #a0a0b0;
    font-size: 0.8rem;
  `,
  footer: `
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    font-size: 0.8rem;
    color: #a0a0b0;
  `,
};
