import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiEndpointService {
  // Soporte dual:
  // 1. php artisan serve en puerto 8000
  // 2. Servidor Apache nativo de WAMP en puerto 80
  public readonly endpoints = [
    'http://localhost:8000/api',
    'http://localhost/ifx_vm_backend/public/api'
  ];

  public readonly activeUrl = signal<string>('http://localhost:8000/api');

  constructor() {
    this.detectEndpoint();
  }

  public detectEndpoint(): void {
    // Probar si el puerto 8000 está escuchando
    fetch('http://localhost:8000/api/me', { method: 'GET', credentials: 'include' })
      .then(() => {
        this.activeUrl.set('http://localhost:8000/api');
      })
      .catch(() => {
        // Si el puerto 8000 está cerrado, conmutar inmediatamente a Apache WAMP
        this.activeUrl.set('http://localhost/ifx_vm_backend/public/api');
      });
  }

  public getUrl(path: string = ''): string {
    const cleanPath = path ? (path.startsWith('/') ? path : '/' + path) : '';
    return `${this.activeUrl()}${cleanPath}`;
  }

  public getAlternateUrl(path: string = ''): string {
    const cleanPath = path ? (path.startsWith('/') ? path : '/' + path) : '';
    const alternate = this.activeUrl() === this.endpoints[0] ? this.endpoints[1] : this.endpoints[0];
    return `${alternate}${cleanPath}`;
  }

  public switchToAlternate(): void {
    const next = this.activeUrl() === this.endpoints[0] ? this.endpoints[1] : this.endpoints[0];
    this.activeUrl.set(next);
  }
}