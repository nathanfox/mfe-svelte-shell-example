<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

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
  currentPath: string;
}>();

const messages = ref<string[]>([]);
const auth = ref<AuthContext>(props.auth);
const currentPath = ref(props.currentPath);
let unsubNotification: (() => void) | null = null;
let unsubAuth: (() => void) | null = null;
let unsubNav: (() => void) | null = null;

// Determine active tab from currentPath
const activeTab = computed(() => {
  if (currentPath.value === props.basePath || currentPath.value === `${props.basePath}/`) return 'settings';
  if (currentPath.value.startsWith(`${props.basePath}/profile`)) return 'profile';
  if (currentPath.value.startsWith(`${props.basePath}/preferences`)) return 'preferences';
  return 'settings';
});

onMounted(() => {
  unsubNotification = props.eventBus.on('notification:show', (payload) => {
    const msg = payload as { message: string };
    messages.value = [...messages.value, msg.message].slice(-5);
  });

  unsubAuth = props.eventBus.on('auth:changed', (payload) => {
    const authPayload = payload as { user: User | null; token: string | null; isAuthenticated: boolean };
    auth.value = {
      ...auth.value,
      user: authPayload.user,
      token: authPayload.token,
      isAuthenticated: authPayload.isAuthenticated,
    };
  });

  unsubNav = props.eventBus.on('navigation:changed', (payload) => {
    const navPayload = payload as { path: string };
    currentPath.value = navPayload.path;
  });
});

onUnmounted(() => {
  if (unsubNotification) unsubNotification();
  if (unsubAuth) unsubAuth();
  if (unsubNav) unsubNav();
});

// ============ Settings Tab State ============
const settingsForm = ref({
  notifications: true,
  darkMode: false,
  autoSave: true,
  language: 'en',
});

function saveSettings() {
  props.eventBus.emit('notification:show', {
    type: 'success',
    message: 'Settings saved successfully!',
  });
  props.eventBus.emit('settings:changed', settingsForm.value);
}

// ============ Profile Tab State ============
const profileForm = ref({
  displayName: '',
  bio: '',
  website: '',
});

watch(() => auth.value.user, (user) => {
  if (user) {
    profileForm.value.displayName = user.name;
  }
}, { immediate: true });

function updateProfile() {
  props.eventBus.emit('notification:show', {
    type: 'success',
    message: `Profile updated for ${profileForm.value.displayName}`,
  });
}

// ============ Preferences Tab State ============
const preferences = ref({
  fontSize: 16,
  accentColor: '#42b883',
  animations: true,
  compactMode: false,
});

function applyPreferences() {
  props.eventBus.emit('notification:show', {
    type: 'info',
    message: 'Preferences applied!',
  });
  props.eventBus.emit('preferences:changed', preferences.value);
}

function resetPreferences() {
  preferences.value = {
    fontSize: 16,
    accentColor: '#42b883',
    animations: true,
    compactMode: false,
  };
  props.eventBus.emit('notification:show', {
    type: 'warning',
    message: 'Preferences reset to defaults',
  });
}
</script>

