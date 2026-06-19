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
  gestorFilter = signal('Todos');
  dataIni = signal(this.todayInput());
  dataFim = signal(this.todayInput());
  sortKey = signal<string | null>(null);
  sortDir = signal<'asc' | 'desc'>('desc');
  selected = signal<Viagem | null>(null);
  focusIdx = signal(0);
  showCreate = signal(false);

  STATUS_FILTERS = ['Todos', ...POSICAO_FROTA_STATUS];

  constructor(private data: DataService) {}

  viagens = computed(() => this.data.VIAGENS());
  gestorOptions = computed(() => {
    const options = new Map<string, string>();

    for (const viagem of this.viagens()) {
      const key = this.gestorFilterKey(viagem);
      const label = viagem.gestor?.username?.trim() || 'Sem gestor';
      if (!options.has(key)) {
        options.set(key, label);
      }
    }

    return [
      { value: 'Todos', label: 'Todos' },
      ...Array.from(options.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  });

  filtered = computed(() => {
    let rows: Viagem[] = [...this.viagens()];

    if (this.dataIni()) {
      rows = rows.filter((v: Viagem) => v.data_posicao >= this.dataIni());
    }
    if (this.dataFim()) {
      rows = rows.filter((v: Viagem) => v.data_posicao <= this.dataFim());
    }

    if (this.isSingleDayView()) {
      rows = this.latestPositionByHorse(rows);
    }

    if (this.q()) {
      const haystack = this.q().toLowerCase();
      rows = rows.filter((v: Viagem) =>
        `${v.codigoStr} ${v.motorista?.nome ?? ''} ${v.cavalo?.placa ?? ''} ${v.carreta?.placa ?? ''} ${v.origemLabel} ${v.destinoLabel} ${v.origemEmpresas?.map(empresa => empresa.razao_social).join(' ') ?? ''} ${v.destinoEmpresas?.map(empresa => empresa.razao_social).join(' ') ?? ''} ${v.status} ${v.origem_texto ?? ''} ${v.destino_agenda ?? ''} ${v.embarcador_texto ?? ''} ${v.tnf ?? ''} ${v.gestor?.username ?? ''}`.toLowerCase().includes(haystack)
      );
    }

    if (this.statusFilter() !== 'Todos') {
      rows = rows.filter((v: Viagem) => v.status === this.statusFilter());
    }

    if (this.gestorFilter() !== 'Todos') {
      rows = rows.filter((v: Viagem) => this.gestorFilterKey(v) === this.gestorFilter());
    }

    rows.sort((a: Viagem, b: Viagem) => {
      const byMotorista = (a.motorista?.nome ?? '').localeCompare(b.motorista?.nome ?? '', 'pt-BR');
      if (byMotorista !== 0) return byMotorista;

      const byData = String(a.data_posicao || '').localeCompare(String(b.data_posicao || ''));
      if (byData !== 0) return byData;

      return String(a.codigoStr || '').localeCompare(String(b.codigoStr || ''), 'pt-BR');
    });

    return rows;
  });

  ngOnInit() {}

  onQInput(event: Event) {
    this.q.set((event.target as HTMLInputElement).value);
  }

  toggleSort(key: string) {
    if (this.sortKey() === key) {
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

  private isSingleDayView(): boolean {
    return !!this.dataIni() && !!this.dataFim() && this.dataIni() === this.dataFim();
  }

  private latestPositionByHorse(rows: Viagem[]): Viagem[] {
    const selected = new Map<number | string, Viagem>();

    for (const row of rows) {
      const key = row.cod_cavalo || row.cavalo?.placa || row.codigo;
      const current = selected.get(key);
      if (!current || this.isNewerPosition(row, current)) {
        selected.set(key, row);
      }
    }

    return rows.filter(row => {
      const key = row.cod_cavalo || row.cavalo?.placa || row.codigo;
      return selected.get(key)?.codigo === row.codigo;
    });
  }

  private isNewerPosition(candidate: Viagem, current: Viagem): boolean {
    const byDate = String(candidate.data_posicao || '').localeCompare(String(current.data_posicao || ''));
    if (byDate !== 0) return byDate > 0;
    return candidate.codigo > current.codigo;
  }

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
      data_posicao: data.data_posicao || data.data_inicio,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim || null,
      valor_frete: data.valor_frete || 0,
      valor_pedagio: data.valor_pedagio || 0,
      status: data.status || 'Vazio',
      cod_motorista: Number(data.cod_motorista),
      cod_gestor: data.cod_gestor ? Number(data.cod_gestor) : 0,
      cod_cavalo: Number(data.cod_cavalo),
      cod_carreta: data.cod_carreta ? Number(data.cod_carreta) : 0,
      cod_origem: data.cod_origens?.[0] ?? Number(data.cod_origem_empresa),
      cod_destino: data.cod_destinos?.[0] ?? (data.cod_destino_empresa ? Number(data.cod_destino_empresa) : 0),
      cod_origens: data.cod_origens || (data.cod_origem_empresa ? [Number(data.cod_origem_empresa)] : []),
      cod_destinos: data.cod_destinos || (data.cod_destino_empresa ? [Number(data.cod_destino_empresa)] : []),
      km: data.km || 0,
      progresso: 0,
      observacoes: data.observacoes || '',
      copiado_de: null,
      origem_texto: data.origem_texto || '',
      tnf: data.tnf || '',
      destino_agenda: data.destino_agenda || '',
      embarcador_texto: data.embarcador_texto || '',
      valor_pavi: data.valor_pavi || 0,
      comprar_pedagio: data.comprar_pedagio || '',
      pagar_guia: data.pagar_guia || '',
      estados_substituicao: data.estados_substituicao || '',
      valor_emissao_segunda_perna: data.valor_emissao_segunda_perna || 0,
      pagar_guia_segunda_perna: data.pagar_guia_segunda_perna || '',
    });

    if (created) {
      this.closeCreate();
    } else {
      alert(this.data.apiError() || 'Nao foi possivel criar a posicao.');
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
    this.gestorFilter.set('Todos');
    this.dataIni.set(this.todayInput());
    this.dataFim.set(this.todayInput());
  }

  exportToPdf() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = this.filtered();
    const layout = this.printLayout(rows.length);
    const periodo = `${this.printDateInputDisplay(this.dataIni())} ate ${this.printDateInputDisplay(this.dataFim())}`;
    const geradoEm = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PAVI - Relatorio de Posicao Frota</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 6mm;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            width: 285mm;
            font-family: Arial, Helvetica, sans-serif;
            color: #172033;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            zoom: ${layout.zoom};
          }

          .sheet {
            width: 100%;
            padding: 0;
          }

          .report-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 7px;
            padding-bottom: 6px;
            border-bottom: 2px solid #085eac;
          }

          .brand {
            margin: 0 0 2px;
            color: #085eac;
            font-size: ${layout.metaSize}pt;
            font-weight: 800;
            letter-spacing: 0;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            color: #111827;
            font-size: ${layout.titleSize}pt;
            line-height: 1.1;
          }

          .meta {
            text-align: right;
            color: #475569;
            font-size: ${layout.metaSize}pt;
            line-height: 1.25;
            white-space: nowrap;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            border: 1px solid #7f8fa6;
            font-size: ${layout.fontSize}pt;
            line-height: ${layout.lineHeight};
          }

          th,
          td {
            text-align: left;
            vertical-align: middle;
          }

          thead th {
            padding: ${layout.headerPadding};
            background: #085eac;
            color: #ffffff;
            border: 1px solid #064a86;
            font-size: ${layout.headerFontSize}pt;
            font-weight: 800;
            letter-spacing: 0;
            text-transform: uppercase;
            white-space: nowrap;
          }

          tbody td {
            padding: ${layout.cellPadding};
            border: 1px solid #8fa1b7;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          tbody tr:nth-child(even) td {
            background: #eef4fb;
          }

          tbody tr:nth-child(odd) td {
            background: #ffffff;
          }

          tbody td:first-child {
            border-left: 4px solid var(--manager-color, #cbd5e1);
            font-weight: 800;
          }

          .status-cell {
            overflow: hidden;
            text-overflow: clip;
            white-space: nowrap;
            line-height: inherit;
          }

          .mono {
            font-family: Consolas, "Courier New", monospace;
            font-weight: 700;
          }

          .agenda strong,
          .agenda span {
            display: inline;
          }

          .agenda strong {
            color: #172033;
          }

          .agenda span {
            margin-left: 4px;
            color: #64748b;
            font-size: ${layout.fontSize}pt;
            font-weight: 700;
          }

          .status { width: 12%; }
          .driver { width: 22%; }
          .horse { width: 7.5%; }
          .trailer { width: 7.5%; }
          .origin { width: 16.5%; }
          .destiny { width: 16.5%; }
          .tnf { width: 6%; }
          .schedule { width: 12%; }

          @media print {
            body {
              zoom: ${layout.zoom};
            }

            .sheet,
            table,
            tr,
            td,
            th {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <header class="report-header">
            <div>
              <p class="brand">PAVI</p>
              <h1>Posicao Frota</h1>
            </div>
            <div class="meta">
              <div><strong>${rows.length}</strong> posicoes</div>
              <div>Periodo: ${this.escapeHtml(periodo)}</div>
              <div>Gerado em: ${this.escapeHtml(geradoEm)}</div>
            </div>
          </header>

          <table>
            <thead>
              <tr>
                <th class="status">Status</th>
                <th class="driver">Motorista</th>
                <th class="horse">Cavalo</th>
                <th class="trailer">Carreta</th>
                <th class="origin">Origem</th>
                <th class="destiny">Destino</th>
                <th class="tnf">TNF</th>
                <th class="schedule">Agenda</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(v => {
                const agenda = this.parseAgenda(v.destino_agenda);
                return `
                  <tr>
                    <td class="status-cell" style="--manager-color: ${this.printColor(this.gestorColor(v))}">${this.escapeHtml(this.printStatusDisplay(v.status))}</td>
                    <td>${this.escapeHtml(v.motorista?.nome ?? '-')}</td>
                    <td class="mono">${this.escapeHtml(v.cavalo?.placa ?? '-')}</td>
                    <td class="mono">${this.escapeHtml(v.carreta?.placa ?? '-')}</td>
                    <td>${this.escapeHtml(this.origemDisplay(v))}</td>
                    <td>${this.escapeHtml(this.destinoDisplay(v))}</td>
                    <td class="mono">${this.escapeHtml(v.tnf ?? '')}</td>
                    <td class="agenda">
                      <strong>${this.escapeHtml(agenda?.date || 'Sem agenda')}</strong>
                      ${agenda?.time ? `<span>as ${this.escapeHtml(agenda.time)}</span>` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </main>

        <script>
          window.addEventListener('load', function () {
            setTimeout(function () { window.print(); }, 150);
          });
        </script>
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

  origemDisplay(v: Viagem): string {
    if (v.origemEmpresas?.length) {
      return v.origemEmpresas.map(empresa => this.empresaRouteDisplay(empresa)).join(' + ');
    }
    return v.origem_texto?.trim() || v.origemLabel;
  }

  destinoDisplay(v: Viagem): string {
    if (v.destinoEmpresas?.length) {
      return v.destinoEmpresas.map(empresa => this.empresaRouteDisplay(empresa)).join(' + ');
    }
    return v.destinoEmpresa ? this.empresaRouteDisplay(v.destinoEmpresa) : (v.embarcador_texto?.trim() || v.destinoLabel || '-');
  }

  agendaDisplay(v: Viagem): string {
    const agenda = this.parseAgenda(v.destino_agenda);
    return agenda ? `${agenda.date} ${agenda.time}` : 'Sem agenda';
  }

  agendaDateDisplay(v: Viagem): string {
    return this.parseAgenda(v.destino_agenda)?.date || 'Sem agenda';
  }

  agendaTimeDisplay(v: Viagem): string {
    return this.parseAgenda(v.destino_agenda)?.time || '';
  }

  agendaHasValue(v: Viagem): boolean {
    return !!this.parseAgenda(v.destino_agenda);
  }

  embarcadorDisplay(v: Viagem): string {
    return v.embarcador_texto?.trim() || v.origemEmpresa?.razao_social || '';
  }

  gestorColor(v: Viagem): string {
    return v.gestorColor || '#CBD5E1';
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

  private gestorFilterKey(v: Viagem): string {
    return v.gestor?.codigo != null ? String(v.gestor.codigo) : 'sem-gestor';
  }

  private empresaRouteDisplay(empresa: any): string {
    const cidade = empresa?.cod_cidade ? this.data.cidadeById(empresa.cod_cidade) : null;
    const estado = cidade ? this.data.estadoById(cidade.cod_estado) : null;
    const nomeCurto = this.firstCompanyName(empresa?.razao_social);
    const cidadeLabel = cidade ? `${cidade.nome}/${estado?.sigla ?? '??'}` : '';
    return cidadeLabel ? `${nomeCurto} - ${cidadeLabel}` : nomeCurto;
  }

  private firstCompanyName(value?: string | null): string {
    const trimmed = value?.trim();
    if (!trimmed) return '-';
    if (trimmed.toUpperCase().startsWith('DAIRY PARTNERS AMERICAS')) {
      return 'DPA';
    }
    return trimmed.split(/\s+/)[0];
  }

  private parseAgenda(value?: string | null): { date: string; time: string } | null {
    const raw = value?.trim();
    if (!raw) return null;

    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]?(\d{2}):?(\d{2}))?/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return {
        date: `${day}/${month}/${year}`,
        time: hour && minute ? `${hour}:${minute}` : '',
      };
    }

    const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      return {
        date: new Intl.DateTimeFormat('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(date),
        time: new Intl.DateTimeFormat('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(date),
      };
    }

    return { date: raw, time: '' };
  }

  private printLayout(rowCount: number) {
    if (rowCount <= 22) {
      return {
        zoom: '1',
        titleSize: '14',
        metaSize: '7.6',
        fontSize: '8',
        headerFontSize: '6.8',
        agendaTimeSize: '6.8',
        lineHeight: '1.16',
        headerPadding: '5px 6px',
        cellPadding: '4px 6px',
      };
    }

    if (rowCount <= 38) {
      return {
        zoom: '0.94',
        titleSize: '13',
        metaSize: '7.2',
        fontSize: '7.2',
        headerFontSize: '6.2',
        agendaTimeSize: '6.2',
        lineHeight: '1.12',
        headerPadding: '4px 5px',
        cellPadding: '3px 5px',
      };
    }

    if (rowCount <= 58) {
      return {
        zoom: '0.84',
        titleSize: '12',
        metaSize: '6.8',
        fontSize: '6.4',
        headerFontSize: '5.8',
        agendaTimeSize: '5.8',
        lineHeight: '1.08',
        headerPadding: '3px 4px',
        cellPadding: '2px 4px',
      };
    }

    return {
      zoom: '0.74',
      titleSize: '11',
      metaSize: '6.2',
      fontSize: '5.7',
      headerFontSize: '5.2',
      agendaTimeSize: '5.2',
      lineHeight: '1.04',
      headerPadding: '2px 3px',
      cellPadding: '1px 3px',
    };
  }

  private printDateInputDisplay(value: string): string {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return value || '-';
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  private printColor(value: string): string {
    const color = value?.trim() || '';
    return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : '#CBD5E1';
  }

  private printStatusDisplay(status: string): string {
    const label = status?.trim() || '-';
    const compact: Record<string, string> = {
      'Aguardando Descarga': 'Ag. Descarga',
      'Aguardando Descarga na Diária': 'Ag. Descarga Diaria',
      'Aguardando Carregar': 'Ag. Carregar',
      'Aguardando Carregar na Diária': 'Ag. Carregar Diaria',
      'Aguardando Troca de Nota': 'Ag. Troca NF',
      'Vazio/Aguardando Canhoto': 'Vazio/Ag. Canhoto',
      'Aguardando NF': 'Ag. NF',
    };

    return compact[label] || label;
  }

  private escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private todayInput(): string {
    return this.toDateInputValue(new Date());
  }

  private toDateInputValue(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
