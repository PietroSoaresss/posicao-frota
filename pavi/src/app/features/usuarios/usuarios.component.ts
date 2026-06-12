import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CreateUserRequest, UpdateUserRequest, Usuario, UserRole } from '../../core/models/models';
import { DataService } from '../../core/services/data.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { CreateUsuarioModalComponent, SaveUsuarioPayload } from './create-usuario-modal/create-usuario-modal.component';
import { ConfirmDeleteUsuarioModalComponent } from './confirm-delete-usuario-modal/confirm-delete-usuario-modal.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageTitleComponent,
    IconComponent,
    CreateUsuarioModalComponent,
    ConfirmDeleteUsuarioModalComponent,
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  private readonly data = inject(DataService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  q = signal('');
  sortKey = signal<'codigo' | 'username' | 'role'>('username');
  sortDir = signal<'asc' | 'desc'>('asc');
  showCreate = signal(false);
  selectedUsuario = signal<Usuario | null>(null);
  deleteTarget = signal<Usuario | null>(null);
  pageError = signal<string | null>(null);
  modalError = signal<string | null>(null);
  isLoading = signal(false);
  isDeleting = signal(false);

  usuarios = this.data.USUARIOS;
  currentUser = this.auth.currentUser;

  filtered = computed(() => {
    const query = this.q().trim().toLowerCase();

    const rows = [...this.usuarios()].filter(usuario => {
      const haystack = `${usuario.username} ${usuario.role} ${this.roleLabel(usuario.role)}`.toLowerCase();
      return !query || haystack.includes(query);
    });

    rows.sort((a, b) => {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      const key = this.sortKey();
      const av = a[key];
      const bv = b[key];

      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }

      return String(av).localeCompare(String(bv)) * dir;
    });

    return rows;
  });

  kpis = computed(() => {
    const all = this.usuarios();
    return {
      total: all.length,
      admins: all.filter(usuario => usuario.role === 'ADMIN').length,
      operadores: all.filter(usuario => usuario.role === 'OPERADOR').length,
    };
  });

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.isLoading.set(true);
    this.pageError.set(null);
    await this.data.syncUsuarios();

    if (this.data.apiError()) {
      this.pageError.set(this.data.apiError());
    }

    this.isLoading.set(false);
  }

  toggleSort(key: 'codigo' | 'username' | 'role') {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  isSorted(key: 'codigo' | 'username' | 'role'): boolean {
    return this.sortKey() === key;
  }

  sortDirFor(key: 'codigo' | 'username' | 'role'): string {
    if (this.sortKey() !== key) return 'sort';
    return this.sortDir() === 'asc' ? 'chevron-u' : 'chevron-d';
  }

  openCreate() {
    this.modalError.set(null);
    this.selectedUsuario.set(null);
    this.showCreate.set(true);
  }

  openEdit(usuario: Usuario) {
    this.modalError.set(null);
    this.selectedUsuario.set(usuario);
    this.showCreate.set(true);
  }

  closeModal() {
    this.showCreate.set(false);
    this.selectedUsuario.set(null);
    this.modalError.set(null);
  }

  openDeleteConfirm(usuario: Usuario) {
    if (this.isCurrentUser(usuario)) return;
    this.deleteTarget.set(usuario);
    this.pageError.set(null);
  }

  closeDeleteConfirm() {
    if (this.isDeleting()) return;
    this.deleteTarget.set(null);
  }

  async onSaveUsuario(payload: SaveUsuarioPayload): Promise<void> {
    const selected = this.selectedUsuario();
    const isSelfUsernameChange = !!selected
      && this.isCurrentUser(selected)
      && payload.username.trim() !== selected.username;

    const ok = selected
      ? await this.data.updateUsuario(selected.codigo, payload as UpdateUserRequest, { skipResync: isSelfUsernameChange })
      : !!(await this.data.addUsuario(payload as CreateUserRequest));

    if (!ok) {
      this.modalError.set(this.data.apiError());
      return;
    }

    this.pageError.set(null);
    this.closeModal();

    if (isSelfUsernameChange) {
      alert('Seu username foi alterado. Faça login novamente para continuar.');
      this.auth.logout();
      await this.router.navigate(['/login']);
    }
  }

  async confirmDeleteUsuario(): Promise<void> {
    const usuario = this.deleteTarget();
    if (!usuario) return;

    this.isDeleting.set(true);
    this.pageError.set(null);
    const ok = await this.data.deleteUsuario(usuario.codigo);

    if (!ok) {
      this.pageError.set(this.data.apiError());
      this.isDeleting.set(false);
      return;
    }

    this.isDeleting.set(false);
    this.deleteTarget.set(null);
  }

  clearFilters() {
    this.q.set('');
  }

  roleLabel(role: UserRole): string {
    return role === 'ADMIN' ? 'Administrador' : 'Operador';
  }

  isCurrentUser(usuario: Usuario): boolean {
    return usuario.username === this.currentUser()?.username;
  }

  initials(username: string): string {
    const trimmed = username.trim();
    return trimmed ? trimmed.slice(0, 2).toUpperCase() : '??';
  }

  trackByUsuario(index: number, usuario: Usuario) {
    return usuario.codigo;
  }
}