<template>
  <div class="container">
    <div class="header">
      <h1 class="title">Vue Settings</h1>
      <p class="subtitle">Welcome, {{ auth.user?.name ?? 'Guest' }}!</p>
    </div>

    <!-- Settings Tab -->
    <div v-if="activeTab === 'settings'" class="tab-content">
      <h2 class="tab-title">General Settings</h2>
      <p class="description">
        Vue's v-model two-way binding and reactive refs for form management.
      </p>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" v-model="settingsForm.notifications" class="toggle-input" />
          <span class="toggle-text">Enable Notifications</span>
        </label>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" v-model="settingsForm.darkMode" class="toggle-input" />
          <span class="toggle-text">Dark Mode</span>
        </label>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" v-model="settingsForm.autoSave" class="toggle-input" />
          <span class="toggle-text">Auto-save Changes</span>
        </label>
      </div>

      <div class="form-group">
        <label class="select-label">Language</label>
        <select v-model="settingsForm.language" class="select-input">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      <button class="button" @click="saveSettings">Save Settings</button>

      <div class="info-box">
        <strong>v-model Demo:</strong> Changes are instantly reflected in the form state.
        Current: notifications={{ settingsForm.notifications }}, language={{ settingsForm.language }}
      </div>
    </div>

    <!-- Profile Tab -->
    <div v-if="activeTab === 'profile'" class="tab-content">
      <h2 class="tab-title">User Profile</h2>
      <p class="description">
        Demonstrates Vue watchers and computed properties for reactive updates.
      </p>

      <div class="profile-card">
        <div class="avatar">{{ auth.user?.name?.charAt(0) ?? '?' }}</div>
        <div class="profile-info">
          <div class="profile-name">{{ auth.user?.name ?? 'Guest' }}</div>
          <div class="profile-email">{{ auth.user?.email ?? 'Not logged in' }}</div>
        </div>
      </div>

      <div class="form-group">
        <label class="input-label">Display Name</label>
        <input type="text" v-model="profileForm.displayName" class="text-input" placeholder="Your display name" />
      </div>

      <div class="form-group">
        <label class="input-label">Bio</label>
        <textarea v-model="profileForm.bio" class="textarea-input" placeholder="Tell us about yourself..." rows="3"></textarea>
      </div>

      <div class="form-group">
        <label class="input-label">Website</label>
        <input type="url" v-model="profileForm.website" class="text-input" placeholder="https://example.com" />
      </div>

      <button class="button" @click="updateProfile" :disabled="!auth.isAuthenticated">
        {{ auth.isAuthenticated ? 'Update Profile' : 'Login to Update' }}
      </button>

      <div class="info-box">
        <strong>Watcher Demo:</strong> Profile form auto-populates when auth state changes.
      </div>
    </div>

    <!-- Preferences Tab -->
    <div v-if="activeTab === 'preferences'" class="tab-content">
      <h2 class="tab-title">UI Preferences</h2>
      <p class="description">
        Vue's reactivity with range inputs and color pickers.
      </p>

      <div class="form-group">
        <label class="input-label">Font Size: {{ preferences.fontSize }}px</label>
        <input type="range" v-model.number="preferences.fontSize" min="12" max="24" class="range-input" />
        <div class="preview-text" :style="{ fontSize: preferences.fontSize + 'px' }">
          Preview text at {{ preferences.fontSize }}px
        </div>
      </div>

      <div class="form-group">
        <label class="input-label">Accent Color</label>
        <div class="color-picker-group">
          <input type="color" v-model="preferences.accentColor" class="color-input" />
          <span class="color-value">{{ preferences.accentColor }}</span>
          <div class="color-preview" :style="{ background: preferences.accentColor }"></div>
        </div>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" v-model="preferences.animations" class="toggle-input" />
          <span class="toggle-text">Enable Animations</span>
        </label>
      </div>

      <div class="form-group">
        <label class="toggle-label">
          <input type="checkbox" v-model="preferences.compactMode" class="toggle-input" />
          <span class="toggle-text">Compact Mode</span>
        </label>
      </div>

      <div class="button-group">
        <button class="button" @click="applyPreferences">Apply Preferences</button>
        <button class="button secondary" @click="resetPreferences">Reset to Defaults</button>
      </div>

      <div class="info-box">
        <strong>Reactive Binding:</strong> Sliders and color pickers update instantly via v-model.
      </div>
    </div>

    <!-- Event Log -->
    <div v-if="messages.length > 0" class="event-log">
      <h3 class="event-log-title">Event Log</h3>
      <ul class="message-list">
        <li v-for="(msg, i) in messages" :key="i" class="message">
          {{ msg }}
        </li>
      </ul>
    </div>

    <div class="footer">
      <p><strong>Base Path:</strong> {{ basePath }} | <strong>Current:</strong> {{ currentPath }} | <strong>Tab:</strong> {{ activeTab }} | <strong>Auth:</strong> {{ auth.isAuthenticated ? 'Logged In' : 'Not Logged In' }}</p>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 2rem;
  min-height: 100%;
  background: linear-gradient(135deg, #1a2f1a 0%, #0d1a0d 100%);
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
    radial-gradient(circle at 20% 20%, rgba(66, 184, 131, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(66, 184, 131, 0.05) 0%, transparent 50%);
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
  background: linear-gradient(135deg, #42b883 0%, #64d4a8 100%);
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
  border: 1px solid rgba(66, 184, 131, 0.15);
  margin-bottom: 1.5rem;
  backdrop-filter: blur(10px);
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
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
  background: linear-gradient(180deg, #42b883 0%, #35495e 100%);
  border-radius: 2px;
}

.description {
  margin: 0 0 1.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  line-height: 1.6;
}

.form-group {
  margin-bottom: 1.5rem;
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
  background: rgba(66, 184, 131, 0.1);
}

.toggle-input {
  width: 20px;
  height: 20px;
  accent-color: #42b883;
  cursor: pointer;
}

.toggle-text {
  font-size: 1rem;
  flex: 1;
}

.select-label,
.input-label {
  display: block;
  margin-bottom: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
}

.select-input,
.text-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(66, 184, 131, 0.2);
  border-radius: 8px;
  color: #ffffff;
  transition: all 0.2s ease;
}

.select-input:focus,
.text-input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.15);
}

.textarea-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(66, 184, 131, 0.2);
  border-radius: 8px;
  color: #ffffff;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
}

.textarea-input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.15);
}

.button {
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
  background: linear-gradient(135deg, #42b883 0%, #3aa876 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.4);
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

.button.secondary {
  background: transparent;
  color: #42b883;
  border: 1px solid rgba(66, 184, 131, 0.5);
  box-shadow: none;
}

.button.secondary:hover {
  background: rgba(66, 184, 131, 0.1);
  border-color: #42b883;
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.info-box {
  margin-top: 1.5rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, rgba(66, 184, 131, 0.1) 0%, rgba(66, 184, 131, 0.05) 100%);
  border-radius: 10px;
  border: 1px solid rgba(66, 184, 131, 0.2);
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.info-box strong {
  color: #42b883;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(66, 184, 131, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(66, 184, 131, 0.15);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(66, 184, 131, 0.3);
  text-transform: uppercase;
}

.profile-info {
  flex: 1;
}

.profile-name {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.profile-email {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

.range-input {
  width: 100%;
  height: 6px;
  accent-color: #42b883;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  cursor: pointer;
}

.preview-text {
  margin-top: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  color: #ffffff;
  border: 1px solid rgba(66, 184, 131, 0.1);
  transition: font-size 0.2s ease;
}

.color-picker-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.color-input {
  width: 48px;
  height: 48px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}

.color-value {
  color: rgba(255, 255, 255, 0.7);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  font-size: 0.9rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.color-preview {
  flex: 1;
  height: 36px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: background 0.2s ease;
}

.event-log {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(66, 184, 131, 0.1);
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
  background: rgba(66, 184, 131, 0.08);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  border-left: 2px solid #42b883;
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
}

.footer strong {
  color: rgba(255, 255, 255, 0.6);
}
</style>
