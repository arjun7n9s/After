/**
 * Capture Event Types
 */
export type CaptureEventType =
  | "file:changed"
  | "file:added"
  | "file:deleted"
  | "git:commit"
  | "git:branch"
  | "terminal:output"
  | "screenshot:captured"
  | "decision:made"
  | "milestone:reached";

/**
 * Base Capture Event
 */
export type CaptureEvent = {
  id: string;
  type: CaptureEventType;
  timestamp: string;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

/**
 * File Change Event
 */
export type FileChangeEvent = CaptureEvent & {
  type: "file:changed" | "file:added" | "file:deleted";
  data: {
    path: string;
    content?: string;
    size?: number;
    hash?: string;
  };
};

/**
 * Git Event
 */
export type GitEvent = CaptureEvent & {
  type: "git:commit" | "git:branch";
  data: {
    hash?: string;
    message?: string;
    author?: string;
    branch?: string;
    diff?: string;
  };
};

/**
 * Event Handler
 */
export type EventHandler<T extends CaptureEvent = CaptureEvent> = (event: T) => void | Promise<void>;

/**
 * EventBus
 * 
 * Central event bus for the capture system.
 * Allows components to emit and listen to capture events.
 */
export class EventBus {
  private handlers: Map<CaptureEventType, Set<EventHandler>>;
  private wildcardHandlers: Set<EventHandler>;
  private eventHistory: CaptureEvent[];
  private maxHistorySize: number;

  constructor(maxHistorySize = 1000) {
    this.handlers = new Map();
    this.wildcardHandlers = new Set();
    this.eventHistory = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Emit an event
   */
  async emit(event: CaptureEvent): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get handlers for this event type
    const typeHandlers = this.handlers.get(event.type) || new Set();
    const allHandlers = [...typeHandlers, ...this.wildcardHandlers];

    // Execute all handlers
    await Promise.all(allHandlers.map((handler) => handler(event)));
  }

  /**
   * Register an event handler for a specific event type
   */
  on<T extends CaptureEvent = CaptureEvent>(
    eventType: CaptureEventType,
    handler: EventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);
  }

  /**
   * Register a wildcard handler that receives all events
   */
  onAny(handler: EventHandler): void {
    this.wildcardHandlers.add(handler);
  }

  /**
   * Unregister an event handler
   */
  off(eventType: CaptureEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Unregister a wildcard handler
   */
  offAny(handler: EventHandler): void {
    this.wildcardHandlers.delete(handler);
  }

  /**
   * Register a one-time event handler
   */
  once<T extends CaptureEvent = CaptureEvent>(
    eventType: CaptureEventType,
    handler: EventHandler<T>
  ): void {
    const wrappedHandler: EventHandler<T> = async (event) => {
      await handler(event);
      this.off(eventType, wrappedHandler as EventHandler);
    };
    this.on(eventType, wrappedHandler);
  }

  /**
   * Wait for a specific event
   */
  async waitFor(
    eventType: CaptureEventType,
    timeout?: number
  ): Promise<CaptureEvent> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const handler: EventHandler = (event) => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(event);
      };

      this.once(eventType, handler);

      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(eventType, handler);
          reject(new Error(`Timeout waiting for event: ${eventType}`));
        }, timeout);
      }
    });
  }

  /**
   * Get event history
   */
  getHistory(eventType?: CaptureEventType): CaptureEvent[] {
    if (eventType) {
      return this.eventHistory.filter((event) => event.type === eventType);
    }
    return [...this.eventHistory];
  }

  /**
   * Get recent events
   */
  getRecent(count: number, eventType?: CaptureEventType): CaptureEvent[] {
    const history = this.getHistory(eventType);
    return history.slice(-count);
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get statistics about events
   */
  getStats(): {
    totalEvents: number;
    byType: Record<string, number>;
    oldestEvent: string | null;
    newestEvent: string | null;
  } {
    const byType: Record<string, number> = {};

    for (const event of this.eventHistory) {
      byType[event.type] = (byType[event.type] || 0) + 1;
    }

    return {
      totalEvents: this.eventHistory.length,
      byType,
      oldestEvent: this.eventHistory[0]?.timestamp || null,
      newestEvent: this.eventHistory[this.eventHistory.length - 1]?.timestamp || null,
    };
  }

  /**
   * Remove all handlers
   */
  removeAllHandlers(): void {
    this.handlers.clear();
    this.wildcardHandlers.clear();
  }

  /**
   * Generate a unique event ID
   */
  static generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Create a capture event
   */
  static createEvent(
    type: CaptureEventType,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): CaptureEvent {
    return {
      id: EventBus.generateEventId(),
      type,
      timestamp: new Date().toISOString(),
      data,
      metadata,
    };
  }
}

// Made with Bob
