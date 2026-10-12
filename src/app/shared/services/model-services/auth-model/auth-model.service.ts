import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, AuthResponse, LoginPayload } from '../../../models/user/user.model';
import { RequestGenericoService } from '../../request-generico/request-generico.service';

/**
 * Servicio modular de modelo para Autenticación y Usuario.
 * Servicio para autenticación y usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthModelService {
  private readonly requestGenerico = inject(RequestGenericoService);

  public transformResponse(user: any): User {
    if (!user) return user;
    return {
      id: Number(user.id),
      name: String(user.name || ''),
      email: String(user.email || ''),
      role: user.role === 'Administrador' ? 'Administrador' : 'Cliente'
    };
  }

  public checkMe(): Observable<{ user: User }> {
    return this.requestGenerico.getRequestGenericoV1<{ user: any }>('/me').pipe(
      map(res => ({
        user: this.transformResponse(res.user)
      }))
    );
  }

  public login(payload: LoginPayload): Observable<AuthResponse> {
    return this.requestGenerico.postRequestGenericoV1<AuthResponse>('/login', payload).pipe(
      map(res => ({
        message: res.message,
        user: this.transformResponse(res.user)
      }))
    );
  }

  public logout(): Observable<any> {
    return this.requestGenerico.postRequestGenericoV1<any>('/logout', {});
  }
}

