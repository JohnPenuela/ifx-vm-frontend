import { Component, OnInit, OnDestroy, inject, signal, effect, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { AuthService } from '../../core/services/auth.service';
import { VmStateService } from '../../core/services/vm-state.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { ThemeService } from '../../core/services/theme.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { VmModalComponent } from '../vm-modal/vm-modal.component';
import { VirtualMachine } from '../../shared/models/vm/vm.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TagModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SkeletonLoaderComponent,
    VmModalComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  public readonly authService = inject(AuthService);
  public readonly vmStateService = inject(VmStateService);
  public readonly wsService = inject(WebSocketService);
  public readonly themeService = inject(ThemeService);
  private readonly confirmationService = inject(ConfirmationService);

  @ViewChild('resourceChartCanvas') resourceChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('osChartCanvas') osChartCanvas?: ElementRef<HTMLCanvasElement>;

  private resourceChart?: Chart;
  private osChart?: Chart;

  // Modo de visualización: Grid de Tarjetas o Tabla PrimeNG 
  public readonly viewMode = signal<'grid' | 'table'>('table');

  // Estado del modal de creación / edición PrimeNG
  public isModalOpen = signal<boolean>(false);
  public selectedVmForEdit = signal<VirtualMachine | null>(null);

  constructor() {
    effect(() => {
      this.vmStateService.activeCores();
      this.vmStateService.activeRamGb();
      this.vmStateService.activeDiskGb();
      this.vmStateService.vms();

      if (this.resourceChart && this.osChart) {
        this.updateCharts();
      }
    });
  }

  ngOnInit(): void {
    this.vmStateService.loadVms();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 200);
  }

  ngOnDestroy(): void {
    this.resourceChart?.destroy();
    this.osChart?.destroy();
  }

  /* ==========================================================================
     DATA VISUALIZATION: Chart.js Configuration
     ========================================================================== */

  private initCharts(): void {
    if (!this.resourceChartCanvas || !this.osChartCanvas) return;

    const isDark = this.themeService.isDark();
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

    this.resourceChart = new Chart(this.resourceChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Cores (vCPU)', 'RAM (GB)', 'Disco (GB / 10)'],
        datasets: [{
          label: 'Recursos en VMs Activas',
          data: [
            this.vmStateService.activeCores(),
            this.vmStateService.activeRamGb(),
            Math.round(this.vmStateService.activeDiskGb() / 10)
          ],
          backgroundColor: [
            'rgba(37, 99, 235, 0.75)',
            'rgba(6, 182, 212, 0.75)',
            'rgba(16, 185, 129, 0.75)'
          ],
          borderColor: [
            '#2563eb',
            '#06b6d4',
            '#10b981'
          ],
          borderWidth: 2,
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (context.dataIndex === 0) return ` ${context.parsed.y} Cores asignados`;
                if (context.dataIndex === 1) return ` ${context.parsed.y} GB de RAM activa`;
                return ` ${this.vmStateService.activeDiskGb()} GB de Disco activo`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: gridColor },
            ticks: { color: textColor }
          },
          x: {
            grid: { display: false },
            ticks: { color: textColor }
          }
        }
      }
    });

    const osMap = this.calculateOsDistribution();
    this.osChart = new Chart(this.osChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: Object.keys(osMap),
        datasets: [{
          data: Object.values(osMap),
          backgroundColor: [
            '#38bdf8',
            '#818cf8',
            '#34d399',
            '#f472b6',
            '#fbbf24'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
              color: textColor,
              font: { size: 11 }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  private updateCharts(): void {
    if (this.resourceChart) {
      this.resourceChart.data.datasets[0].data = [
        this.vmStateService.activeCores(),
        this.vmStateService.activeRamGb(),
        Math.round(this.vmStateService.activeDiskGb() / 10)
      ];
      this.resourceChart.update();
    }

    if (this.osChart) {
      const osMap = this.calculateOsDistribution();
      this.osChart.data.labels = Object.keys(osMap);
      this.osChart.data.datasets[0].data = Object.values(osMap);
      this.osChart.update();
    }
  }

  private calculateOsDistribution(): Record<string, number> {
    const map: Record<string, number> = {};
    for (const vm of this.vmStateService.vms()) {
      map[vm.os] = (map[vm.os] || 0) + 1;
    }
    return map;
  }

  /* ==========================================================================
     ACCIONES DE GESTIÓN
     ========================================================================== */

  public setViewMode(mode: 'grid' | 'table'): void {
    this.viewMode.set(mode);
  }

  public openCreateModal(): void {
    this.selectedVmForEdit.set(null);
    this.isModalOpen.set(true);
  }

  public openEditModal(vm: VirtualMachine): void {
    this.selectedVmForEdit.set(vm);
    this.isModalOpen.set(true);
  }

  public closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedVmForEdit.set(null);
  }

  public onModalSave(formData: Partial<VirtualMachine>): void {
    const editingVm = this.selectedVmForEdit();
    if (editingVm) {
      this.vmStateService.updateVmOptimistic(editingVm.id, formData);
    } else {
      this.vmStateService.createVmOptimistic(formData);
    }
    this.closeModal();
  }

  public toggleVmStatus(vm: VirtualMachine): void {
    const nextStatus = vm.status === 'Activa' ? 'Apagada' : 'Activa';
    this.vmStateService.updateStatusOptimistic(vm.id, nextStatus);
  }

  public setMaintenanceStatus(vm: VirtualMachine): void {
    this.vmStateService.updateStatusOptimistic(vm.id, 'Mantenimiento');
  }

  public deleteVm(vm: VirtualMachine): void {
    this.confirmationService.confirm({
      header: 'Confirmar Eliminación',
      message: `¿Está seguro de eliminar definitivamente la máquina virtual "${vm.name}"? Esta acción no se puede deshacer.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.vmStateService.deleteVmOptimistic(vm.id);
      }
    });
  }

  public setFilter(filter: string): void {
    this.vmStateService.activeFilter.set(filter);
  }

  public onSearchChange(term: string): void {
    this.vmStateService.searchTerm.set(term);
  }

  public getTagSeverity(status: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (status) {
      case 'Activa':
        return 'success';
      case 'Apagada':
        return 'danger';
      case 'Mantenimiento':
        return 'warn';
      default:
        return 'info';
    }
  }
}

