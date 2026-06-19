import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { MotoristaVeiculo } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';

type StatusFilter = 'Todos' | 'Ativos' | 'Encerrados';

interface VinculoForm {
  cod_motorista: string;
  cod_cavalo: string;
  cod_carreta: string;
  inicio: string;
  fim: string;
}

@Component({
  selector: 'app-motorista-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule, PageTitleComponent, IconComponent],
  templateUrl: './motorista-veiculos.component.html',
  styleUrls: ['./motorista-veiculos.component.scss'],
})
export class MotoristaVeiculosComponent {
  private data = inject(DataService);

  q = signal('');
  motoristaFilter = signal('Todos');
  cavaloFilter = signal('Todos');
  carretaFilter = signal('Todos');
  statusFilter = signal<StatusFilter>('Todos');
  sortKey = signal('inicio');
  sortDir = signal<'asc' | 'desc'>('desc');

  showForm = signal(false);
  selectedVinculo = signal<MotoristaVeiculo | null>(null);
  deleteTarget = signal<MotoristaVeiculo | null>(null);
  isSaving = signal(false);
  isDeleting = signal(false);
  formError = signal<string | null>(null);

  form = signal<VinculoForm>({
    cod_motorista: '',
    cod_cavalo: '',
    cod_carreta: '',
    inicio: '',
    fim: '',
  });

  vinculos = this.data.MOTORISTA_VEICULOS;
  motoristas = this.data.MOTORISTAS;
  veiculos = this.data.VEICULOS;

  filtered = computed(() => {
    const query = this.normalize(this.q());
    const motorista = this.motoristaFilter();
    const cavalo = this.cavaloFilter();
    const carreta = this.carretaFilter();
    const status = this.statusFilter();

    const rows = this.vinculos().filter(vinculo => {
      if (motorista !== 'Todos' && vinculo.cod_motorista !== Number(motorista)) return false;
      if (cavalo !== 'Todos' && vinculo.cod_cavalo !== Number(cavalo)) return false;
      if (carreta !== 'Todos' && vinculo.cod_carreta !== Number(carreta)) return false;
      if (status === 'Ativos' && !this.isAtivo(vinculo)) return false;
      if (status === 'Encerrados' && this.isAtivo(vinculo)) return false;

      if (!query) return true;

      const haystack = this.normalize([
        this.motoristaLabel(vinculo.cod_motorista),
        this.veiculoLabel(vinculo.cod_cavalo),
        this.veiculoLabel(vinculo.cod_carreta),
        vinculo.inicio,
        vinculo.fim || '',
      ].join(' '));

      return haystack.includes(query);
    });

    rows.sort((a, b) => {
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      const av = this.sortValue(a, this.sortKey());
      const bv = this.sortValue(b, this.sortKey());
      return String(av).localeCompare(String(bv), 'pt-BR', { numeric: true }) * dir;
    });

    return rows;
  });

  kpis = computed(() => {
    const all = this.vinculos();
    const ativos = all.filter(v => this.isAtivo(v)).length;
    return {
      total: all.length,
      ativos,
      encerrados: all.length - ativos,
    };
  });

  motoristaOptions = computed(() =>
    this.motoristas().map(m => ({
      value: String(m.codigo),
      label: `${m.nome} - CNH ${m.cnh}`,
    }))
  );

  cavaloOptions = computed(() =>
    this.veiculos()
      .filter(v => v.tipo === 'Cavalo')
      .map(v => ({
        value: String(v.codigo),
        label: `${v.placa} - ${this.data.modeloCompleto(v.cod_modelo)}`,
      }))
  );

  carretaOptions = computed(() =>
    this.veiculos()
      .filter(v => v.tipo === 'Carreta')
      .map(v => ({
        value: String(v.codigo),
        label: `${v.placa} - ${this.data.modeloCompleto(v.cod_modelo)}`,
      }))
  );

  toggleSort(key: string): void {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
      return;
    }

