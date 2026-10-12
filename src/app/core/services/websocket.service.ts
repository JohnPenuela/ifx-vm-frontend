import { Injectable, inject, signal } from '@angular/core';
import { VmStateService } from './vm-state.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private readonly vmStateService = inject(VmStateService);
  private socket: WebSocket | null = null;
  private readonly wsUrl = 'ws://localhost:6001';
  private reconnectTimer: any = null;

  public readonly status = signal<'connected' | 'connecting' | 'disconnected'>('disconnected');

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.status.set('connecting');

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.status.set('connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleEvent(data);
        } catch (e) {
          console.warn('[WS] Mensaje no JSON recibido:', event.data);
        }
      };

      this.socket.onclose = () => {
        this.status.set('disconnected');
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.status.set('disconnected');
        this.socket?.close();
      };
    } catch (e) {
      this.status.set('disconnected');
      this.scheduleReconnect();
    }
  }

  private handleEvent(data: { event: string; payload: any }): void {
    switch (data.event) {
      case 'vm:status_changed':
        this.vmStateService.handleWsStatusChange(data.payload);
        break;
      case 'vm:created':
        this.vmStateService.handleWsVmCreated(data.payload);
        break;
      case 'vm:deleted':
        this.vmStateService.handleWsVmDeleted(data.payload);
        break;
      case 'vm:updated':
        if (data.payload?.vm) {
          this.vmStateService.handleWsStatusChange({
            id: data.payload.vm.id,
            name: data.payload.vm.name,
            status: data.payload.vm.status,
            stats: data.payload.stats
          });
        }
        break;
      default:
        // Mensajes de sistema o heartbeat
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  public disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.status.set('disconnected');
  }
}