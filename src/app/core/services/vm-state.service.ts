import { Injectable, inject, signal, computed } from '@angular/core';
import { VirtualMachine, VmStats } from '../models/vm.model';
import { VmService } from './vm.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class VmStateService {
  private readonly vmService = inject(VmService);
  private readonly toastService = inject(ToastService);

  // Estado reactivo principal mediante Signals
  public readonly vms = signal<VirtualMachine[]>([]);
  public readonly stats = signal<VmStats | null>(null);
  public readonly loading = signal<boolean>(false);
  public readonly activeFilter = signal<string>('all');
  public readonly searchTerm = signal<string>('');

  // Métricas calculadas en tiempo real a partir del estado de las VMs activas
  public readonly activeVmsList = computed(() => this.vms().filter((vm) => vm.status === 'Activa'));

  public readonly activeCores = computed(() =>
    this.activeVmsList().reduce((acc, vm) => acc + (vm.cores || 0), 0),
  );

  public readonly activeRamGb = computed(() =>
    this.activeVmsList().reduce((acc, vm) => acc + (vm.ram || 0), 0),
  );

  public readonly activeDiskGb = computed(() =>
    this.activeVmsList().reduce((acc, vm) => acc + (vm.disk || 0), 0),
  );

  public readonly stoppedCount = computed(
    () => this.vms().filter((vm) => vm.status === 'Apagada').length,
  );

  public readonly maintenanceCount = computed(
    () => this.vms().filter((vm) => vm.status === 'Mantenimiento').length,
  );

  // Lista filtrada para la vista según búsqueda y estado
  public readonly filteredVms = computed(() => {
    const list = this.vms();
    const filter = this.activeFilter();
    const search = this.searchTerm().toLowerCase().trim();

    return list.filter((vm) => {
      const matchesFilter = filter === 'all' || vm.status === filter;
      const matchesSearch =
        !search ||
        vm.name.toLowerCase().includes(search) ||
        vm.os.toLowerCase().includes(search) ||
        (vm.ip_address && vm.ip_address.includes(search));
      return matchesFilter && matchesSearch;
    });
  });

  public loadVms(): void {
    this.loading.set(true);
    this.vmService.getVms().subscribe({
      next: (res) => {
        this.vms.set(res.data);
        this.stats.set(res.stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error(
          'Error al cargar inventario',
          err?.error?.message || 'No fue posible obtener el listado de máquinas virtuales.',
        );
      },
    });
  }

  /* ==========================================================================
     OPTIMISTIC UI: Mutaciones inmediatas con Rollback transaccional ante fallas
     ========================================================================== */

  public createVmOptimistic(formData: Partial<VirtualMachine>): void {
    // 1. Guardar Snapshot previo del estado
    const previousSnapshot = [...this.vms()];

    // 2. Crear modelo optimista temporal
    const tempId = -Date.now();
    const optimisticVm: VirtualMachine = {
      id: tempId,
      name: formData.name || 'srv-nuevo',
      cores: Number(formData.cores) || 2,
      ram: Number(formData.ram) || 4,
      disk: Number(formData.disk) || 50,
      os: formData.os || 'Ubuntu 22.04 LTS',
      status: formData.status || 'Activa',
      ip_address: formData.ip_address || 'Asignando IP...',
      description: formData.description || '',
      _optimistic: true,
      _highlight: true,
    };

    // 3. Aplicar cambio visual inmediato en la interfaz
    this.vms.update((list) => [optimisticVm, ...list]);
    this.toastService.info(
      'Aprovisionando VM',
      `Desplegando ${optimisticVm.name} en el cluster...`,
    );

    // 4. Ejecutar petición en backend
    this.vmService.createVm(formData).subscribe({
      next: (res) => {
        // Reemplazar la VM temporal con la respuesta real de la base de datos
        this.vms.update((list) =>
          list.map((vm) => (vm.id === tempId ? { ...res.data, _highlight: true } : vm)),
        );
        if (res.stats) this.stats.set(res.stats);
        this.toastService.success(
          'Aprovisionamiento completado',
          `La máquina ${res.data.name} ya está operativa.`,
        );

        // Remover efecto de highlight tras 3 segundos
        setTimeout(() => this.clearHighlight(res.data.id), 3000);
      },
      error: (err) => {
        // ROLLBACK INMEDIATO: Restaurar snapshot si la API falla
        this.vms.set(previousSnapshot);
        const errorDetail =
          err?.error?.message ||
          err?.error?.errors?.name?.[0] ||
          'Error en el servidor al crear la VM.';
        this.toastService.error(
          'Fallo de Despliegue (Rollback)',
          `${errorDetail}. Se restauró el estado anterior.`,
        );
      },
    });
  }

  public updateVmOptimistic(id: number, formData: Partial<VirtualMachine>): void {
    const previousSnapshot = [...this.vms()];
    const currentVm = this.vms().find((v) => v.id === id);

    if (!currentVm) return;

    // 1. Actualizar inmediatamente en la UI
    const updatedOptimistic: VirtualMachine = {
      ...currentVm,
      ...formData,
      cores: Number(formData.cores ?? currentVm.cores),
      ram: Number(formData.ram ?? currentVm.ram),
      disk: Number(formData.disk ?? currentVm.disk),
      _optimistic: true,
    };

    this.vms.update((list) => list.map((v) => (v.id === id ? updatedOptimistic : v)));

    // 2. Enviar actualización al servidor
    this.vmService.updateVm(id, formData).subscribe({
      next: (res) => {
        this.vms.update((list) =>
          list.map((v) => (v.id === id ? { ...res.data, _highlight: true } : v)),
        );
        if (res.stats) this.stats.set(res.stats);
        this.toastService.success(
          'Actualización exitosa',
          `Configuración de ${res.data.name} guardada.`,
        );
        setTimeout(() => this.clearHighlight(id), 3000);
      },
      error: (err) => {
        // ROLLBACK
        this.vms.set(previousSnapshot);
        const errorDetail = err?.error?.message || 'No fue posible guardar los cambios en la VM.';
        this.toastService.error(
          'Error de Actualización (Rollback)',
          `${errorDetail}. Se restauró el estado previo.`,
        );
      },
    });
  }

  public updateStatusOptimistic(
    id: number,
    nextStatus: 'Activa' | 'Apagada' | 'Mantenimiento',
  ): void {
    const previousSnapshot = [...this.vms()];
    const targetVm = this.vms().find((v) => v.id === id);
    if (!targetVm) return;

    const previousStatus = targetVm.status;

    // 1. Reaccionar de inmediato en la UI
    this.vms.update((list) =>
      list.map((v) => (v.id === id ? { ...v, status: nextStatus, _highlight: true } : v)),
    );

    // 2. Disparar API en segundo plano
    this.vmService.updateStatus(id, nextStatus).subscribe({
      next: (res) => {
        this.vms.update((list) =>
          list.map((v) => (v.id === id ? { ...res.data, _highlight: true } : v)),
        );
        if (res.stats) this.stats.set(res.stats);
        this.toastService.success(
          'Estado modificado',
          `${targetVm.name} ahora se encuentra en estado: ${nextStatus}.`,
        );
        setTimeout(() => this.clearHighlight(id), 3000);
      },
      error: (err) => {
        // ROLLBACK
        this.vms.set(previousSnapshot);
        const errorDetail = err?.error?.message || 'Error de red o permisos insuficientes.';
        this.toastService.error(
          'Fallo de Transición (Rollback)',
          `No se pudo cambiar el estado a ${nextStatus}. Revertido a ${previousStatus}. (${errorDetail})`,
        );
      },
    });
  }

  public deleteVmOptimistic(id: number): void {
    const previousSnapshot = [...this.vms()];
    const targetVm = this.vms().find((v) => v.id === id);
    const vmName = targetVm?.name || 'VM';

    // 1. Ocultar / remover inmediatamente de la UI
    this.vms.update((list) => list.filter((v) => v.id !== id));
    this.toastService.info('Eliminando VM', `Eliminando ${vmName} del inventario...`);

    // 2. Llamada al backend
    this.vmService.deleteVm(id).subscribe({
      next: (res) => {
        if (res.stats) this.stats.set(res.stats);
        this.toastService.success(
          'Eliminación confirmada',
          `La máquina ${vmName} fue eliminada definitivamente.`,
        );
      },
      error: (err) => {
        // ROLLBACK
        this.vms.set(previousSnapshot);
        const errorDetail = err?.error?.message || 'Error al eliminar en el servidor.';
        this.toastService.error(
          'Fallo al Eliminar (Rollback)',
          `${errorDetail}. La máquina ${vmName} fue restaurada.`,
        );
      },
    });
  }

  /* ==========================================================================
     SINCRONIZACIÓN EN TIEMPO REAL: WebSocket Events recibidos desde otros clientes
     ========================================================================== */

  public handleWsStatusChange(payload: {
    id: number;
    name: string;
    status: 'Activa' | 'Apagada' | 'Mantenimiento';
    vm?: VirtualMachine;
    stats?: VmStats;
  }): void {
    this.vms.update((list) =>
      list.map((v) => {
        if (v.id === payload.id) {
          return {
            ...v,
            status: payload.status,
            _highlight: true, // Activa animación luminosa de pulso
          };
        }
        return v;
      }),
    );

    if (payload.stats) {
      this.stats.set(payload.stats);
    }

    this.toastService.info(
      'Sincronización en Tiempo Real',
      `Un administrador actualizó el estado de "${payload.name}" a "${payload.status}".`,
    );

    setTimeout(() => this.clearHighlight(payload.id), 3500);
  }

  public handleWsVmCreated(payload: { vm: VirtualMachine; stats?: VmStats }): void {
    if (!payload.vm) return;
    const exists = this.vms().some((v) => v.id === payload.vm.id);
    if (!exists) {
      this.vms.update((list) => [{ ...payload.vm, _highlight: true }, ...list]);
      if (payload.stats) this.stats.set(payload.stats);
      this.toastService.info(
        'Nueva VM detectada (Live)',
        `Se agregó la máquina virtual "${payload.vm.name}" al cluster.`,
      );
      setTimeout(() => this.clearHighlight(payload.vm.id), 3500);
    }
  }

  public handleWsVmDeleted(payload: { id: number; name: string; stats?: VmStats }): void {
    this.vms.update((list) => list.filter((v) => v.id !== payload.id));
    if (payload.stats) this.stats.set(payload.stats);
    this.toastService.info(
      'VM Desincorporada (Live)',
      `La máquina virtual "${payload.name}" fue eliminada por un administrador.`,
    );
  }

  private clearHighlight(id: number): void {
    this.vms.update((list) => list.map((v) => (v.id === id ? { ...v, _highlight: false } : v)));
  }
}
