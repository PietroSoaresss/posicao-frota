import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Motorista } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-confirm-delete-motorista-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './confirm-delete-motorista-modal.component.html',
  styleUrls: ['./confirm-delete-motorista-modal.component.scss']
})
export class ConfirmDeleteMotoristaModalComponent {
  @Input({ required: true }) motorista!: Motorista;
  @Input() isDeleting: boolean = false;

  @Output() onClose = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  close(): void {
    if (this.isDeleting) return;
    this.onClose.emit();
  }

  confirm(): void {
    if (this.isDeleting) return;
    this.onConfirm.emit();
  }

  get initials(): string {
    const parts = this.motorista?.nome?.trim().split(/\s+/) ?? [];
    return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase() || '??';
  }
}
