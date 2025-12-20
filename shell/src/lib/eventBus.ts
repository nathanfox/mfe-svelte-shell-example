type EventHandler = (payload: unknown) => void;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  emit(event: string, payload: unknown): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (e) {
          console.error(`[EventBus] Error in handler for ${event}:`, e);
        }
      });
    }
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }
}

export const eventBus = new EventBus();
