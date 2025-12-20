import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

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

interface MfeProps {
  container: HTMLElement;
  basePath: string;
  auth: AuthContext;
  eventBus: EventBus;
  navigate: (path: string) => void;
  theme: 'light' | 'dark';
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <div class="card">
        <h1 class="title">Angular App</h1>
        <p class="subtitle">Welcome, {{ userName }}!</p>

        <div class="section">
          <h2 class="section-title">Counter Demo</h2>
          <p class="counter">{{ count }}</p>
          <button class="button" (click)="increment()">Increment</button>
        </div>

        <div class="section">
          <h2 class="section-title">Navigation</h2>
          <div class="nav-buttons">
            <button class="nav-button" (click)="navigateTo(basePath + '/components')">
              Go to Components
            </button>
            <button class="nav-button" (click)="navigateTo('/react')">
              Go to React MFE
            </button>
            <button class="nav-button" (click)="navigateTo('/vue')">
              Go to Vue MFE
            </button>
          </div>
        </div>

        <div class="section" *ngIf="messages.length > 0">
          <h2 class="section-title">Event Log</h2>
          <ul class="message-list">
            <li class="message" *ngFor="let msg of messages">{{ msg }}</li>
          </ul>
        </div>

        <div class="info">
          <p><strong>Base Path:</strong> {{ basePath }}</p>
          <p><strong>Auth Status:</strong> {{ isAuthenticated ? 'Logged In' : 'Not Logged In' }}</p>
          <p *ngIf="userRoles"><strong>Roles:</strong> {{ userRoles }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 2rem;
      min-height: 100%;
      background: linear-gradient(135deg, #dd0031 0%, #8b0020 100%);
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
      color: #ffffff;
    }

    .subtitle {
      margin: 0 0 2rem;
      color: rgba(255, 255, 255, 0.7);
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
      color: #ffffff;
      margin: 0 0 1rem;
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
    }

    .button:hover {
      background: #f0f0f0;
    }

    .nav-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .nav-button {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 6px;
      cursor: pointer;
    }

    .nav-button:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .message-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .message {
      padding: 0.5rem;
      margin-bottom: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.875rem;
    }

    .info {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .info p {
      margin: 0.25rem 0;
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  count = 0;
  messages: string[] = [];
  private unsubscribe?: () => void;

  get props(): MfeProps | undefined {
    return (window as unknown as { __MFE_PROPS__?: MfeProps }).__MFE_PROPS__;
  }

  get userName(): string {
    return this.props?.auth.user?.name ?? 'Guest';
  }

  get basePath(): string {
    return this.props?.basePath ?? '/angular';
  }

  get isAuthenticated(): boolean {
    return this.props?.auth.isAuthenticated ?? false;
  }

  get userRoles(): string | null {
    const roles = this.props?.auth.user?.roles;
    return roles ? roles.join(', ') : null;
  }

  ngOnInit(): void {
    if (this.props?.eventBus) {
      this.unsubscribe = this.props.eventBus.on('notification:show', (payload) => {
        const msg = payload as { message: string };
        this.messages = [...this.messages, msg.message].slice(-5);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  increment(): void {
    this.count++;
    this.props?.eventBus.emit('notification:show', {
      type: 'info',
      message: `Angular count: ${this.count}`,
    });
  }

  navigateTo(path: string): void {
    this.props?.navigate(path);
  }
}
