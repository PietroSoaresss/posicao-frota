import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateUserRequest, UpdateUserRequest, Usuario, UserRole } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { FormFieldComponent } from '../../../shared/form-primitives/form-field/form-field.component';
import { SelectInputComponent, SelectOption } from '../../../shared/form-primitives/select-input/select-input.component';
import { TextInputComponent } from '../../../shared/form-primitives/text-input/text-input.component';

interface UsuarioFormData {
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  color: string;
}

export type SaveUsuarioPayload = CreateUserRequest | UpdateUserRequest;

@Component({
  selector: 'app-create-usuario-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    FormFieldComponent,
    SelectInputComponent,
    TextInputComponent,
  ],
  templateUrl: './create-usuario-modal.component.html',
  styleUrls: ['./create-usuario-modal.component.scss']
})
export class CreateUsuarioModalComponent implements OnInit {
  private readonly editableRoleOptions: SelectOption[] = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'OPERADOR', label: 'Operador' },
  ];

  private readonly selfRoleOptions: SelectOption[] = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'OPERADOR', label: 'Operador', disabled: true },
  ];

  @Input() usuario: Usuario | null = null;
  @Input() currentUsername: string | null = null;
  @Input() errorMessage: string = '';

  @Output() onClose = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<SaveUsuarioPayload>();

  dirty = signal(false);
  isEdit = signal(false);

  form = signal<UsuarioFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'OPERADOR',
    color: '#2563EB',
  });

  ngOnInit(): void {
    if (!this.usuario) return;

    this.isEdit.set(true);
    this.form.set({
      username: this.usuario.username,
      password: '',
      confirmPassword: '',
      role: this.usuario.role,
      color: this.usuario.color,
    });
  }

  upd(key: keyof UsuarioFormData, value: string) {
    this.form.update(prev => ({
      ...prev,
      [key]: key === 'role' ? (value as UserRole) : value,
    }));
    this.dirty.set(true);
  }

  close() {
    this.onClose.emit();
  }

  save() {
    const data = this.form();
    const username = data.username.trim();

    if (!username) {
      alert('Informe o username do usuário.');
      return;
    }

    if (this.isSelf() && data.role !== 'ADMIN') {
      alert('Você não pode rebaixar o próprio usuário para OPERADOR.');
      return;
    }

    if (this.isEdit()) {
      this.onSave.emit({
        username,
        role: data.role,
        color: data.color,
      });
      return;
    }

    if (!data.password || !data.confirmPassword) {
      alert('Informe a senha e a confirmação para criar o usuário.');
      return;
    }

    if (data.password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (data.password !== data.confirmPassword) {
      alert('A confirmação de senha não confere.');
      return;
    }

    this.onSave.emit({
      username,
      password: data.password,
      role: data.role,
      color: data.color,
    });
  }

  isSelf(): boolean {
    return !!this.usuario && !!this.currentUsername && this.usuario.username === this.currentUsername;
  }

  roleLabel(role: UserRole): string {
    return role === 'ADMIN' ? 'Administrador' : 'Operador';
  }

  get roleOptions(): SelectOption[] {
    if (this.isSelf()) {
      return this.selfRoleOptions;
    }

    return this.editableRoleOptions;
  }

  colorOptions = ['#2563EB', '#16A34A', '#F97316', '#7C3AED', '#DC2626', '#0891B2', '#CA8A04', '#DB2777'];

  get initials(): string {
    const username = this.form().username.trim();
    return username ? username.slice(0, 2).toUpperCase() : '??';
  }

  get codigoStr(): string {
    if (!this.usuario) return '???';
    return String(this.usuario.codigo).padStart(3, '0');
  }
}
