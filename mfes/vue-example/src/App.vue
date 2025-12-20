<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

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

const props = defineProps<{
  auth: AuthContext;
  eventBus: EventBus;
  navigate: (path: string) => void;
  basePath: string;
}>();

const count = ref(0);
const messages = ref<string[]>([]);
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = props.eventBus.on('notification:show', (payload) => {
    const msg = payload as { message: string };
    messages.value = [...messages.value, msg.message].slice(-5);
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

function increment() {
  count.value++;
  props.eventBus.emit('notification:show', {
    type: 'info',
    message: `Vue counter: ${count.value}`,
  });
}

function handleNavigate(path: string) {
  props.navigate(path);
}
</script>

<template>
  <div class="container">
    <div class="card">
      <h1 class="title">Vue Settings</h1>
      <p class="subtitle">Welcome, {{ props.auth.user?.name ?? 'Guest' }}!</p>

      <div class="section">
        <h2 class="section-title">Counter Demo</h2>
        <p class="counter">{{ count }}</p>
        <button class="button" @click="increment">Increment</button>
      </div>

      <div class="section">
        <h2 class="section-title">Navigation</h2>
        <div class="nav-buttons">
          <button class="nav-button" @click="handleNavigate(`${basePath}/profile`)">
            Go to Profile
          </button>
          <button class="nav-button" @click="handleNavigate('/react')">
            Go to React MFE
          </button>
          <button class="nav-button" @click="handleNavigate('/svelte')">
            Go to Svelte MFE
          </button>
        </div>
      </div>

      <div v-if="messages.length > 0" class="section">
        <h2 class="section-title">Event Log</h2>
        <ul class="message-list">
          <li v-for="(msg, i) in messages" :key="i" class="message">
            {{ msg }}
          </li>
        </ul>
      </div>

      <div class="info">
        <p><strong>Base Path:</strong> {{ basePath }}</p>
        <p><strong>Auth Status:</strong> {{ props.auth.isAuthenticated ? 'Logged In' : 'Not Logged In' }}</p>
        <p v-if="props.auth.user"><strong>Roles:</strong> {{ props.auth.user.roles.join(', ') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 2rem;
  min-height: 100%;
  background: linear-gradient(135deg, #2d5016 0%, #1a3009 100%);
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
  color: #42b883;
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
  color: #42b883;
  margin: 0 0 1rem;
}

.button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background: #42b883;
  color: #1a3009;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.button:hover {
  background: #3aa876;
}

.nav-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.nav-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  background: rgba(66, 184, 131, 0.2);
  color: #42b883;
  border: 1px solid #42b883;
  border-radius: 6px;
  cursor: pointer;
}

.nav-button:hover {
  background: rgba(66, 184, 131, 0.3);
}

.message-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.message {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(66, 184, 131, 0.1);
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
