import type { CaptureEvent } from "@/types";

type MessageHandler = (event: CaptureEvent) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private handlers = new Set<MessageHandler>();

  connect(): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) return;
    if (typeof window === "undefined") return;

    this.socket = new WebSocket(this.getWebSocketUrl());

    this.socket.addEventListener("message", (message) => {
      const event = JSON.parse(message.data as string) as CaptureEvent;
      this.handlers.forEach((handler) => handler(event));
    });
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  on(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  emit(event: CaptureEvent): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(event));
    }
  }

  private getWebSocketUrl(): string {
    const configuredUrl = import.meta.env.VITE_AFTER_WS_URL as string | undefined;
    if (configuredUrl) return configuredUrl;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/ws`;
  }
}

export const webSocketService = new WebSocketService();
