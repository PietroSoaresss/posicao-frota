import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { Veiculo } from '../../core/models/models';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CreateVeiculoModalComponent } from './veiculo-modal/create-veiculo-modal.component';

type VeiculoTipo = 'Todos' | 'Cavalo' | 'Carreta';

@Component({
  selector: 'app-caminhoes',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, IconComponent, CreateVeiculoModalComponent],
  templateUrl: './caminhoes.component.html',
  styleUrls: ['./caminhoes.component.scss']
})
export class CaminhoesComponent {
  private data = inject(DataService);

  q = signal('');
  tipoFilter = signal<VeiculoTipo>('Todos');
  sortKey = signal('placa');
  sortDir = signal<'asc' | 'desc'>('asc');
  showCreate = signal(false);
  selectedVeiculo = signal<Veiculo | null>(null);

  veiculos = this.data.VEICULOS;

  filtered = computed(() => {
    let rows = [...this.veiculos()].filter((v: Veiculo) => {
      const haystack = `${v.placa} ${this.data.modeloCompleto(v.cod_modelo)} ${v.tipo} ${v.chassi} ${v.renavam}`.toLowerCase();
      if (this.q() && !haystack.includes(this.q().toLowerCase())) return false;
      if (this.tipoFilter() !== 'Todos' && v.tipo !== this.tipoFilter()) return false;
      return true;
    });

    rows.sort((a: Veiculo, b: Veiculo) => {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      const av = (a as any)[this.sortKey()] ?? '';
      const bv = (b as any)[this.sortKey()] ?? '';
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return rows;
  });

  kpis = computed(() => {
    const all = this.veiculos();
    return {
      total: all.length,
      cavalos: all.filter((v: Veiculo) => v.tipo === 'Cavalo').length,
      carretas: all.filter((v: Veiculo) => v.tipo === 'Carreta').length,
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
    this.selectedVeiculo.set(null);
    this.showCreate.set(true);
  }

  openEdit(v: Veiculo) {
    this.selectedVeiculo.set(v);
    this.showCreate.set(true);
  }

  async onSaveVeiculo(formData: any) {
    const ok = this.selectedVeiculo()
      ? await this.data.updateVeiculo(this.selectedVeiculo()!.codigo, formData)
      : !!(await this.data.addVeiculo(formData));

    if (ok) {
      this.closeModal();
    }
  }

  closeModal() {
    this.showCreate.set(false);
    this.selectedVeiculo.set(null);
  }

  clearFilters() {
    this.q.set('');
    this.tipoFilter.set('Todos');
  }

  modeloCompleto(cod: number): string {
    return this.data.modeloCompleto(cod);
  }

  trackByVeiculo(index: number, v: Veiculo) {
    return v.codigo;
  }
}
