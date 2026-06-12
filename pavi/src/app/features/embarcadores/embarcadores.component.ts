import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { Empresa } from '../../core/models/models';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CreateEmbarcadorModalComponent } from './create-embarcador-modal/create-embarcador-modal.component';

@Component({
  selector: 'app-embarcadores',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, IconComponent, CreateEmbarcadorModalComponent],
  templateUrl: './embarcadores.component.html',
  styleUrls: ['./embarcadores.component.scss']
})
export class EmbarcadoresComponent {
  private data = inject(DataService);

  q = signal('');
  sortKey = signal('razao_social');
  sortDir = signal<'asc' | 'desc'>('asc');
  showCreate = signal(false);
  selectedEmpresa = signal<Empresa | null>(null);

  empresas = this.data.EMPRESAS;

  filtered = computed(() => {
    let rows = [...this.empresas()].filter((e: Empresa) => {
      const haystack = `${e.razao_social} ${e.cnpj} ${this.data.cidadeLabel(e.cod_cidade)}`.toLowerCase();
      if (this.q() && !haystack.includes(this.q().toLowerCase())) return false;
      return true;
    });

    rows.sort((a: Empresa, b: Empresa) => {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      const av = (a as any)[this.sortKey()] ?? '';
      const bv = (b as any)[this.sortKey()] ?? '';
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  });

  kpis = computed(() => {
    return {
      total: this.empresas().length,
    };
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
    this.selectedEmpresa.set(null);
    this.showCreate.set(true);
  }

  openEdit(e: Empresa) {
    this.selectedEmpresa.set(e);
    this.showCreate.set(true);
  }

  async onSaveEmpresa(formData: any) {
    const ok = this.selectedEmpresa()
      ? await this.data.updateEmpresa(this.selectedEmpresa()!.codigo, formData)
      : !!(await this.data.addEmpresa(formData));

    if (ok) {
      this.closeModal();
    }
  }

  closeModal() {
    this.showCreate.set(false);
    this.selectedEmpresa.set(null);
  }

  clearFilters() {
    this.q.set('');
  }

  cidadeLabel(cod: number): string {
    return this.data.cidadeLabel(cod);
  }

  trackByEmpresa(index: number, e: Empresa) {
    return e.codigo;
  }
}
