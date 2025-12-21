import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MFE_PROPS } from './app.config';

interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header">
        <h1 class="title">Angular App</h1>
        <p class="subtitle">Welcome, {{ userName() }}!</p>
      </div>

      <!-- Overview Tab -->
      <div class="tab-content" *ngIf="activeTab() === 'overview'">
        <h2 class="tab-title">Angular Overview</h2>
        <p class="description">
          Angular 19 with Signals - the new reactive primitive for fine-grained updates.
        </p>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ count() }}</div>
            <div class="stat-label">Counter</div>
            <button class="button" (click)="increment()">Increment</button>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ doubleCount() }}</div>
            <div class="stat-label">Double (Computed)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ isAuthenticated() ? '1' : '0' }}</div>
            <div class="stat-label">Sessions</div>
          </div>
        </div>

        <div class="info-box">
          <strong>Angular Signals:</strong> Angular 19 introduces signals for fine-grained reactivity.
          The count() signal only updates the specific DOM node that displays it.
        </div>
      </div>

      <!-- Components Tab -->
      <div class="tab-content" *ngIf="activeTab() === 'components'">
        <h2 class="tab-title">Component Features</h2>
        <p class="description">
          Demonstrating Angular's template directives and component patterns.
        </p>

        <div class="demo-section">
          <h3 class="section-title">*ngFor with trackBy</h3>
          <button class="button" (click)="addItem()">Add Item</button>
          <button class="button secondary" (click)="shuffleItems()">Shuffle</button>

          <div class="item-list">
            <div class="item" *ngFor="let item of items(); trackBy: trackById">
              <span class="item-id">#{{ item.id }}</span>
              <span class="item-name">{{ item.name }}</span>
              <span class="item-status" [class.active]="item.active">
                {{ item.active ? 'Active' : 'Inactive' }}
              </span>
              <button class="toggle-btn" (click)="toggleItem(item.id)">Toggle</button>
              <button class="delete-btn" (click)="removeItem(item.id)">Remove</button>
            </div>
          </div>
        </div>

        <div class="demo-section">
          <h3 class="section-title">*ngIf with else template</h3>
          <button class="button" (click)="toggleCondition()">
            Toggle Condition ({{ showContent() }})
          </button>

          <div *ngIf="showContent(); else elseBlock" class="condition-box success">
            This content is shown when condition is TRUE
          </div>
          <ng-template #elseBlock>
            <div class="condition-box warning">
              This is the ELSE template content
            </div>
          </ng-template>
        </div>

        <div class="info-box">
          <strong>trackBy:</strong> Optimizes *ngFor by tracking items by ID instead of reference,
          preventing unnecessary DOM recreation.
        </div>
      </div>

      <!-- Services Tab -->
      <div class="tab-content" *ngIf="activeTab() === 'services'">
        <h2 class="tab-title">Service Patterns</h2>
        <p class="description">
          Demonstrating dependency injection and service communication patterns.
        </p>

        <div class="demo-section">
          <h3 class="section-title">Event Bus Integration</h3>
          <div class="form-group">
            <label class="input-label">Custom Message</label>
            <input
              type="text"
              [(ngModel)]="customMessage"
              class="text-input"
              placeholder="Enter a message..."
            />
          </div>
          <button class="button" (click)="emitCustomEvent()">
            Emit Custom Event
          </button>
        </div>

        <div class="demo-section">
          <h3 class="section-title">Service State</h3>
          <div class="state-display">
            <div class="state-item">
              <span class="state-label">Total Increments:</span>
              <span class="state-value">{{ totalIncrements() }}</span>
            </div>
            <div class="state-item">
              <span class="state-label">Items Count:</span>
              <span class="state-value">{{ items().length }}</span>
            </div>
            <div class="state-item">
              <span class="state-label">Active Items:</span>
              <span class="state-value">{{ activeItemsCount() }}</span>
            </div>
          </div>
          <button class="button secondary" (click)="resetState()">Reset All State</button>
        </div>

        <div class="demo-section">
          <h3 class="section-title">Cross-MFE Communication</h3>
          <div class="button-group">
            <button class="button" (click)="navigateTo('/react')">
              Navigate to React
            </button>
            <button class="button" (click)="navigateTo('/vue')">
              Navigate to Vue
            </button>
            <button class="button" (click)="navigateTo('/svelte')">
              Navigate to Svelte
            </button>
          </div>
        </div>

        <div class="info-box">
          <strong>inject():</strong> Angular 14+ allows using inject() function instead of constructor injection,
          making it easier to share logic between components.
        </div>
      </div>

      <!-- Event Log -->
      <div class="event-log" *ngIf="messages().length > 0">
        <h3 class="event-log-title">Event Log</h3>
        <ul class="message-list">
          <li class="message" *ngFor="let msg of messages()">{{ msg }}</li>
        </ul>
      </div>

      <div class="footer">
        <p>
          <strong>Base Path:</strong> {{ basePath }} |
          <strong>Current:</strong> {{ currentPath() }} |
          <strong>Auth:</strong> {{ isAuthenticated() ? 'Logged In' : 'Not Logged In' }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      min-height: 100%;
      background: linear-gradient(135deg, #dd0031 0%, #8b0020 100%);
    }

    .header {
      margin-bottom: 2rem;
    }

    .title {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      color: #ffffff;
    }

    .subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
    }

    .tab-content {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.1);
      margin-bottom: 1.5rem;
    }

    .tab-title {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      color: #ffffff;
    }

    .description {
      margin: 0 0 1.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-card {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #ffffff;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 0.5rem;
    }

    .button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      background: #ffffff;
      color: #dd0031;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      margin-right: 0.5rem;
    }

    .button:hover {
      background: #f0f0f0;
    }

    .button.secondary {
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.5);
    }

    .info-box {
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.8);
    }

    .demo-section {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-title {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: #ffffff;
    }

    .item-list {
      margin-top: 1rem;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .item-id {
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.8rem;
      min-width: 40px;
    }

    .item-name {
      flex: 1;
      color: #ffffff;
    }

    .item-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .item-status.active {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }

    .toggle-btn {
      padding: 0.25rem 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .delete-btn {
      padding: 0.25rem 0.5rem;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid #ef4444;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
    }

    .condition-box {
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      text-align: center;
    }

    .condition-box.success {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid #22c55e;
    }

    .condition-box.warning {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
      border: 1px solid #f59e0b;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .input-label {
      display: block;
      margin-bottom: 0.5rem;
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .text-input {
      width: 100%;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      color: #ffffff;
    }

    .state-display {
      margin-bottom: 1rem;
    }

    .state-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .state-label {
      color: rgba(255, 255, 255, 0.7);
    }

    .state-value {
      color: #ffffff;
      font-weight: 600;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .event-log {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .event-log-title {
      margin: 0 0 0.5rem;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .message-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .message {
      padding: 0.5rem;
      margin-bottom: 0.25rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.8rem;
    }

    .footer {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.7);
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private props = inject(MFE_PROPS, { optional: true });

  // Signals for reactive state
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);
  totalIncrements = signal(0);

  messages = signal<string[]>([]);
  auth = signal<{ user: User | null; token: string | null; isAuthenticated: boolean } | null>(null);

  showContent = signal(true);
  customMessage = '';

  items = signal([
    { id: 1, name: 'Component A', active: true },
    { id: 2, name: 'Component B', active: false },
    { id: 3, name: 'Component C', active: true },
  ]);

  activeItemsCount = computed(() => this.items().filter(i => i.active).length);

  private unsubNotification?: () => void;
  private unsubAuth?: () => void;
  private unsubNav?: () => void;

  userName = computed(() => this.auth()?.user?.name ?? 'Guest');
  isAuthenticated = computed(() => this.auth()?.isAuthenticated ?? false);

  get basePath(): string {
    return this.props?.basePath ?? '/angular';
  }

  currentPath = signal('/angular');

  activeTab = computed(() => {
    const path = this.currentPath();
    const base = this.basePath;
    if (path === base || path === `${base}/`) return 'overview';
    if (path.startsWith(`${base}/components`)) return 'components';
    if (path.startsWith(`${base}/services`)) return 'services';
    return 'overview';
  });

  ngOnInit(): void {
    // Initialize currentPath from props
    if (this.props?.navigation?.currentPath) {
      this.currentPath.set(this.props.navigation.currentPath);
    }

    if (this.props?.auth) {
      this.auth.set({
        user: this.props.auth.user,
        token: this.props.auth.token,
        isAuthenticated: this.props.auth.isAuthenticated,
      });
    }

    if (this.props?.eventBus) {
      this.unsubNotification = this.props.eventBus.on('notification:show', (payload) => {
        const msg = payload as { message: string };
        this.messages.update(msgs => [...msgs, msg.message].slice(-5));
        this.cdr.markForCheck();
      });

      this.unsubAuth = this.props.eventBus.on('auth:changed', (payload) => {
        const authPayload = payload as { user: User | null; token: string | null; isAuthenticated: boolean };
        this.auth.set({
          user: authPayload.user,
          token: authPayload.token,
          isAuthenticated: authPayload.isAuthenticated,
        });
        this.cdr.markForCheck();
      });

      this.unsubNav = this.props.eventBus.on('navigation:changed', (payload) => {
        const navPayload = payload as { path: string };
        this.currentPath.set(navPayload.path);
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.unsubNotification) this.unsubNotification();
    if (this.unsubAuth) this.unsubAuth();
    if (this.unsubNav) this.unsubNav();
  }

  increment(): void {
    this.count.update(c => c + 1);
    this.totalIncrements.update(t => t + 1);
    this.props?.eventBus.emit('notification:show', {
      type: 'info',
      message: `Angular count: ${this.count()}`,
    });
  }

  // Items management
  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }

  addItem(): void {
    const newId = Math.max(...this.items().map(i => i.id), 0) + 1;
    this.items.update(items => [...items, { id: newId, name: `Component ${String.fromCharCode(64 + newId)}`, active: false }]);
    this.props?.eventBus.emit('notification:show', {
      type: 'success',
      message: `Added Component ${String.fromCharCode(64 + newId)}`,
    });
  }

  removeItem(id: number): void {
    const item = this.items().find(i => i.id === id);
    this.items.update(items => items.filter(i => i.id !== id));
    this.props?.eventBus.emit('notification:show', {
      type: 'warning',
      message: `Removed ${item?.name}`,
    });
  }

  toggleItem(id: number): void {
    this.items.update(items =>
      items.map(i => i.id === id ? { ...i, active: !i.active } : i)
    );
  }

  shuffleItems(): void {
    this.items.update(items => [...items].sort(() => Math.random() - 0.5));
    this.props?.eventBus.emit('notification:show', {
      type: 'info',
      message: 'Items shuffled',
    });
  }

  toggleCondition(): void {
    this.showContent.update(v => !v);
  }

  emitCustomEvent(): void {
    if (this.customMessage.trim()) {
      this.props?.eventBus.emit('notification:show', {
        type: 'info',
        message: this.customMessage,
      });
      this.props?.eventBus.emit('angular:custom', {
        message: this.customMessage,
        timestamp: Date.now(),
      });
      this.customMessage = '';
    }
  }

  resetState(): void {
    this.count.set(0);
    this.totalIncrements.set(0);
    this.items.set([
      { id: 1, name: 'Component A', active: true },
      { id: 2, name: 'Component B', active: false },
      { id: 3, name: 'Component C', active: true },
    ]);
    this.props?.eventBus.emit('notification:show', {
      type: 'warning',
      message: 'State reset to defaults',
    });
  }

  navigateTo(path: string): void {
    this.props?.navigate(path);
  }
}
