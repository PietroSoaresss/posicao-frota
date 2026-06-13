import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../components/icon/icon.component';

type SelectOption = {
  value: string;
  label: string;
};

const MONTH_OPTIONS: SelectOption[] = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Marco' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="pv-date-field" [class.is-open]="isOpen()">
      <div
        class="pv-input-frame is-mono is-date has-icon"
        [class.is-compact]="compact"
      >
        <button
          type="button"
          class="pv-input-icon pv-date-trigger"
          aria-label="Selecionar data"
          [attr.aria-expanded]="isOpen()"
          (click)="togglePicker()"
        >
          <app-icon name="calendar-days" [size]="14"></app-icon>
        </button>

        <button
          type="button"
          class="pv-input-control pv-date-display"
          [class.is-placeholder]="!value()"
          (click)="togglePicker()"
        >
          {{ displayValue() }}
        </button>
      </div>

      <div
        *ngIf="isOpen()"
        class="pv-date-popover"
        [class.is-compact]="compact"
        role="dialog"
        aria-label="Selecionar data"
      >
        <div class="pv-date-standard-head">
          <div class="pv-date-standard-title">
            <strong>Selecionar data</strong>
            <span>Ano, mes e dia</span>
          </div>
        </div>

        <div class="pv-date-selects">
          <label class="pv-date-select" data-kind="year">
            <span>Ano</span>
            <div class="pv-input-frame is-mono">
              <select
                class="pv-input-control pv-input-select"
                [value]="draftYear()"
                (change)="onYearChange($event)"
              >
                <option value="">Ano</option>
                <option *ngFor="let option of yearOptions()" [value]="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </label>

          <label class="pv-date-select" data-kind="month">
            <span>Mes</span>
            <div class="pv-input-frame">
              <select
                class="pv-input-control pv-input-select"
                [value]="draftMonth()"
                (change)="onMonthChange($event)"
              >
                <option value="">Mes</option>
                <option *ngFor="let option of monthOptions" [value]="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </label>

          <label class="pv-date-select" data-kind="day">
            <span>Dia</span>
            <div class="pv-input-frame is-mono">
              <select
                class="pv-input-control pv-input-select"
                [value]="draftDay()"
                (change)="onDayChange($event)"
              >
                <option value="">Dia</option>
                <option *ngFor="let option of dayOptions()" [value]="option.value">
                  {{ option.label }}
                </option>
              </select>
            </div>
          </label>
        </div>

        <div class="pv-date-toolbar">
          <button type="button" class="pv-date-chip" (click)="setToday()">Hoje</button>
          <button type="button" class="pv-date-chip" [disabled]="!value()" (click)="clearDate()">Limpar</button>
          <button type="button" class="pv-date-chip is-primary" [disabled]="!canApply()" (click)="applyDraft()">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DateInputComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly value = input<string>('');
  @Input() compact = false;
  @Output() valueChange = new EventEmitter<string>();

  readonly isOpen = signal(false);
  readonly draftYear = signal('');
  readonly draftMonth = signal('');
  readonly draftDay = signal('');
  readonly monthOptions = MONTH_OPTIONS;

  readonly displayValue = computed(() => this.formatDisplay(this.value()));
  readonly yearOptions = computed(() => this.buildYearOptions());
  readonly canApply = computed(() => !!this.buildDraftIso());
  readonly dayOptions = computed(() => {
    const days = this.daysInDraftMonth();
    return Array.from({ length: days }, (_, index) => {
      const value = String(index + 1).padStart(2, '0');
      return { value, label: value };
    });
  });

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.closePicker();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closePicker();
  }

  togglePicker() {
    if (this.isOpen()) {
      this.closePicker();
      return;
    }

    this.syncDraftFromValue();
    this.isOpen.set(true);
  }

  closePicker() {
    this.isOpen.set(false);
  }

  onYearChange(event: Event) {
    this.draftYear.set(this.readValue(event));
    this.normalizeDraftDay();
  }

  onMonthChange(event: Event) {
    this.draftMonth.set(this.readValue(event));
    this.normalizeDraftDay();
  }

  onDayChange(event: Event) {
    this.draftDay.set(this.readValue(event));
  }

  applyDraft() {
    const iso = this.buildDraftIso();
    if (!iso) return;

    this.valueChange.emit(iso);
    this.closePicker();
  }

  setToday() {
    const today = new Date();
    const iso = this.toIso(today);
    this.syncDraftFromIso(iso);
    this.valueChange.emit(iso);
    this.closePicker();
  }

  clearDate() {
    this.draftYear.set('');
    this.draftMonth.set('');
    this.draftDay.set('');
    this.valueChange.emit('');
    this.isOpen.set(false);
  }

  private syncDraftFromValue() {
    this.syncDraftFromIso(this.value());
  }

  private syncDraftFromIso(iso: string) {
    const parsed = this.parseIso(iso);
    if (!parsed) {
      this.draftYear.set('');
      this.draftMonth.set('');
      this.draftDay.set('');
      return;
    }

    this.draftYear.set(String(parsed.getFullYear()));
    this.draftMonth.set(String(parsed.getMonth() + 1).padStart(2, '0'));
    this.draftDay.set(String(parsed.getDate()).padStart(2, '0'));
  }

  private buildDraftIso(): string {
    const year = this.draftYear();
    const month = this.draftMonth();
    const day = this.draftDay();

    if (!year || !month || !day) return '';

    const iso = `${year}-${month}-${day}`;
    if (!this.parseIso(iso)) return '';

    return iso;
  }

  private normalizeDraftDay() {
    const currentDay = Number(this.draftDay());
    if (!currentDay) return;

    const maxDay = this.daysInDraftMonth();
    if (currentDay <= maxDay) return;

    this.draftDay.set(String(maxDay).padStart(2, '0'));
  }

  private daysInDraftMonth(): number {
    const year = Number(this.draftYear());
    const month = Number(this.draftMonth());
    if (!year || !month) return 31;
    return new Date(year, month, 0).getDate();
  }

  private buildYearOptions(): SelectOption[] {
    const currentYear = new Date().getFullYear();
    const selectedYear = Number(this.draftYear()) || Number(this.value().slice(0, 4));
    const fromYear = Math.min(1980, selectedYear ? selectedYear - 5 : currentYear - 20);
    const toYear = Math.max(currentYear + 15, selectedYear ? selectedYear + 5 : currentYear + 10);
    const options: SelectOption[] = [];

    for (let year = toYear; year >= fromYear; year -= 1) {
      options.push({ value: String(year), label: String(year) });
    }

    return options;
  }

  private formatDisplay(value: string): string {
    if (!value) return 'dd/mm/aaaa';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return 'dd/mm/aaaa';
    return `${day}/${month}/${year}`;
  }

  private parseIso(value: string): Date | null {
    if (!value) return null;

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;

    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    return date;
  }

  private readValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  private toIso(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }
}
