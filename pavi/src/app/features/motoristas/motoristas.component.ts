import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { Motorista } from '../../core/models/models';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CreateMotoristaModalComponent } from './create-motorista-modal/create-motorista-modal.component';
import { ConfirmDeleteMotoristaModalComponent } from './confirm-delete-motorista-modal/confirm-delete-motorista-modal.component';

@Component({
  selector: 'app-motoristas',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, IconComponent, CreateMotoristaModalComponent, ConfirmDeleteMotoristaModalComponent],
  templateUrl: './motoristas.component.html',
  styleUrls: ['./motoristas.component.scss']
})
export class MotoristasComponent {
  private data = inject(DataService);

  q = signal('');
  sortKey = signal('nome');
  sortDir = signal<'asc' | 'desc'>('asc');
  showCreate = signal(false);
  selectedMotorista = signal<Motorista | null>(null);
  deleteTarget = signal<Motorista | null>(null);
  isDeleting = signal(false);

  motoristas = this.data.MOTORISTAS;

  filtered = computed(() => {
    let rows = [...this.motoristas()].filter((m: Motorista) => {
      const haystack = `${m.nome} ${m.cnh} ${m.sexo}`.toLowerCase();
      if (this.q() && !haystack.includes(this.q().toLowerCase())) return false;
      return true;
    });

    rows.sort((a: Motorista, b: Motorista) => {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      const av = (a as any)[this.sortKey()] ?? '';
      const bv = (b as any)[this.sortKey()] ?? '';
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  });

  toggleSort(key: string) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  isSorted(key: string): boolean {
    return this.sortKey() === key;
  }

  sortDirFor(key: string): string {
    if (this.sortKey() !== key) return 'sort';
    return this.sortDir() === 'asc' ? 'chevron-u' : 'chevron-d';
  }

  openCreate() {
    this.selectedMotorista.set(null);
    this.showCreate.set(true);
  }

  openEdit(m: Motorista) {
    this.selectedMotorista.set(m);
    this.showCreate.set(true);
  }

  closeModal() {
    this.showCreate.set(false);
    this.selectedMotorista.set(null);
  }

  async onSaveMotorista(formData: any) {
    if (this.selectedMotorista()) {
      await this.data.updateMotorista(this.selectedMotorista()!.codigo, formData);
    } else {
      await this.data.addMotorista(formData);
    }
    this.closeModal();
  }

  openDeleteConfirm(m: Motorista) {
    this.deleteTarget.set(m);
  }

  closeDeleteConfirm() {
    if (this.isDeleting()) return;
    this.deleteTarget.set(null);
  }

  async confirmDeleteMotorista() {
    const motorista = this.deleteTarget();
    if (!motorista) return;

    this.isDeleting.set(true);
    const ok = await this.data.deleteMotorista(motorista.codigo);
    this.isDeleting.set(false);

    if (ok) this.deleteTarget.set(null);
  }

  clearFilters() {
    this.q.set('');
  }

  isValidadeProxima(d: string): boolean {
    if (!d) return false;
    const ven = new Date(d);
    const hoje = new Date();
    const diff = ven.getTime() - hoje.getTime();
    return diff < 90 * 24 * 60 * 60 * 1000;
  }

  fmtValidade(d: string): string {
    return this.data.fmtData(d);
  }

  trackByMotorista(index: number, m: Motorista) {
    return m.codigo;
  }
}
