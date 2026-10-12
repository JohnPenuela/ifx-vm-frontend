import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { VirtualMachine, VmApiResponse, VmSingleResponse, VmStats } from '../../../models/vm/vm.model';
import { RequestGenericoService } from '../../request-generico/request-generico.service';

/**
 * Servicio modular de modelo para VirtualMachine.
 * Implementa transformRequest y transformResponse .
 */
@Injectable({
  providedIn: 'root'
})
export class VmModelService {
  private readonly requestGenerico = inject(RequestGenericoService);
  private readonly endpoint = '/vms';

  /**
   * Transforma y normaliza la entidad antes de enviarla al backend .
   */
  public transformRequest(data: Partial<VirtualMachine>): Partial<VirtualMachine> {
    return {
      ...data,
      name: data.name ? data.name.trim() : '',
      cores: data.cores ? Number(data.cores) : 1,
      ram: data.ram ? Number(data.ram) : 1,
      disk: data.disk ? Number(data.disk) : 10,
      os: data.os ? data.os.trim() : 'Ubuntu 24.04 LTS',
      status: data.status || 'Activa',
      description: data.description ? data.description.trim() : ''
    };
  }

  /**
   * Normaliza y valida la entidad recibida de la API .
   */
  public transformResponse(vm: any): VirtualMachine {
    if (!vm) return vm;
    return {
      id: Number(vm.id),
      name: String(vm.name || ''),
      cores: Number(vm.cores || 1),
      ram: Number(vm.ram || 1),
      disk: Number(vm.disk || 10),
      os: String(vm.os || 'Ubuntu 24.04 LTS'),
      status: vm.status || 'Activa',
      ip_address: vm.ip_address || '10.0.0.1',
      description: vm.description || '',
      created_at: vm.created_at || undefined,
      updated_at: vm.updated_at || undefined,
      _optimistic: Boolean(vm._optimistic),
      _highlight: Boolean(vm._highlight)
    };
  }

  public getVms(status?: string, search?: string): Observable<VmApiResponse> {
    const params: Record<string, string> = {};
    if (status && status !== 'all') {
      params['status'] = status;
    }
    if (search && search.trim() !== '') {
      params['search'] = search.trim();
    }

    return this.requestGenerico.getRequestGenericoV1<VmApiResponse>(this.endpoint, params).pipe(
      map(res => ({
        ...res,
        data: (res.data || []).map(item => this.transformResponse(item))
      }))
    );
  }

  public getStats(): Observable<VmStats> {
    return this.requestGenerico.getRequestGenericoV1<VmStats>(`${this.endpoint}/stats`);
  }

  public getVmById(id: number): Observable<VmSingleResponse> {
    return this.requestGenerico.getRequestGenericoV1<VmSingleResponse>(`${this.endpoint}/${id}`).pipe(
      map(res => ({
        ...res,
        data: this.transformResponse(res.data)
      }))
    );
  }

  public createVm(data: Partial<VirtualMachine>): Observable<VmSingleResponse> {
    const payload = this.transformRequest(data);
    return this.requestGenerico.postRequestGenericoV1<VmSingleResponse>(this.endpoint, payload).pipe(
      map(res => ({
        ...res,
        data: this.transformResponse(res.data)
      }))
    );
  }

  public updateVm(id: number, data: Partial<VirtualMachine>): Observable<VmSingleResponse> {
    const payload = this.transformRequest(data);
    return this.requestGenerico.putRequestGenericoV1<VmSingleResponse>(`${this.endpoint}/${id}`, payload).pipe(
      map(res => ({
        ...res,
        data: this.transformResponse(res.data)
      }))
    );
  }

  public updateStatus(id: number, status: string): Observable<VmSingleResponse> {
    return this.requestGenerico.patchRequestGenericoV1<VmSingleResponse>(`${this.endpoint}/${id}/status`, { status }).pipe(
      map(res => ({
        ...res,
        data: this.transformResponse(res.data)
      }))
    );
  }

  public deleteVm(id: number): Observable<{ message: string; id: number; stats: VmStats }> {
    return this.requestGenerico.deleteRequestGenericoV1<{ message: string; id: number; stats: VmStats }>(`${this.endpoint}/${id}`);
  }
}

