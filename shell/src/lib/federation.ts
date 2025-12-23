import type { MfeRegistration, MfeLifecycle, MfeProps } from '../types/mfe';

// Cache for loaded MFE modules
const loadedMfes = new Map<string, MfeLifecycle>();
const mountedMfes = new Map<string, MfeProps>();
const loadedStylesheets = new Set<string>();

// Load CSS file for an MFE if it exists (Vue/Svelte extract CSS separately)
async function loadMfeStyles(mfe: MfeRegistration): Promise<void> {
  if (loadedStylesheets.has(mfe.id)) return;

  // Derive CSS path from JS entry
  // Try assets/ subfolder first (Vite default), then same directory as fallback
  const basePath = mfe.entry.substring(0, mfe.entry.lastIndexOf('/'));
  const fileName = mfe.entry.substring(mfe.entry.lastIndexOf('/') + 1).replace(/\.js$/, '.css');
  const cssPaths = [
    `${basePath}/assets/${fileName}`,  // Vite default: assets/remoteEntry.css
    `${basePath}/${fileName}`,          // Fallback: remoteEntry.css (same dir)
  ];

  for (const cssPath of cssPaths) {
    try {
      // Check if CSS file exists
      const response = await fetch(cssPath, { method: 'HEAD' });
      if (!response.ok) continue;

      // Create and append link element, wait for it to load to prevent FOUC
      await new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        link.id = `mfe-styles-${mfe.id}`;
        link.onload = () => {
          console.log(`[Federation] Loaded styles for MFE: ${mfe.id} from ${cssPath}`);
          resolve();
        };
        link.onerror = () => {
          console.warn(`[Federation] Failed to load styles for MFE: ${mfe.id}`);
          reject(new Error(`Failed to load CSS: ${cssPath}`));
        };
        document.head.appendChild(link);
      });

      loadedStylesheets.add(mfe.id);
      return; // Successfully loaded, exit the loop
    } catch {
      // This path didn't work, try the next one
      continue;
    }
  }
  // No CSS found at any path - that's okay, some MFEs don't have external CSS
}

export async function loadMfe(
  mfe: MfeRegistration,
  container: HTMLElement,
  props: Omit<MfeProps, 'container'>
): Promise<void> {
  const fullProps: MfeProps = { ...props, container };

  // Always ensure CSS is loaded (it may have been removed on unmount)
  await loadMfeStyles(mfe);

  let lifecycle = loadedMfes.get(mfe.id);

  if (!lifecycle) {
    console.log(`[Federation] Loading MFE: ${mfe.id} from ${mfe.entry}`);

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

  // Clean up stylesheet if it was loaded
  if (loadedStylesheets.has(mfeId)) {
    const link = document.getElementById(`mfe-styles-${mfeId}`);
    if (link) {
      link.remove();
      console.log(`[Federation] Removed styles for MFE: ${mfeId}`);
    }
    loadedStylesheets.delete(mfeId);
  }
}

export async function unloadAllMfes(): Promise<void> {
  for (const mfeId of mountedMfes.keys()) {
    await unloadMfe(mfeId);
  }
}
