import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { ApiEndpointService } from '../../../core/services/api-endpoint.service';

/**
 * Servicio genérico para peticiones HTTP centralizadas.
 * Servicio genérico para llamadas HTTP.
 */
@Injectable({
  providedIn: 'root'
})
export class RequestGenericoService {
  private readonly http = inject(HttpClient);
  private readonly apiEndpoint = inject(ApiEndpointService);

  private buildUrl(endpoint: string): string {
    return this.apiEndpoint.getUrl(endpoint);
  }

  public getRequestGenericoV1<T>(endpoint: string, params?: HttpParams | Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params instanceof HttpParams) {
      httpParams = params;
    } else if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, String(params[key]));
        }
      });
    }

    return this.http.get<T>(this.buildUrl(endpoint), { params: httpParams }).pipe(
      retry(1),
      catchError(error => throwError(() => error))
    );
  }

  public postRequestGenericoV1<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), data).pipe(
      catchError(error => throwError(() => error))
    );
  }

  public putRequestGenericoV1<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), data).pipe(
      catchError(error => throwError(() => error))
    );
  }

  public patchRequestGenericoV1<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(this.buildUrl(endpoint), data).pipe(
      catchError(error => throwError(() => error))
    );
  }

  public deleteRequestGenericoV1<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint)).pipe(
      catchError(error => throwError(() => error))
    );
  }
}

