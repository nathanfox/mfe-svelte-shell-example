import type { MfeManifest } from '../types/mfe';

const MANIFEST_URL = import.meta.env.DEV
  ? '/manifest.dev.json'
  : '/manifest.json';

export async function loadManifest(url?: string): Promise<MfeManifest> {
  const response = await fetch(url ?? MANIFEST_URL);
  if (!response.ok) {
    throw new Error(`Failed to load manifest: ${response.statusText}`);
  }
  return response.json();
}

export type { MfeManifest, MfeRegistration } from '../types/mfe';
