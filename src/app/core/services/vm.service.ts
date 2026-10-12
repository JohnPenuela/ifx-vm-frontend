import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { VirtualMachine, VmApiResponse, VmSingleResponse, VmStats } from '../../shared/models/vm/vm.model';
import { VmModelService } from '../../shared/services/model-services/vm-model/vm-model.service';

/**
 * Facade de VmService que delega a VmModelService 
 */
@Injectable({
  providedIn: 'root'
})
export class VmService {
  private readonly vmModelService = inject(VmModelService);

  public getVms(status?: string, search?: string): Observable<VmApiResponse> {
    return this.vmModelService.getVms(status, search);
  }

  public getStats(): Observable<VmStats> {
    return this.vmModelService.getStats();
  }

  public getVmById(id: number): Observable<VmSingleResponse> {
    return this.vmModelService.getVmById(id);
  }

  public createVm(data: Partial<VirtualMachine>): Observable<VmSingleResponse> {
    return this.vmModelService.createVm(data);
  }

  public updateVm(id: number, data: Partial<VirtualMachine>): Observable<VmSingleResponse> {
    return this.vmModelService.updateVm(id, data);
  }

  public updateStatus(id: number, status: string): Observable<VmSingleResponse> {
    return this.vmModelService.updateStatus(id, status);
  }

  public deleteVm(id: number): Observable<{ message: string; id: number; stats: VmStats }> {
    return this.vmModelService.deleteVm(id);
  }
}

