import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { FRETE_STATUS, Frete } from '../../core/models/models';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CreateFreteModalComponent } from './create-frete-modal/create-frete-modal.component';
import { DateInputComponent } from '../../shared/form-primitives/date-input/date-input.component';

@Component({
  selector: 'app-fretes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageTitleComponent,
    IconComponent,
    CreateFreteModalComponent,
    DateInputComponent,
  ],
  templateUrl: './fretes.component.html',
  styleUrls: ['./fretes.component.scss'],
})
export class FretesComponent implements OnInit {
  private data = inject(DataService);

  q = signal('');
  statusFilter = signal('Todos');
  dataIni = signal('');
  dataFim = signal('');
  sortKey = signal<string | null>('id');
  sortDir = signal<'asc' | 'desc'>('desc');
  showCreate = signal(false);
  selectedFrete = signal<Frete | null>(null);

  fretes = computed(() => this.data.FRETES());
  isLoading = signal(false);
  error = signal<string | null>(null);

  readonly STATUS_FILTERS = ['Todos', ...FRETE_STATUS];

  readonly DELIVERY_STATUS_META: Record<string, { fg: string; bg: string; border: string; solid: string }> = {
    'Autorizado p/pgto': { solid: '#2e7d32', fg: '#2e7d32', bg: '#e8f5e9', border: '#bcdfbf' },
    'Bloq Canhoto NF Frete/Venda': { solid: '#c62828', fg: '#c62828', bg: '#fdecec', border: '#f3c2c2' },
    'Bloq Canhoto NF Frete/Transferência': { solid: '#c62828', fg: '#c62828', bg: '#fdecec', border: '#f3c2c2' },
    'Solicitar Desacordo': { solid: '#ef6c00', fg: '#b45309', bg: '#fff7ed', border: '#fed7aa' },
    'Desacordo Solicitado': { solid: '#ea580c', fg: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
    'Falta Lançamento': { solid: '#085eac', fg: '#085eac', bg: '#e8f0fe', border: '#c2d7f5' },
    'Em tratativa': { solid: '#7c3aed', fg: '#6d28d9', bg: '#f3e8ff', border: '#ddd6fe' },
    'Pavi 3°': { solid: '#0f766e', fg: '#0f766e', bg: '#ccfbf1', border: '#99f6e4' },
    Complemento: { solid: '#0284c7', fg: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
    'Pagamento Parcial': { solid: '#ca8a04', fg: '#a16207', bg: '#fef9c3', border: '#fde68a' },
    'Complemento Solicitado': { solid: '#2563eb', fg: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
    'Complemento Aprovado': { solid: '#16a34a', fg: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
    'Prev Pagamento': { solid: '#64748b', fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  };

  private _sortToggleCount: string | null = null;

  ngOnInit() {
    this.loadFretes();
  }

  async loadFretes() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      await this.data.getFretes();
    } catch (e: any) {
      this.error.set(this.data.extractError(e));
    } finally {
      this.isLoading.set(false);
    }
  }

  filtered = computed(() => {
    let rows = [...this.fretes()];

    if (this.q()) {
      const hay = this.q().toLowerCase();
      rows = rows.filter((f) =>
        `${f.id} ${this.statusLabel(f.deliveryStatus)} ${f.deliveryType ?? ''} ${f.cte ?? ''} ${f.boarding ?? ''} ${f.tollStatus ?? ''} ${f.observations ?? ''}`
          .toLowerCase()
          .includes(hay),
      );
    }

    if (this.statusFilter() !== 'Todos') {
      rows = rows.filter((f) => this.statusLabel(f.deliveryStatus) === this.statusFilter());
    }

    if (this.dataIni()) {
      rows = rows.filter((f) => f.date >= this.dataIni());
    }
    if (this.dataFim()) {
      rows = rows.filter((f) => f.date <= this.dataFim());
    }

    if (this.sortKey()) {
      const key = this.sortKey()!;
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      rows.sort((a, b) => {
        const av = (a as any)[key] ?? '';
        const bv = (b as any)[key] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }

    return rows;
  });

  kpis = computed(() => {
    const all = this.fretes();
    return {
      total: all.length,
      autorizados: all.filter((f) => this.statusLabel(f.deliveryStatus) === 'Autorizado p/pgto').length,
      bloqueados: all.filter((f) => this.statusLabel(f.deliveryStatus).startsWith('Bloq')).length,
      tratativas: all.filter((f) => ['Em tratativa', 'Solicitar Desacordo', 'Desacordo Solicitado'].includes(this.statusLabel(f.deliveryStatus))).length,
      complementos: all.filter((f) => this.statusLabel(f.deliveryStatus).includes('Complemento')).length,
      previstos: all.filter((f) => ['Prev Pagamento', 'Pagamento Parcial'].includes(this.statusLabel(f.deliveryStatus))).length,
    };
  });

  toggleSort(key: string) {
    if (this.sortKey() === key) {
      if (this._sortToggleCount === key) {
        this.sortKey.set(null);
        this._sortToggleCount = null;
      } else {
        this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
        this._sortToggleCount = key;
      }
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
      this._sortToggleCount = key;
    }
  }

  clearSort() {
    this.sortKey.set(null);
    this._sortToggleCount = null;
  }

  isSorted(key: string): boolean {
    return this.sortKey() === key;
  }

  sortDirFor(key: string): string {
    if (this.sortKey() !== key) return 'sort';
    return this.sortDir() === 'asc' ? 'chevron-u' : 'chevron-d';
  }

  openCreate() {
    this.selectedFrete.set(null);
    this.showCreate.set(true);
  }

  openEdit(f: Frete) {
    this.selectedFrete.set(f);
    this.showCreate.set(true);
  }

  closeModal() {
    this.showCreate.set(false);
    this.selectedFrete.set(null);
  }

  async onSaveFrete(formData: any) {
    const ok = this.selectedFrete()
      ? await this.data.updateFrete(this.selectedFrete()!.id!, formData)
      : !!(await this.data.addFrete(formData));

    if (ok) {
      this.closeModal();
      await this.loadFretes();
    }
  }

  clearFilters() {
    this.q.set('');
    this.statusFilter.set('Todos');
    this.dataIni.set('');
    this.dataFim.set('');
  }

  statusMeta(status: string) {
    return (
      this.DELIVERY_STATUS_META[this.statusLabel(status)] ?? {
        solid: '#757575',
        fg: '#757575',
        bg: '#f5f5f5',
        border: '#e0e0e0',
      }
    );
  }

  statusLabel(status: string | null | undefined): string {
    return this.data.deliveryStatusFromApi(status);
  }

  fmtData(s: string | null | undefined): string {
    return this.data.fmtData(s ?? null);
  }

  brl(n: number | null | undefined): string {
    return this.data.brl(n ?? null);
  }

  freteStr(id: number | undefined): string {
    if (!id) return 'F-???';
    return 'F-' + String(id).padStart(4, '0');
  }

  trackByFrete(_: number, f: Frete) {
    return f.id;
  }

  exportToPdf() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = this.filtered();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PAVI - Relatorio de Fretes</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #085eac; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #085eac; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .money { text-align: right; }
        </style>
      </head>
      <body>
        <h1>PAVI - Relatorio de Fretes</h1>
        <p>Total: ${rows.length} fretes · Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Status</th>
              <th>Data</th>
              <th>Viagem</th>
              <th>Tipo</th>
              <th>CT-e</th>
              <th>Prazo</th>
              <th>Valor do frete</th>
              <th>Pedagio</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (f) => `
              <tr>
                <td>${this.freteStr(f.id)}</td>
                <td>${this.statusLabel(f.deliveryStatus)}</td>
                <td>${this.fmtData(f.date)}</td>
                <td>${f.trip?.id ? '#' + f.trip.id : '-'}</td>
                <td>${f.deliveryType ?? '-'}</td>
                <td>${f.cte ?? '-'}</td>
                <td>${this.fmtData(f.deadline)}</td>
                <td class="money">${this.brl(f.deliveryValue)}</td>
                <td class="money">${this.brl(f.tollValue ?? null)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        <script>window.print()</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
