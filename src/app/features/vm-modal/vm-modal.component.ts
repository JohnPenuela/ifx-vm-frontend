import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { VirtualMachine } from '../../shared/models/vm/vm.model';

@Component({
  selector: 'app-vm-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule
  ],
  templateUrl: './vm-modal.component.html',
  styleUrls: ['./vm-modal.component.scss']
})
export class VmModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  @Input() vm: VirtualMachine | null = null;
  @Input() visible: boolean = true;
  @Output() save = new EventEmitter<Partial<VirtualMachine>>();
  @Output() close = new EventEmitter<void>();

  public form!: FormGroup;
  public isEditing = false;

  public readonly availableOperatingSystems = [
    { label: 'Ubuntu 22.04 LTS', value: 'Ubuntu 22.04 LTS' },
    { label: 'Debian 12', value: 'Debian 12' },
    { label: 'Rocky Linux 9', value: 'Rocky Linux 9' },
    { label: 'Windows Server 2022', value: 'Windows Server 2022' },
    { label: 'CentOS Stream 9', value: 'CentOS Stream 9' }
  ];

  public readonly availableStatuses = [
    { label: 'Activa', value: 'Activa' },
    { label: 'Apagada', value: 'Apagada' },
    { label: 'Mantenimiento', value: 'Mantenimiento' }
  ];

  ngOnInit(): void {
    this.isEditing = !!this.vm && this.vm.id > 0;
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: [
        this.vm?.name || '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(50),
          Validators.pattern('^[a-zA-Z0-9\\-_]+$')
        ]
      ],
      cores: [
        this.vm?.cores ?? 4,
        [Validators.required, Validators.min(1), Validators.max(64)]
      ],
      ram: [
        this.vm?.ram ?? 16,
        [Validators.required, Validators.min(1), Validators.max(512)]
      ],
      disk: [
        this.vm?.disk ?? 100,
        [Validators.required, Validators.min(10), Validators.max(10000)]
      ],
      os: [this.vm?.os || 'Ubuntu 22.04 LTS', [Validators.required]],
      status: [this.vm?.status || 'Activa', [Validators.required]],
      description: [this.vm?.description || '', [Validators.maxLength(255)]]
    });
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.save.emit(this.form.value);
  }

  public onCancel(): void {
    this.close.emit();
  }

  get f() {
    return this.form.controls;
  }
}
