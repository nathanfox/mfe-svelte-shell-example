import type { MfeRoute } from '../types/mfe';

// Reactive map of MFE ID -> registered routes
let dynamicRoutes = $state(new Map<string, MfeRoute[]>());

export function getDynamicRoutes(): Map<string, MfeRoute[]> {
  return dynamicRoutes;
}

export function registerRoutes(mfeId: string, routes: MfeRoute[]): void {
  dynamicRoutes.set(mfeId, routes);
  // Trigger reactivity by reassigning
  dynamicRoutes = new Map(dynamicRoutes);
  console.log(`[RouteRegistry] Registered ${routes.length} routes for ${mfeId}`);
}

export function unregisterRoutes(mfeId: string): void {
  dynamicRoutes.delete(mfeId);
  dynamicRoutes = new Map(dynamicRoutes);
  console.log(`[RouteRegistry] Unregistered routes for ${mfeId}`);
}

export function getRoutes(mfeId: string): MfeRoute[] {
  return dynamicRoutes.get(mfeId) ?? [];
}
