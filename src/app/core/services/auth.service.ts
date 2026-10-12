import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';
import { ToastService } from './toast.service';
import { ApiEndpointService } from './api-endpoint.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  public readonly apiEndpoint = inject(ApiEndpointService);

  public readonly currentUser = signal<User | null>(null);
  public readonly isInitialized = signal<boolean>(false);
  public readonly isAuthenticating = signal<boolean>(false);

  public readonly isAuthenticated = computed(() => !!this.currentUser());
  public readonly isAdmin = computed(() => this.currentUser()?.role === 'Administrador');
  public readonly isClient = computed(() => this.currentUser()?.role === 'Cliente');

  constructor() {
    this.checkSession();
  }

  public checkSession(): void {
    const url = this.apiEndpoint.getUrl('/me');
    this.http.get<{ user: User }>(url).subscribe({
      next: (res) => {
        this.currentUser.set(res.user);
        this.isInitialized.set(true);
      },
      error: (err) => {
        // Si el endpoint primario está offline (status 0), probar el endpoint alterno (Apache WAMP)
        if (err.status === 0) {
          const altUrl = this.apiEndpoint.getAlternateUrl('/me');
          this.http.get<{ user: User }>(altUrl).subscribe({
            next: (res) => {
              this.apiEndpoint.switchToAlternate();
              this.currentUser.set(res.user);
              this.isInitialized.set(true);
            },
            error: () => {
              this.currentUser.set(null);
              this.isInitialized.set(true);
            }
          });
        } else {
          this.currentUser.set(null);
          this.isInitialized.set(true);
        }
      }
    });
  }

  public login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    this.isAuthenticating.set(true);
    const primaryUrl = this.apiEndpoint.getUrl('/login');

    return this.http.post<AuthResponse>(primaryUrl, credentials).pipe(
      catchError((err) => {
        // Failover automático: si el puerto 8000 no responde (status 0), conectar por Apache WAMP (puerto 80)
        if (err.status === 0) {
          const altUrl = this.apiEndpoint.getAlternateUrl('/login');
          return this.http.post<AuthResponse>(altUrl, credentials).pipe(
            tap(() => {
              this.apiEndpoint.switchToAlternate();
            })
          );
        }
        return throwError(() => err);
      }),
      tap({
        next: (response) => {
          this.currentUser.set(response.user);
          this.isAuthenticating.set(false);
          this.toastService.success(
            '¡Bienvenido!',
            `Sesión iniciada como ${response.user.role} (${response.user.name})`
          );
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isAuthenticating.set(false);
          const errorMsg =
            err?.error?.message ||
            (err.status === 0
              ? 'No se pudo conectar con el servidor. Verifique que WAMP esté activo o ejecute "iniciar_todo.bat".'
              : 'El correo electrónico o la contraseña son incorrectos.');
          this.toastService.error('Error de Acceso', errorMsg);
        }
      })
    );
  }

  public logout(): void {
    const url = this.apiEndpoint.getUrl('/logout');
    this.http.post(url, {}).subscribe({
      next: () => {
        this.currentUser.set(null);
        this.toastService.info('Sesión Cerrada', 'Has cerrado sesión exitosamente.');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.currentUser.set(null);
        this.router.navigate(['/login']);
      }
    });
  }
}