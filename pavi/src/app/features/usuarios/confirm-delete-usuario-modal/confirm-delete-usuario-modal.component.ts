import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Usuario, UserRole } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-confirm-delete-usuario-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './confirm-delete-usuario-modal.component.html',
  styleUrls: ['./confirm-delete-usuario-modal.component.scss']
})
export class ConfirmDeleteUsuarioModalComponent {
  @Input({ required: true }) usuario!: Usuario;
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

  roleLabel(role: UserRole): string {
    return role === 'ADMIN' ? 'Administrador' : 'Operador';
  }

  get initials(): string {
    const username = this.usuario?.username?.trim() ?? '';
    return username ? username.slice(0, 2).toUpperCase() : '??';
  }
}
