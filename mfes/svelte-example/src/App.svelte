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
    currentPath: string;
  }

  let { auth: initialAuth, eventBus, navigate, basePath, currentPath: initialPath }: Props = $props();

  let messages = $state<string[]>([]);
  let auth = $state<AuthContext>(initialAuth);
  let currentPath = $state(initialPath);
  let unsubNotification: (() => void) | null = null;
  let unsubAuth: (() => void) | null = null;
  let unsubNav: (() => void) | null = null;

  // Determine active tab from currentPath
  let activeTab = $derived(() => {
    if (currentPath === basePath || currentPath === `${basePath}/`) return 'reports';
    if (currentPath.startsWith(`${basePath}/charts`)) return 'charts';
    if (currentPath.startsWith(`${basePath}/export`)) return 'export';
    return 'reports';
  });

  onMount(() => {
    unsubNotification = eventBus.on('notification:show', (payload) => {
      const msg = payload as { message: string };
      messages = [...messages, msg.message].slice(-5);
    });

    unsubAuth = eventBus.on('auth:changed', (payload) => {
      const authPayload = payload as { user: User | null; token: string | null; isAuthenticated: boolean };
      auth = {
        ...auth,
        user: authPayload.user,
        token: authPayload.token,
        isAuthenticated: authPayload.isAuthenticated,
      };
    });

    unsubNav = eventBus.on('navigation:changed', (payload) => {
      const navPayload = payload as { path: string };
      currentPath = navPayload.path;
    });
  });

  onDestroy(() => {
    if (unsubNotification) unsubNotification();
    if (unsubAuth) unsubAuth();
    if (unsubNav) unsubNav();
  });

  // ============ Reports Tab State ============
  let reports = $state([
    { id: 1, name: 'Monthly Revenue', type: 'financial', generated: '2024-12-15', size: '2.4 MB' },
    { id: 2, name: 'User Growth', type: 'analytics', generated: '2024-12-18', size: '1.1 MB' },
    { id: 3, name: 'System Health', type: 'technical', generated: '2024-12-20', size: '890 KB' },
  ]);

  function generateReport() {
    const types = ['financial', 'analytics', 'technical'];
    const newReport = {
      id: reports.length + 1,
      name: `Report ${reports.length + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      generated: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
    };
    reports = [...reports, newReport];
    eventBus.emit('notification:show', {
      type: 'success',
      message: `Generated: ${newReport.name}`,
    });
  }

  function deleteReport(id: number) {
    const report = reports.find(r => r.id === id);
    reports = reports.filter(r => r.id !== id);
    eventBus.emit('notification:show', {
      type: 'warning',
      message: `Deleted: ${report?.name}`,
    });
  }

  // ============ Charts Tab State ============
  let chartData = $state<number[]>([45, 62, 78, 54, 89, 67, 72]);
  let chartType = $state<'bar' | 'line'>('bar');

  function refreshChartData() {
    chartData = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100));
    eventBus.emit('notification:show', {
      type: 'info',
      message: 'Chart data refreshed',
    });
  }

  // ============ Export Tab State ============
  let exportFormat = $state('csv');
  let exportOptions = $state({
    includeHeaders: true,
    dateRange: 'last30',
    compression: false,
  });
  let isExporting = $state(false);

  async function startExport() {
    isExporting = true;
    eventBus.emit('notification:show', {
      type: 'info',
      message: `Starting ${exportFormat.toUpperCase()} export...`,
    });

    // Simulate export
    await new Promise(resolve => setTimeout(resolve, 2000));

    isExporting = false;
    eventBus.emit('notification:show', {
      type: 'success',
      message: `Export complete! Format: ${exportFormat.toUpperCase()}`,
    });
    eventBus.emit('export:complete', {
      format: exportFormat,
      options: exportOptions,
      timestamp: Date.now(),
    });
  }
</script>

<div class="container">
  <div class="header">
    <h1 class="title">Svelte Reports</h1>
    <p class="subtitle">Welcome, {auth.user?.name ?? 'Guest'}!</p>
  </div>

  <!-- Reports Tab -->
  {#if activeTab() === 'reports'}
    <div class="tab-content">
      <h2 class="tab-title">Report Manager</h2>
      <p class="description">
        Svelte 5's $state rune for reactive arrays with #each blocks.
      </p>

      <button class="button" onclick={generateReport}>Generate New Report</button>

      <div class="report-list">
        {#each reports as report (report.id)}
          <div class="report-item">
            <div class="report-icon">
              {#if report.type === 'financial'}
                💰
              {:else if report.type === 'analytics'}
                📊
              {:else}
                🔧
              {/if}
            </div>
            <div class="report-info">
              <div class="report-name">{report.name}</div>
              <div class="report-meta">{report.generated} • {report.size}</div>
            </div>
            <span class="report-type {report.type}">{report.type}</span>
            <button class="delete-btn" onclick={() => deleteReport(report.id)}>Delete</button>
          </div>
        {/each}
      </div>

      <div class="info-box">
        <strong>Keyed Each Block:</strong> Using (report.id) for efficient DOM updates when items change.
      </div>
    </div>
  {/if}

  <!-- Charts Tab -->
  {#if activeTab() === 'charts'}
    <div class="tab-content">
      <h2 class="tab-title">Data Visualization</h2>
      <p class="description">
        Interactive charts with Svelte's reactive declarations.
      </p>

      <div class="chart-controls">
        <div class="chart-type-selector">
          <button
            class="type-btn"
            class:active={chartType === 'bar'}
            onclick={() => chartType = 'bar'}
          >
            Bar Chart
          </button>
          <button
            class="type-btn"
            class:active={chartType === 'line'}
            onclick={() => chartType = 'line'}
          >
            Line Chart
          </button>
        </div>
        <button class="button" onclick={refreshChartData}>Refresh Data</button>
      </div>

      <div class="chart-container">
        {#if chartType === 'bar'}
          <div class="bar-chart">
            {#each chartData as value, index}
              <div class="bar-wrapper">
                <div
                  class="bar"
                  style="height: {value}%; background: hsl({15 + index * 5}, 70%, 50%)"
                ></div>
                <span class="bar-label">{value}</span>
              </div>
            {/each}
          </div>
        {:else}
          <svg class="line-chart" viewBox="0 0 300 150">
            <polyline
              fill="none"
              stroke="#ff3e00"
              stroke-width="2"
              points={chartData.map((v, i) => `${i * 45 + 20},${150 - v * 1.4}`).join(' ')}
            />
            {#each chartData as value, index}
              <circle
                cx={index * 45 + 20}
                cy={150 - value * 1.4}
                r="4"
                fill="#ff3e00"
              />
            {/each}
          </svg>
        {/if}
      </div>

      <div class="stats-row">
        <div class="stat">
          <div class="stat-value">{Math.max(...chartData)}</div>
          <div class="stat-label">Max</div>
        </div>
        <div class="stat">
          <div class="stat-value">{Math.min(...chartData)}</div>
          <div class="stat-label">Min</div>
        </div>
        <div class="stat">
          <div class="stat-value">{Math.round(chartData.reduce((a, b) => a + b, 0) / chartData.length)}</div>
          <div class="stat-label">Average</div>
        </div>
      </div>

      <div class="info-box">
        <strong>Reactive SVG:</strong> Chart updates automatically when data changes using Svelte's reactivity.
      </div>
    </div>
  {/if}

  <!-- Export Tab -->
  {#if activeTab() === 'export'}
    <div class="tab-content">
      <h2 class="tab-title">Export Data</h2>
      <p class="description">
        Form bindings and async operations with loading states.
      </p>

      <div class="form-group">
        <label class="input-label">Export Format</label>
        <div class="format-selector">
          {#each ['csv', 'json', 'xlsx', 'pdf'] as format}
            <button
              class="format-btn"
              class:active={exportFormat === format}
              onclick={() => exportFormat = format}
            >
              {format.toUpperCase()}
            </button>
          {/each}
        </div>
      </div>

      <div class="form-group">
        <label class="input-label">Date Range</label>
        <select bind:value={exportOptions.dateRange} class="select-input">
          <option value="last7">Last 7 days</option>
          <option value="last30">Last 30 days</option>
          <option value="last90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" bind:checked={exportOptions.includeHeaders} class="toggle-input" />
          <span class="toggle-text">Include Headers</span>
        </label>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" bind:checked={exportOptions.compression} class="toggle-input" />
          <span class="toggle-text">Compress Output (ZIP)</span>
        </label>
      </div>

      <button
        class="button export-btn"
        onclick={startExport}
        disabled={isExporting}
      >
        {#if isExporting}
          <span class="spinner"></span>
          Exporting...
        {:else}
          Export as {exportFormat.toUpperCase()}
        {/if}
      </button>

      <div class="export-preview">
        <strong>Export Configuration:</strong>
        <pre>{JSON.stringify({ format: exportFormat, ...exportOptions }, null, 2)}</pre>
      </div>

      <div class="info-box">
        <strong>Async/Await:</strong> Export button shows loading state during simulated async operation.
      </div>
    </div>
  {/if}

  <!-- Event Log -->
  {#if messages.length > 0}
    <div class="event-log">
      <h3 class="event-log-title">Event Log</h3>
      <ul class="message-list">
        {#each messages as msg, i}
          <li class="message">{msg}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <div class="footer">
    <p><strong>Base Path:</strong> {basePath} | <strong>Current:</strong> {currentPath} | <strong>Auth:</strong> {auth.isAuthenticated ? 'Logged In' : 'Not Logged In'}</p>
  </div>
</div>

<style>
  .container {
    padding: 2rem;
    min-height: 100%;
    background: linear-gradient(135deg, #2d1515 0%, #1a0a0a 100%);
    position: relative;
  }

  .container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 30% 20%, rgba(255, 62, 0, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 70% 80%, rgba(255, 62, 0, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }

  .header {
    margin-bottom: 2rem;
    position: relative;
  }

  .title {
    margin: 0 0 0.5rem;
    font-size: 2.25rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ff3e00 0%, #ff6b35 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
  }

  .subtitle {
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 1rem;
  }

  .tab-content {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 16px;
    padding: 2rem;
    border: 1px solid rgba(255, 62, 0, 0.15);
    margin-bottom: 1.5rem;
    backdrop-filter: blur(10px);
    position: relative;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  }

  .tab-title {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 600;
    color: #ffffff;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tab-title::before {
    content: '';
    display: inline-block;
    width: 4px;
    height: 1.25rem;
    background: linear-gradient(180deg, #ff3e00 0%, #ff6b35 100%);
    border-radius: 2px;
  }

  .description {
    margin: 0 0 1.5rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .button {
    padding: 0.875rem 1.75rem;
    font-size: 1rem;
    background: linear-gradient(135deg, #ff3e00 0%, #e63600 100%);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(255, 62, 0, 0.3);
  }

  .button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 62, 0, 0.4);
  }

  .button:active {
    transform: translateY(0);
  }

  .button:disabled {
    background: #444;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .report-list {
    margin-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .report-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 10px;
    border: 1px solid rgba(255, 62, 0, 0.1);
    transition: all 0.2s ease;
  }

  .report-item:hover {
    background: rgba(255, 62, 0, 0.08);
    border-color: rgba(255, 62, 0, 0.2);
  }

  .report-icon {
    font-size: 1.75rem;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
  }

  .report-info {
    flex: 1;
  }

  .report-name {
    color: #ffffff;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .report-meta {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
  }

  .report-type {
    padding: 0.375rem 0.875rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: capitalize;
  }

  .report-type.financial {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .report-type.analytics {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
  }

  .report-type.technical {
    background: rgba(168, 85, 247, 0.15);
    color: #c084fc;
    border: 1px solid rgba(168, 85, 247, 0.3);
  }

  .delete-btn {
    padding: 0.375rem 0.875rem;
    background: transparent;
    color: rgba(239, 68, 68, 0.8);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .delete-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.5);
    color: #ef4444;
  }

  .chart-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .chart-type-selector {
    display: flex;
    gap: 0.5rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 0.25rem;
    border-radius: 8px;
  }

  .type-btn {
    padding: 0.625rem 1.25rem;
    background: transparent;
    color: rgba(255, 255, 255, 0.6);
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .type-btn:hover {
    color: #ff3e00;
  }

  .type-btn.active {
    background: rgba(255, 62, 0, 0.2);
    color: #ff3e00;
    box-shadow: 0 2px 8px rgba(255, 62, 0, 0.15);
  }

  .chart-container {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255, 62, 0, 0.1);
  }

  .bar-chart {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    height: 160px;
    padding: 0 0.5rem;
  }

  .bar-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .bar {
    width: 100%;
    border-radius: 6px 6px 0 0;
    transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 4px;
    box-shadow: 0 -2px 10px rgba(255, 62, 0, 0.2);
  }

  .bar-label {
    margin-top: 0.75rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
  }

  .line-chart {
    width: 100%;
    height: 160px;
  }

  .line-chart polyline {
    filter: drop-shadow(0 2px 4px rgba(255, 62, 0, 0.3));
  }

  .line-chart circle {
    filter: drop-shadow(0 2px 4px rgba(255, 62, 0, 0.4));
  }

  .stats-row {
    display: flex;
    gap: 1rem;
  }

  .stat {
    flex: 1;
    text-align: center;
    padding: 1.25rem 1rem;
    background: rgba(0, 0, 0, 0.25);
    border-radius: 10px;
    border: 1px solid rgba(255, 62, 0, 0.1);
    transition: all 0.2s ease;
  }

  .stat:hover {
    border-color: rgba(255, 62, 0, 0.25);
  }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    background: linear-gradient(135deg, #ff3e00 0%, #ff6b35 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .stat-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 0.25rem;
    font-weight: 500;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .input-label {
    display: block;
    margin-bottom: 0.5rem;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .format-selector {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .format-btn {
    padding: 0.75rem 1.5rem;
    background: rgba(0, 0, 0, 0.25);
    color: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(255, 62, 0, 0.2);
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }

  .format-btn:hover {
    border-color: rgba(255, 62, 0, 0.4);
    color: #ff3e00;
  }

  .format-btn.active {
    border-color: #ff3e00;
    background: rgba(255, 62, 0, 0.15);
    color: #ff3e00;
    box-shadow: 0 2px 8px rgba(255, 62, 0, 0.2);
  }

  .select-input {
    width: 100%;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 62, 0, 0.2);
    border-radius: 8px;
    color: #ffffff;
    transition: all 0.2s ease;
  }

  .select-input:focus {
    outline: none;
    border-color: #ff3e00;
    box-shadow: 0 0 0 3px rgba(255, 62, 0, 0.15);
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    color: #ffffff;
    padding: 0.75rem 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .toggle-label:hover {
    background: rgba(255, 62, 0, 0.1);
  }

  .toggle-input {
    width: 20px;
    height: 20px;
    accent-color: #ff3e00;
    cursor: pointer;
  }

  .toggle-text {
    font-size: 1rem;
    flex: 1;
  }

  .export-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .export-preview {
    margin-top: 1.5rem;
    padding: 1.25rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
    border: 1px solid rgba(255, 62, 0, 0.1);
  }

  .export-preview strong {
    color: rgba(255, 255, 255, 0.8);
  }

  .export-preview pre {
    margin: 0.75rem 0 0;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    color: #ff6b35;
    font-size: 0.8rem;
    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
    overflow-x: auto;
  }

  .info-box {
    margin-top: 1.5rem;
    padding: 1rem 1.25rem;
    background: linear-gradient(135deg, rgba(255, 62, 0, 0.1) 0%, rgba(255, 62, 0, 0.05) 100%);
    border-radius: 10px;
    border: 1px solid rgba(255, 62, 0, 0.2);
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.6;
  }

  .info-box strong {
    color: #ff3e00;
  }

  .event-log {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 1rem;
    border: 1px solid rgba(255, 62, 0, 0.1);
  }

  .event-log-title {
    margin: 0 0 0.75rem;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .message-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .message {
    padding: 0.625rem 0.875rem;
    background: rgba(255, 62, 0, 0.08);
    border-radius: 6px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    border-left: 2px solid #ff3e00;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .footer {
    padding: 1rem 1.25rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
  }

  .footer strong {
    color: rgba(255, 255, 255, 0.6);
  }
</style>