    this.sortKey.set(key);
    this.sortDir.set(key === 'inicio' ? 'desc' : 'asc');
  }

  isSorted(key: string): boolean {
    return this.sortKey() === key;
  }

  sortDirFor(key: string): string {
    if (this.sortKey() !== key) return 'sort';
    return this.sortDir() === 'asc' ? 'chevron-u' : 'chevron-d';
  }

  openCreate(): void {
    this.formError.set(null);
    this.data.apiError.set(null);
    this.selectedVinculo.set(null);
    this.form.set({
      cod_motorista: '',
      cod_cavalo: '',
      cod_carreta: '',
      inicio: this.todayIso(),
      fim: '',
    });
    this.showForm.set(true);
  }

  openEdit(vinculo: MotoristaVeiculo): void {
    this.formError.set(null);
    this.data.apiError.set(null);
    this.selectedVinculo.set(vinculo);
    this.form.set({
      cod_motorista: String(vinculo.cod_motorista || ''),
      cod_cavalo: String(vinculo.cod_cavalo || vinculo.cod_veiculo || ''),
      cod_carreta: String(vinculo.cod_carreta || ''),
      inicio: vinculo.inicio || this.todayIso(),
      fim: vinculo.fim || '',
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    if (this.isSaving()) return;
    this.formError.set(null);
    this.showForm.set(false);
    this.selectedVinculo.set(null);
  }

  upd(key: keyof VinculoForm, value: string): void {
    this.form.update(current => ({ ...current, [key]: value }));
  }

  async save(): Promise<void> {
    const form = this.form();
    this.formError.set(null);
    this.data.apiError.set(null);

    if (!form.cod_motorista || !form.cod_cavalo || !form.cod_carreta || !form.inicio) {
      this.formError.set('Preencha motorista, cavalo, carreta e início.');
      return;
    }

    if (form.cod_cavalo === form.cod_carreta) {
      this.formError.set('Cavalo e carreta devem ser veículos diferentes.');
      return;
    }

    if (form.fim && form.fim < form.inicio) {
      this.formError.set('A data fim não pode ser anterior à data início.');
      return;
    }

    this.isSaving.set(true);

    const payload = {
      cod_motorista: Number(form.cod_motorista),
      cod_cavalo: Number(form.cod_cavalo),
      cod_carreta: Number(form.cod_carreta),
      inicio: form.inicio,
      fim: form.fim || null,
    };

    const ok = this.selectedVinculo()
      ? await this.data.updateMotoristaVeiculo(this.selectedVinculo()!.codigo, payload)
      : !!(await this.data.addMotoristaVeiculo(payload));

    this.isSaving.set(false);

    if (ok) {
      this.closeForm();
      return;
    }

    this.formError.set(this.data.apiError() || 'Não foi possível salvar o vínculo.');
  }

  openDelete(vinculo: MotoristaVeiculo): void {
    this.deleteTarget.set(vinculo);
  }

  closeDelete(): void {
    if (this.isDeleting()) return;
    this.deleteTarget.set(null);
  }

  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (!target) return;

    this.isDeleting.set(true);
    const ok = await this.data.deleteMotoristaVeiculo(target.codigo);
    this.isDeleting.set(false);

    if (ok) this.deleteTarget.set(null);
  }

  clearFilters(): void {
    this.q.set('');
    this.motoristaFilter.set('Todos');
    this.cavaloFilter.set('Todos');
    this.carretaFilter.set('Todos');
    this.statusFilter.set('Todos');
  }

  motoristaLabel(codigo: number): string {
    if (!codigo) return 'Selecione um motorista';
    return this.data.motoristaById(codigo)?.nome || 'Motorista não encontrado';
  }

  veiculoLabel(codigo: number): string {
    if (!codigo) return 'Selecione um veículo';
    const veiculo = this.data.veiculoById(codigo);
    return veiculo ? `${veiculo.placa} - ${veiculo.tipo}` : 'Veículo não encontrado';
  }

  veiculoPlaca(codigo: number): string {
    return this.data.veiculoById(codigo)?.placa || '---';
  }

  fmtData(value: string | null | undefined): string {
    return this.data.fmtData(value || null);
  }

  isAtivo(vinculo: MotoristaVeiculo): boolean {
    return !vinculo.fim;
  }

  statusLabel(vinculo: MotoristaVeiculo): string {
    return this.isAtivo(vinculo) ? 'Ativo' : 'Encerrado';
  }

  trackByVinculo(index: number, vinculo: MotoristaVeiculo): number {
    return vinculo.codigo;
  }

  get formTitle(): string {
    return this.selectedVinculo() ? 'EDITAR VÍNCULO' : 'NOVO VÍNCULO';
  }

  get selectedCodigo(): string {
    return this.selectedVinculo()
      ? String(this.selectedVinculo()!.codigo).padStart(3, '0')
      : '---';
  }

  private sortValue(vinculo: MotoristaVeiculo, key: string): string | number {
    if (key === 'motorista') return this.motoristaLabel(vinculo.cod_motorista);
    if (key === 'cavalo') return this.veiculoLabel(vinculo.cod_cavalo);
    if (key === 'carreta') return this.veiculoLabel(vinculo.cod_carreta);
    if (key === 'status') return this.statusLabel(vinculo);
    return (vinculo as any)[key] ?? '';
  }

  private normalize(value: string): string {
    return value
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private todayIso(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }
}
