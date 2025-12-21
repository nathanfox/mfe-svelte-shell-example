import { useState, useEffect, useMemo } from 'react';

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

// ============ Overview Tab ============
function OverviewTab({ auth, eventBus }: { auth: AuthContext; eventBus: EventBus }) {
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    eventBus.emit('notification:show', {
      type: 'info',
      message: `React counter: ${newCount}`,
    });
  };

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>Dashboard Overview</h2>
      <p style={styles.description}>
        This tab demonstrates basic React state management and event bus communication.
      </p>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{count}</div>
          <div style={styles.statLabel}>Counter</div>
          <button style={styles.button} onClick={handleIncrement}>
            Increment
          </button>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{auth.isAuthenticated ? '1' : '0'}</div>
          <div style={styles.statLabel}>Active Sessions</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{auth.user?.roles?.length ?? 0}</div>
          <div style={styles.statLabel}>User Roles</div>
        </div>
      </div>

      <div style={styles.infoBox}>
        <strong>Event Bus Demo:</strong> Click increment to emit a notification event that the shell will display.
      </div>
    </div>
  );
}

// ============ Analytics Tab ============
function AnalyticsTab({ eventBus }: { eventBus: EventBus }) {
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setChartData((prev) => {
        const newData = [...prev, Math.floor(Math.random() * 100)].slice(-10);
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const emitAnalyticsEvent = () => {
    eventBus.emit('analytics:track', {
      event: 'button_click',
      properties: { component: 'AnalyticsTab', timestamp: Date.now() },
    });
    eventBus.emit('notification:show', {
      type: 'success',
      message: 'Analytics event tracked!',
    });
  };

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>Analytics Dashboard</h2>
      <p style={styles.description}>
        Real-time data visualization with React useEffect for intervals.
      </p>

      <div style={styles.chartContainer}>
        <div style={styles.chartTitle}>Live Activity (updates every 2s)</div>
        <div style={styles.barChart}>
          {chartData.map((value, index) => (
            <div
              key={index}
              style={{
                ...styles.bar,
                height: `${value}%`,
                background: `hsl(${200 + index * 10}, 70%, 50%)`,
              }}
            />
          ))}
        </div>
        <div style={styles.chartLabels}>
          {chartData.map((value, index) => (
            <span key={index} style={styles.chartLabel}>
              {value}
            </span>
          ))}
        </div>
      </div>

      <button style={styles.button} onClick={emitAnalyticsEvent}>
        Track Custom Event
      </button>

      <div style={styles.infoBox}>
        <strong>useEffect Demo:</strong> Data updates automatically every 2 seconds using React's effect cleanup pattern.
      </div>
    </div>
  );
}

// ============ Reports Tab ============
function ReportsTab({ auth, eventBus }: { auth: AuthContext; eventBus: EventBus }) {
  const [reports, setReports] = useState([
    { id: 1, name: 'Q4 Sales Report', status: 'completed', date: '2024-12-15' },
    { id: 2, name: 'User Engagement', status: 'pending', date: '2024-12-18' },
    { id: 3, name: 'Performance Metrics', status: 'completed', date: '2024-12-20' },
  ]);

  const generateReport = () => {
    const newReport = {
      id: reports.length + 1,
      name: `Report #${reports.length + 1}`,
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
    };
    setReports([...reports, newReport]);
    eventBus.emit('notification:show', {
      type: 'info',
      message: `New report "${newReport.name}" created`,
    });
  };

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>Reports</h2>
      <p style={styles.description}>
        Demonstrates list rendering, state updates, and conditional rendering.
      </p>

      <button style={styles.button} onClick={generateReport}>
        Generate New Report
      </button>

      <div style={styles.reportList}>
        {reports.map((report) => (
          <div key={report.id} style={styles.reportItem}>
            <div style={styles.reportInfo}>
              <div style={styles.reportName}>{report.name}</div>
              <div style={styles.reportDate}>{report.date}</div>
            </div>
            <span
              style={{
                ...styles.reportStatus,
                background: report.status === 'completed' ? '#22c55e' : '#f59e0b',
              }}
            >
              {report.status}
            </span>
          </div>
        ))}
      </div>

      {auth.isAuthenticated && (
        <div style={styles.infoBox}>
          <strong>Conditional Rendering:</strong> This info box only appears when authenticated.
        </div>
      )}
    </div>
  );
}

// ============ Admin Tab ============
function AdminTab({ auth, eventBus }: { auth: AuthContext; eventBus: EventBus }) {
  const [users] = useState([
    { id: '1', name: 'Demo User', role: 'admin' },
    { id: '2', name: 'Jane Smith', role: 'user' },
    { id: '3', name: 'Bob Johnson', role: 'editor' },
  ]);

  const broadcastMessage = () => {
    eventBus.emit('notification:show', {
      type: 'warning',
      message: 'Admin broadcast: System maintenance at midnight',
    });
    eventBus.emit('admin:broadcast', {
      message: 'System maintenance scheduled',
      sender: auth.user?.name,
    });
  };

  return (
    <div style={styles.tabContent}>
      <h2 style={styles.tabTitle}>Admin Panel</h2>
      <p style={styles.description}>
        Role-based access control demo. This tab only appears for admin users.
      </p>

      <div style={styles.adminSection}>
        <h3 style={styles.sectionTitle}>User Management</h3>
        <div style={styles.userList}>
          {users.map((user) => (
            <div key={user.id} style={styles.userItem}>
              <span>{user.name}</span>
              <span style={styles.userRole}>{user.role}</span>
            </div>
          ))}
        </div>
      </div>

      <button style={{ ...styles.button, background: '#ef4444' }} onClick={broadcastMessage}>
        Send Broadcast Message
      </button>

      <div style={styles.infoBox}>
        <strong>Permission Demo:</strong> Routes can have permissions that hide/show based on user roles.
        Current roles: {auth.user?.roles?.join(', ') || 'none'}
      </div>
    </div>
  );
}

