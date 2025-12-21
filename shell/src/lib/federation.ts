import type { MfeRegistration, MfeLifecycle, MfeProps } from '../types/mfe';

// Cache for loaded MFE modules
const loadedMfes = new Map<string, MfeLifecycle>();
const mountedMfes = new Map<string, MfeProps>();
const loadedStylesheets = new Set<string>();

// Load CSS file for an MFE if it exists (Vue/Svelte extract CSS separately)
async function loadMfeStyles(mfe: MfeRegistration): Promise<void> {
  if (loadedStylesheets.has(mfe.id)) return;

  // Derive CSS path from JS entry (remoteEntry.js -> remoteEntry.css)
  const cssPath = mfe.entry.replace(/\.js$/, '.css');

  try {
    // Check if CSS file exists
    const response = await fetch(cssPath, { method: 'HEAD' });
    if (!response.ok) return;

    // Create and append link element
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    link.id = `mfe-styles-${mfe.id}`;
    document.head.appendChild(link);
    loadedStylesheets.add(mfe.id);
    console.log(`[Federation] Loaded styles for MFE: ${mfe.id}`);
  } catch {
    // CSS file doesn't exist (e.g., React uses CSS-in-JS), skip silently
  }
}

export async function loadMfe(
  mfe: MfeRegistration,
  container: HTMLElement,
  props: Omit<MfeProps, 'container'>
): Promise<void> {
  const fullProps: MfeProps = { ...props, container };

  let lifecycle = loadedMfes.get(mfe.id);

  if (!lifecycle) {
    console.log(`[Federation] Loading MFE: ${mfe.id} from ${mfe.entry}`);

    // Load CSS before JS to avoid flash of unstyled content
    await loadMfeStyles(mfe);

    try {
      // Dynamically import the MFE's remote entry
      const module = await import(/* @vite-ignore */ mfe.entry);

      lifecycle = {
        bootstrap: module.bootstrap,
        mount: module.mount,
        unmount: module.unmount,
        unload: module.unload,
      };

      loadedMfes.set(mfe.id, lifecycle);

      // Call bootstrap once per MFE
      await lifecycle.bootstrap(fullProps);
      console.log(`[Federation] Bootstrapped MFE: ${mfe.id}`);
    } catch (error) {
      console.error(`[Federation] Failed to load MFE: ${mfe.id}`, error);
      throw error;
    }
  }

  // Mount the MFE
  await lifecycle.mount(fullProps);
  mountedMfes.set(mfe.id, fullProps);
  console.log(`[Federation] Mounted MFE: ${mfe.id}`);
}

export async function unloadMfe(mfeId: string): Promise<void> {
  const lifecycle = loadedMfes.get(mfeId);
  const props = mountedMfes.get(mfeId);

  if (lifecycle && props) {
    try {
      await lifecycle.unmount(props);
      mountedMfes.delete(mfeId);
      console.log(`[Federation] Unmounted MFE: ${mfeId}`);
    } catch (error) {
      console.error(`[Federation] Failed to unmount MFE: ${mfeId}`, error);
    }
  }
}

export async function unloadAllMfes(): Promise<void> {
  for (const mfeId of mountedMfes.keys()) {
    await unloadMfe(mfeId);
  }
}
