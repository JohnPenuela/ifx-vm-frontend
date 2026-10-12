export type VmStatus = 'Activa' | 'Apagada' | 'Mantenimiento';

export interface VirtualMachine {
  id: number;
  name: string;
  cores: number;
  ram: number;
  disk: number;
  os: string;
  status: VmStatus;
  ip_address?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  _optimistic?: boolean;
  _highlight?: boolean;
}

export interface VmStats {
  total_vms: number;
  active_vms: number;
  stopped_vms: number;
  maintenance_vms: number;
  active_cores: number;
  active_ram_gb: number;
  active_disk_gb: number;
  total_cores: number;
  total_ram_gb: number;
  total_disk_gb: number;
  os_distribution?: Record<string, number>;
}

export interface VmApiResponse {
  data: VirtualMachine[];
  stats: VmStats;
}

export interface VmSingleResponse {
  message?: string;
  data: VirtualMachine;
  stats?: VmStats;
}
