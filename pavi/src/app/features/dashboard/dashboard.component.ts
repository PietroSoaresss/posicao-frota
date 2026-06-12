import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { Motorista, Viagem } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageTitleComponent } from '../../shared/components/page-title/page-title.component';
import { MoneyInputComponent } from '../../shared/form-primitives/money-input/money-input.component';
import { DateInputComponent } from '../../shared/form-primitives/date-input/date-input.component';

type MonthlyBucket = {
  key: string;
  label: string;
  shortLabel: string;
  total: number;
  count: number;
  percent: number;
  goalPercent: number;
};

type StatusSlice = {
  status: string;
  count: number;
  total: number;
  percent: number;
  color: string;
};

type RouteSummary = {
  label: string;
  count: number;
  total: number;
  percent: number;
};

type InsightStat = {
  label: string;
  value: string;
  hint: string;
};

type CnhAlert = {
  motorista: Motorista;
  validade: string;
  dias: number;
  status: 'expired' | 'urgent' | 'soon' | 'ok';
  cityLabel: string;
};

const GOAL_STORAGE_KEY = 'pavi.dashboard.monthlyFreightGoal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, PageTitleComponent, IconComponent, MoneyInputComponent, DateInputComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly data = inject(DataService);
  private readonly document = inject(DOCUMENT);

  readonly dataIni = signal(this.toDateInputValue(this.monthStartOffset(-5)));
  readonly dataFim = signal(this.toDateInputValue(new Date()));
  readonly monthlyGoal = signal(this.readMonthlyGoal());
  readonly isFocusMode = signal(false);

  readonly fretes = computed(() => this.data.FRETES());
  readonly viagens = computed(() => this.data.VIAGENS());
  readonly motoristas = computed(() => this.data.MOTORISTAS());

  readonly filteredFretes = computed(() => {
    const start = this.dataIni();
    const end = this.dataFim();
    return this.fretes().filter((frete) => {
      if (!frete.date) return false;
      return (!start || frete.date >= start) && (!end || frete.date <= end);
    });
  });

  readonly currentMonthFretes = computed(() => {
    const monthKey = this.monthKey(new Date());
    return this.fretes().filter((frete) => frete.date?.slice(0, 7) === monthKey);
  });

  readonly currentMonthTotal = computed(() =>
    this.currentMonthFretes().reduce((sum, frete) => sum + this.moneyValue(frete.deliveryValue), 0),
  );

  readonly goalProgress = computed(() => {
    const goal = this.monthlyGoal();
    if (!goal) return 0;
    return Math.round((this.currentMonthTotal() / goal) * 100);
  });

  readonly goalProgressWidth = computed(() => Math.min(this.goalProgress(), 100));

  readonly previousMonthFretes = computed(() => {
    const monthKey = this.monthKey(this.monthStartOffset(-1));
    return this.fretes().filter((frete) => frete.date?.slice(0, 7) === monthKey);
  });

  readonly previousMonthTotal = computed(() =>
    this.previousMonthFretes().reduce((sum, frete) => sum + this.moneyValue(frete.deliveryValue), 0),
  );

  readonly periodTotal = computed(() =>
    this.filteredFretes().reduce((sum, frete) => sum + this.moneyValue(frete.deliveryValue), 0),
  );

  readonly averageTicket = computed(() => {
    const rows = this.filteredFretes();
    if (rows.length === 0) return 0;
    return Math.round(this.periodTotal() / rows.length);
  });

  readonly monthlyDelta = computed(() => {
    const current = this.currentMonthTotal();
    const previous = this.previousMonthTotal();
    if (!previous) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  });

  readonly tripStats = computed(() => {
    const viagens = this.viagens();
    return {
      viajando: viagens.filter((viagem) => viagem.status === 'Viajando').length,
      aguardando: viagens.filter((viagem) => viagem.status.startsWith('Aguardando')).length,
      vazios: viagens.filter((viagem) => viagem.status.startsWith('Vazio')).length,
    };
  });

  readonly monthlyBuckets = computed(() => {
    const buckets = this.createMonthBuckets(this.dataIni(), this.dataFim());
    const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

    for (const frete of this.filteredFretes()) {
      const key = frete.date?.slice(0, 7);
      const bucket = key ? bucketMap.get(key) : null;
      if (!bucket) continue;
      bucket.total += this.moneyValue(frete.deliveryValue);
      bucket.count += 1;
    }

    const maxValue = Math.max(1, this.monthlyGoal(), ...buckets.map((bucket) => bucket.total));
    return buckets.map((bucket) => ({
      ...bucket,
      percent: Math.max(3, Math.round((bucket.total / maxValue) * 100)),
      goalPercent: this.monthlyGoal() ? Math.min(100, Math.round((this.monthlyGoal() / maxValue) * 100)) : 0,
    }));
  });

  readonly statusSlices = computed(() => {
    const grouped = new Map<string, { count: number; total: number }>();
    for (const frete of this.filteredFretes()) {
      const status = this.deliveryStatusLabel(frete.deliveryStatus);
      const current = grouped.get(status) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += this.moneyValue(frete.deliveryValue);
      grouped.set(status, current);
    }

    const totalCount = Math.max(1, this.filteredFretes().length);
    return [...grouped.entries()]
      .map(([status, value]) => ({
        status,
        count: value.count,
        total: value.total,
        percent: Math.round((value.count / totalCount) * 100),
        color: this.statusColor(status),
      }))
      .sort((a, b) => b.count - a.count);
  });

  readonly topRoutes = computed(() => {
    const viagensById = new Map(this.viagens().map((viagem) => [viagem.codigo, viagem]));
    const grouped = new Map<string, { count: number; total: number }>();

    for (const frete of this.filteredFretes()) {
      const viagem = frete.trip?.id ? viagensById.get(Number(frete.trip.id)) : null;
      const label = viagem ? this.routeLabel(viagem) : 'Sem viagem vinculada';
      const current = grouped.get(label) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += this.moneyValue(frete.deliveryValue);
      grouped.set(label, current);
    }

    const ordered = [...grouped.entries()]
      .map(([label, value]) => ({ label, count: value.count, total: value.total, percent: 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const maxValue = Math.max(1, ...ordered.map((route) => route.total));
    return ordered.map((route) => ({
      ...route,
      percent: Math.round((route.total / maxValue) * 100),
    }));
  });

  readonly leadingStatus = computed(() => this.statusSlices()[0] ?? null);

  readonly cnhAlerts = computed(() => {
    const today = this.startOfDay(new Date());
    return this.motoristas()
      .filter((motorista) => !!motorista.validade_cnh)
      .map((motorista) => {
        const validade = this.parseDate(motorista.validade_cnh);
        const dias = validade ? Math.ceil((validade.getTime() - today.getTime()) / 86400000) : 99999;
        return {
          motorista,
          validade: motorista.validade_cnh,
          dias,
          status: this.cnhStatus(dias),
          cityLabel: motorista.cod_cidade ? this.data.cidadeLabel(motorista.cod_cidade) : '-',
        };
      })
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 6);
  });

  readonly periodLabel = computed(() => {
    const start = this.dataIni() ? this.data.fmtData(this.dataIni()) : 'inicio';
    const end = this.dataFim() ? this.data.fmtData(this.dataFim()) : 'hoje';
    return `${start} ate ${end}`;
  });

  readonly hasFreteData = computed(() => this.filteredFretes().length > 0);

  readonly activeMonthCount = computed(() => this.monthlyBuckets().filter((bucket) => bucket.count > 0).length);

  readonly averageMonthlyTotal = computed(() => {
    const months = this.activeMonthCount();
    if (!months) return 0;
    return Math.round(this.periodTotal() / months);
  });

  readonly bestMonth = computed(() => {
    const bucket = this.monthlyBuckets().reduce<MonthlyBucket | null>(
      (best, current) => (!best || current.total > best.total ? current : best),
      null,
    );
    return bucket && bucket.total > 0 ? bucket : null;
  });

  readonly heroTrendBuckets = computed(() => this.monthlyBuckets().slice(-6));

  readonly periodSummaryLabel = computed(() =>
    `${this.filteredFretes().length} frete(s) no intervalo, ${this.brl(this.periodTotal())} faturados`,
  );

  readonly goalMetaLabel = computed(() =>
    this.monthlyGoal() > 0 ? `Meta mensal ${this.brl(this.monthlyGoal())}` : 'Defina uma meta mensal para acompanhar o mes',
  );

  readonly goalProgressLabel = computed(() =>
    this.monthlyGoal() > 0 ? `${this.goalProgress()}%` : 'Sem meta',
  );

  readonly goalStatusLabel = computed(() => {
    if (!this.monthlyGoal()) {
      return 'Defina uma meta mensal para acompanhar o ritmo deste mes.';
    }
    if (this.currentMonthFretes().length === 0) {
      return 'Nenhum frete foi lancado neste mes ate agora.';
    }
    if (this.goalProgress() >= 100) {
      return 'Meta mensal atingida dentro do periodo atual.';
    }
    return `${this.goalProgress()}% da meta mensal ja foi alcancada.`;
  });

  readonly goalComparisonLabel = computed(() =>
    this.monthlyGoal() > 0
      ? `${this.brl(this.currentMonthTotal())} de ${this.brl(this.monthlyGoal())}`
      : 'Sem meta mensal definida',
  );

  readonly monthDeltaLabel = computed(() => {
    const previous = this.previousMonthTotal();
    if (!previous) {
      return this.currentMonthTotal() > 0 ? 'Nova base' : '0%';
    }
    const delta = this.monthlyDelta();
    return `${delta > 0 ? '+' : ''}${delta}%`;
  });

  readonly overviewStats = computed<InsightStat[]>(() => [
    {
      label: 'Fretes no período',
      value: String(this.filteredFretes().length),
      hint: `${this.brl(this.periodTotal())} faturados`,
    },
    {
      label: 'Ticket médio',
      value: this.brl(this.averageTicket()),
      hint: `${this.filteredFretes().length} frete(s) considerados`,
    },
    {
      label: 'Vs. mês anterior',
      value: this.monthDeltaLabel(),
      hint: `${this.brl(this.previousMonthTotal())} no mês anterior`,
    },
    {
      label: 'Status líder',
      value: this.leadingStatus()?.status ?? 'Sem dados',
      hint: this.leadingStatus()
        ? `${this.leadingStatus()?.count} frete(s) · ${this.brl(this.leadingStatus()?.total ?? 0)}`
        : 'Sem status no intervalo',
    },
  ]);

  readonly statusChartStyle = computed(() => {
    const slices = this.statusSlices();
    if (!slices.length) {
      return 'conic-gradient(#d7e1ec 0deg 360deg)';
    }

    let cursor = 0;
    const segments: string[] = [];
    for (const slice of slices) {
      const sweep = (slice.percent / 100) * 360;
      const end = cursor + sweep;
      segments.push(`${slice.color} ${cursor}deg ${end}deg`);
      cursor = end;
    }

    if (cursor < 360) {
      segments.push(`#d7e1ec ${cursor}deg 360deg`);
    }

    return `conic-gradient(${segments.join(', ')})`;
  });

  async ngOnInit(): Promise<void> {
    await this.data.getFretes();
  }

  ngOnDestroy(): void {
    this.setFocusMode(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isFocusMode()) {
      this.setFocusMode(false);
    }
  }

  resetPeriod(): void {
    this.dataIni.set(this.toDateInputValue(this.monthStartOffset(-5)));
    this.dataFim.set(this.toDateInputValue(new Date()));
  }

  setMonthlyGoal(value: number | null): void {
    const normalized = value ?? 0;
    this.monthlyGoal.set(normalized);
    localStorage.setItem(GOAL_STORAGE_KEY, String(normalized));
  }

  async refresh(): Promise<void> {
    await this.data.syncAll();
  }

  toggleFocusMode(): void {
    this.setFocusMode(!this.isFocusMode());
  }

  brl(value: number | null | undefined): string {
    return this.data.brl(value ?? 0);
  }

  fmtData(value: string | null | undefined): string {
    return this.data.fmtData(value ?? null);
  }

  cnhLabel(alert: CnhAlert): string {
    if (alert.dias < 0) return `Vencida ha ${Math.abs(alert.dias)} dia(s)`;
    if (alert.dias === 0) return 'Vence hoje';
    return `Vence em ${alert.dias} dia(s)`;
  }

  presentStatusLabel(status: string): string {
    if (!status.includes('_')) return status;
    return status
      .toLowerCase()
      .split('_')
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  }

  trackMonth(_: number, bucket: MonthlyBucket): string {
    return bucket.key;
  }

  trackStatus(_: number, slice: StatusSlice): string {
    return slice.status;
  }

  trackRoute(_: number, route: RouteSummary): string {
    return route.label;
  }

  trackCnh(_: number, alert: CnhAlert): number {
    return alert.motorista.codigo;
  }

  deliveryStatusLabel(status: string | null | undefined): string {
    return this.data.deliveryStatusFromApi(status);
  }

  private setFocusMode(enabled: boolean): void {
    this.isFocusMode.set(enabled);
    this.document.body.classList.toggle('pv-dashboard-focus', enabled);
  }

  private readMonthlyGoal(): number {
    const stored = localStorage.getItem(GOAL_STORAGE_KEY);
    const parsed = stored == null ? 0 : Number(stored);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private createMonthBuckets(startValue: string, endValue: string): MonthlyBucket[] {
    const start = this.parseDate(startValue) ?? this.monthStartOffset(-5);
    const end = this.parseDate(endValue) ?? new Date();
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    const buckets: MonthlyBucket[] = [];

    while (cursor <= last && buckets.length < 36) {
      buckets.push({
        key: this.monthKey(cursor),
        label: cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
        shortLabel: cursor.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        total: 0,
        count: 0,
        percent: 0,
        goalPercent: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return buckets;
  }

  private moneyValue(value: number | null | undefined): number {
    return Number(value ?? 0);
  }

  private routeLabel(viagem: Viagem): string {
    return `${viagem.origemLabel} -> ${viagem.destinoLabel}`;
  }

  private statusColor(status: string): string {
    const colors: Record<string, string> = {
      'Autorizado p/pgto': '#2e7d32',
      'Falta Lançamento': '#085eac',
      'Em tratativa': '#7c3aed',
      'Prev Pagamento': '#64748b',
      'Pagamento Parcial': '#ca8a04',
      Complemento: '#0284c7',
    };
    return colors[status] ?? '#5b6b80';
  }

  private cnhStatus(days: number): CnhAlert['status'] {
    if (days < 0) return 'expired';
    if (days <= 30) return 'urgent';
    if (days <= 90) return 'soon';
    return 'ok';
  }

  private monthStartOffset(offset: number): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + offset, 1);
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toDateInputValue(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
