import { afterEach, describe, expect, it, vi } from "vitest";

import { webSocketService } from "@/services/websocket";
import type { CaptureEvent } from "@/types";

class MockWebSocket {
  static OPEN = 1;
  static instances: MockWebSocket[] = [];

  readyState = MockWebSocket.OPEN;
  sent: string[] = [];
  private listeners = new Map<string, Array<(event: MessageEvent) => void>>();

  constructor(readonly url: string) {
    MockWebSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  close(): void {
    this.readyState = 3;
  }

  send(message: string): void {
    this.sent.push(message);
  }

  receive(data: unknown): void {
    const event = { data: JSON.stringify(data) } as MessageEvent;
    this.listeners.get("message")?.forEach((listener) => listener(event));
  }
}

describe("webSocketService", () => {
  afterEach(() => {
    webSocketService.disconnect();
    MockWebSocket.instances = [];
    vi.unstubAllGlobals();
  });

  it("connects, receives events, and emits events", () => {
    vi.stubGlobal("WebSocket", MockWebSocket);
    const received: CaptureEvent[] = [];

    const unsubscribe = webSocketService.on((event) => received.push(event));
    webSocketService.connect();

    const socket = MockWebSocket.instances[0];
    expect(socket).toBeDefined();
    const event: CaptureEvent = {
      id: "event-1",
      type: "file:changed",
      title: "Updated file",
      summary: "A file changed",
      timestamp: new Date().toISOString(),
    };

    socket!.receive(event);
    webSocketService.emit(event);
    unsubscribe();

    expect(socket!.url).toContain("/ws");
    expect(received).toEqual([event]);
    expect(socket!.sent).toEqual([JSON.stringify(event)]);
  });
});
