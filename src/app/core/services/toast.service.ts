import { Injectable, inject, signal } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Toast, ToastType } from '../models/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly messageService = inject(MessageService, { optional: true });
  private readonly _toasts = signal<Toast[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  public show(type: ToastType, title: string, message: string, duration: number = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, title, message, duration };

    this._toasts.update(list => [...list, newToast]);

    // Integración directa con PrimeNG MessageService 
    if (this.messageService) {
      const severityMap: Record<ToastType, string> = {
        success: 'success',
        error: 'error',
        info: 'info',
        warning: 'warn'
      };
      this.messageService.add({
        severity: severityMap[type] || 'info',
        summary: title,
        detail: message,
        life: duration
      });
    }

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  public success(title: string, message: string): void {
    this.show('success', title, message, 3500);
  }

  public error(title: string, message: string): void {
    this.show('error', title, message, 5000);
  }

  public info(title: string, message: string): void {
    this.show('info', title, message, 3500);
  }

  public warning(title: string, message: string): void {
    this.show('warning', title, message, 4500);
  }

  public dismiss(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}