// ============ Main App ============
export default function App({ auth: initialAuth, eventBus, basePath, currentPath: initialPath }: AppProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [auth, setAuth] = useState(initialAuth);
  const [currentPath, setCurrentPath] = useState(initialPath);

  // Determine active tab from currentPath
  const activeTab = useMemo(() => {
    if (currentPath === basePath || currentPath === `${basePath}/`) return 'overview';
    if (currentPath.startsWith(`${basePath}/analytics`)) return 'analytics';
    if (currentPath.startsWith(`${basePath}/reports`)) return 'reports';
    if (currentPath.startsWith(`${basePath}/admin`)) return 'admin';
    return 'overview';
  }, [currentPath, basePath]);

  useEffect(() => {
    const unsubNotification = eventBus.on('notification:show', (payload) => {
      const msg = payload as { message: string };
      setMessages((prev) => [...prev, msg.message].slice(-5));
    });

    const unsubAuth = eventBus.on('auth:changed', (payload) => {
      const authPayload = payload as { user: User | null; token: string | null; isAuthenticated: boolean };
      setAuth((prev) => ({
        ...prev,
        user: authPayload.user,
        token: authPayload.token,
        isAuthenticated: authPayload.isAuthenticated,
      }));
    });

    const unsubNav = eventBus.on('navigation:changed', (payload) => {
      const navPayload = payload as { path: string };
      setCurrentPath(navPayload.path);
    });

    return () => {
      unsubNotification();
      unsubAuth();
      unsubNav();
    };
  }, [eventBus]);

  const renderTab = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsTab eventBus={eventBus} />;
      case 'reports':
        return <ReportsTab auth={auth} eventBus={eventBus} />;
      case 'admin':
        return <AdminTab auth={auth} eventBus={eventBus} />;
      default:
        return <OverviewTab auth={auth} eventBus={eventBus} />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>React Dashboard</h1>
        <p style={styles.subtitle}>Welcome, {auth.user?.name ?? 'Guest'}!</p>
      </div>

      {renderTab()}

      {messages.length > 0 && (
        <div style={styles.eventLog}>
          <h3 style={styles.eventLogTitle}>Event Log</h3>
          <ul style={styles.messageList}>
            {messages.map((msg, i) => (
              <li key={i} style={styles.message}>
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.footer}>
        <p>
          <strong>Base Path:</strong> {basePath} | <strong>Current:</strong> {currentPath} |{' '}
          <strong>Auth:</strong> {auth.isAuthenticated ? 'Logged In' : 'Not Logged In'}
        </p>
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
  header: {
    marginBottom: '2rem',
  },
  title: {
    margin: '0 0 0.5rem',
    fontSize: '2rem',
    color: '#61dafb',
  },
  subtitle: {
    margin: 0,
    color: '#a0a0b0',
  },
  tabContent: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '2rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '1.5rem',
  },
  tabTitle: {
    margin: '0 0 0.5rem',
    fontSize: '1.5rem',
    color: '#ffffff',
  },
  description: {
    margin: '0 0 1.5rem',
    color: '#a0a0b0',
    fontSize: '0.9rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '1.5rem',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#61dafb',
  },
  statLabel: {
    fontSize: '0.875rem',
    color: '#a0a0b0',
    marginBottom: '0.5rem',
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
  infoBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    background: 'rgba(97, 218, 251, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(97, 218, 251, 0.3)',
    fontSize: '0.875rem',
    color: '#a0a0b0',
  },
  chartContainer: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  chartTitle: {
    color: '#ffffff',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  barChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    height: '150px',
  },
  bar: {
    flex: 1,
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
    minHeight: '10px',
  },
  chartLabels: {
    display: 'flex',
    gap: '8px',
    marginTop: '0.5rem',
  },
  chartLabel: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: '0.75rem',
    color: '#a0a0b0',
  },
  reportList: {
    marginTop: '1.5rem',
  },
  reportItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    marginBottom: '0.5rem',
  },
  reportInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  reportName: {
    color: '#ffffff',
    fontWeight: '500',
  },
  reportDate: {
    color: '#a0a0b0',
    fontSize: '0.8rem',
  },
  reportStatus: {
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    color: '#ffffff',
    textTransform: 'capitalize' as const,
  },
  adminSection: {
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: '1.1rem',
    marginBottom: '1rem',
  },
  userList: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  userItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
  },
  userRole: {
    padding: '0.125rem 0.5rem',
    background: 'rgba(97, 218, 251, 0.2)',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#61dafb',
  },
  eventLog: {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
  },
  eventLogTitle: {
    margin: '0 0 0.5rem',
    color: '#ffffff',
    fontSize: '0.9rem',
  },
  messageList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  message: {
    padding: '0.5rem',
    marginBottom: '0.25rem',
    background: 'rgba(97, 218, 251, 0.1)',
    borderRadius: '4px',
    color: '#a0a0b0',
    fontSize: '0.8rem',
  },
  footer: {
    padding: '1rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    fontSize: '0.8rem',
    color: '#a0a0b0',
  },
};
