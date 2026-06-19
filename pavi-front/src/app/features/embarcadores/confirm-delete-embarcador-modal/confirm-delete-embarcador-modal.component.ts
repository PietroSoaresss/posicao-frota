import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Empresa } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-confirm-delete-embarcador-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './confirm-delete-embarcador-modal.component.html',
  styleUrls: ['./confirm-delete-embarcador-modal.component.scss']
})
export class ConfirmDeleteEmbarcadorModalComponent {
  @Input({ required: true }) empresa!: Empresa;
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
}
