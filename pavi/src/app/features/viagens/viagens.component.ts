import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { POSICAO_FROTA_STATUS, Viagem } from '../../core/models/models';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DetailModalComponent } from './detail-modal/detail-modal.component';
import { CreateViagemModalComponent } from './create-viagem-modal/create-viagem-modal.component';
import { DateInputComponent } from '../../shared/form-primitives/date-input/date-input.component';

@Component({
  selector: 'app-viagens',
  standalone: true,
  imports: [
    CommonModule, FormsModule, PageTitleComponent, StatusPillComponent,
    IconComponent, DetailModalComponent, CreateViagemModalComponent, DateInputComponent
  ],
  templateUrl: './viagens.component.html',
  styleUrls: ['./viagens.component.scss']
})
export class ViagensComponent implements OnInit {
  q = signal('');
  statusFilter = signal('Todos');
  dataIni = signal('');
  dataFim = signal('');
  sortKey = signal<string | null>('codigo');
  sortDir = signal<'asc' | 'desc'>('desc');
  selected = signal<Viagem | null>(null);
  focusIdx = signal(0);
  showCreate = signal(false);

  STATUS_FILTERS = ['Todos', ...POSICAO_FROTA_STATUS];

  constructor(private data: DataService) {}

  viagens = computed(() => this.data.VIAGENS());

  filtered = computed(() => {
    let rows = [...this.viagens()];

    // Search filter
    if (this.q()) {
      const haystack = this.q().toLowerCase();
      rows = rows.filter((v: Viagem) =>
        `${v.codigoStr} ${v.motorista?.nome ?? ''} ${v.cavalo?.placa ?? ''} ${v.carreta?.placa ?? ''} ${v.origemLabel} ${v.destinoLabel} ${v.origemEmpresa?.razao_social ?? ''} ${v.status}`.toLowerCase().includes(haystack)
      );
    }

    // Status filter
    if (this.statusFilter() !== 'Todos') {
      rows = rows.filter((v: Viagem) => v.status === this.statusFilter());
    }

    // Date filters
    if (this.dataIni()) {
      rows = rows.filter((v: Viagem) => v.data_inicio >= this.dataIni());
    }
    if (this.dataFim()) {
      rows = rows.filter((v: Viagem) => v.data_inicio <= this.dataFim());
    }

    // Sort
    if (this.sortKey()) {
      const key = this.sortKey()!;
      const dir = this.sortDir() === 'asc' ? 1 : -1;
      rows.sort((a: Viagem, b: Viagem) => {
        const av = (a as any)[key] ?? '';
        const bv = (b as any)[key] ?? '';
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
        return String(av).localeCompare(String(bv)) * dir;
      });
    }
    return rows;
  });

  kpis = computed(() => {
    const all = this.viagens();
    return {
      total: all.length,
      viajando: all.filter((v: Viagem) => v.status === 'Viajando').length,
      carregando: all.filter((v: Viagem) => ['Carregando', 'Descarregando'].includes(v.status)).length,
      aguardando: all.filter((v: Viagem) => v.status.startsWith('Aguardando')).length,
      vazios: all.filter((v: Viagem) => v.status.startsWith('Vazio')).length,
      folga: all.filter((v: Viagem) => v.status.includes('Folga')).length,
    };
  });

  ngOnInit() {}

  onQInput(event: Event) {
    this.q.set((event.target as HTMLInputElement).value);
  }

  toggleSort(key: string) {
    if (this.sortKey() === key) {
      // Toggle direction or clear if already toggled once
      if (this._sortToggleCount === key) {
        this.sortKey.set(null);
        this._sortToggleCount = null;
      } else {
        this.sortDir.update(d => d === 'asc' ? 'desc' : 'asc');
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

  private _sortToggleCount: string | null = null;

  setFocus(idx: number) {
    this.focusIdx.set(idx);
  }

  openDetail(v: Viagem) {
    this.selected.set(v);
  }

  closeDetail() {
    this.selected.set(null);
  }

  openCreate() {
    this.showCreate.set(true);
  }

  closeCreate() {
    this.showCreate.set(false);
  }

  async onCreatedViagem(data: any) {
    const created = await this.data.addViagem({
      data_inicio: data.data_inicio,
      data_fim: data.data_fim || null,
      valor_frete: data.valor_frete || 0,
      valor_pedagio: data.valor_pedagio || 0,
      status: data.status || 'Vazio',
      cod_motorista: Number(data.cod_motorista),
      cod_cavalo: Number(data.cod_cavalo),
      cod_carreta: data.cod_carreta ? Number(data.cod_carreta) : 0,
      cod_origem: Number(data.cod_origem_empresa),
      cod_destino: data.cod_destino_empresa ? Number(data.cod_destino_empresa) : 0,
      km: data.km || 0,
      progresso: 0,
      observacoes: data.observacoes || '',
    });

    if (created) {
      this.closeCreate();
    }
  }

  onDeletedViagem(codigo: number) {
    this.closeDetail();
  }

  onSavedDetail(payload: { codigo: number }) {
    const refreshed = this.data.VIAGENS().find(viagem => viagem.codigo === payload.codigo) || null;
    this.selected.set(refreshed);
  }

  clearFilters() {
    this.q.set('');
    this.statusFilter.set('Todos');
    this.dataIni.set('');
    this.dataFim.set('');
  }

  exportToPdf() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = this.filtered();
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PAVI - Relatório de Posição Frota</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #085eac; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #085eac; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .money { text-align: right; }
        </style>
      </head>
      <body>
        <h1>PAVI - Relatório de Posição Frota</h1>
        <p>Total: ${rows.length} posições</p>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Status</th>
              <th>Início</th>
              <th>Motorista</th>
              <th>Cavalo</th>
              <th>Rota</th>
              <th>KM</th>
              <th>Frete</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(v => `
              <tr>
                <td>${v.codigoStr}</td>
                <td>${v.status}</td>
                <td>${this.data.fmtData(v.data_inicio)}</td>
                <td>${v.motorista?.nome ?? '-'}</td>
                <td>${v.cavalo?.placa ?? '-'}</td>
                <td>${v.origemLabel} → ${v.destinoLabel || 'Sem destino'}</td>
                <td class="money">${v.km.toLocaleString('pt-BR')}</td>
                <td class="money">${this.data.brl(v.valor_frete)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>window.print()</script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  }

  fmtData(s: string): string {
    return this.data.fmtData(s);
  }

  brl(n: number): string {
    return this.data.brl(n);
  }

  isSorted(key: string): boolean {
    return this.sortKey() === key;
  }

  sortDirFor(key: string): string {
    if (this.sortKey() !== key) return 'sort';
    return this.sortDir() === 'asc' ? 'chevron-u' : 'chevron-d';
  }

  trackByViagem(index: number, v: Viagem) {
    return v.codigo;
  }
}
