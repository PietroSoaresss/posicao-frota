import { Component, Input, Output, EventEmitter, ElementRef, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon/icon.component';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="pv-input-frame" [class.is-open]="isOpen()" [class.is-disabled]="disabled" (click)="toggleOpen()">
      <ng-container *ngIf="!searchable">
        <select class="pv-input-control pv-input-select" [ngModel]="value" [disabled]="disabled"
          (ngModelChange)="onValueChange($event)" (click)="$event.stopPropagation()">
          <option *ngIf="placeholder" value="">{{ placeholder }}</option>
          <option *ngFor="let o of options" [value]="o.value" [disabled]="o.disabled">{{ o.label }}</option>
        </select>
        <button *ngIf="showClear()" type="button" class="pv-select-clear" title="Limpar selecao"
          aria-label="Limpar selecao" (click)="clearSelection($event)">
          <app-icon name="close" [size]="12"></app-icon>
        </button>
        <span class="pv-input-chevron"><app-icon name="chevron-r" [size]="12" [style]="{'transform':'rotate(90deg)'}"></app-icon></span>
      </ng-container>
      
      <ng-container *ngIf="searchable">
        <div class="pv-input-control pv-input-select custom-select-display">
          <span *ngIf="selectedLabel(); else ph" class="pv-selected-text">{{ selectedLabel() }}</span>
          <ng-template #ph><span class="pv-placeholder">{{ placeholder }}</span></ng-template>
        </div>
        <button *ngIf="showClear()" type="button" class="pv-select-clear" title="Limpar selecao"
          aria-label="Limpar selecao" (click)="clearSelection($event)">
          <app-icon name="close" [size]="12"></app-icon>
        </button>
        <span class="pv-input-chevron"><app-icon name="chevron-r" [size]="12" [style]="{'transform': isOpen() ? 'rotate(-90deg)' : 'rotate(90deg)'}"></app-icon></span>
        
        <div class="custom-dropdown" *ngIf="isOpen()" (click)="$event.stopPropagation()">
          <div class="dropdown-search">
            <app-icon name="search" [size]="14"></app-icon>
            <input type="text" placeholder="Buscar..." [(ngModel)]="searchQuery" #searchInput>
          </div>
          <div class="dropdown-options">
            <div class="dropdown-option empty-msg" *ngIf="filteredOptions().length === 0">Nenhum resultado</div>
            <div class="dropdown-option" *ngFor="let o of filteredOptions()" 
                 [class.selected]="o.value === value"
                 [class.is-disabled]="o.disabled"
                 (click)="selectOption(o)">
              {{ o.label }}
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .pv-input-frame { position: relative; }
    .pv-input-frame.is-disabled { background: var(--pv-subtle); cursor: default; }
    .pv-input-frame.is-disabled .pv-input-control { cursor: default; color: var(--pv-fg-muted); }
    .pv-input-frame.is-disabled .pv-input-chevron { opacity: 0.65; }
    .custom-select-display { display: flex; align-items: center; cursor: pointer; user-select: none; }
    .pv-selected-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 90%; display: block; }
    .pv-placeholder { color: #888; }
    .pv-select-clear {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      margin-right: 6px;
      border: 0;
      border-radius: 999px;
      background: #e5edf8;
      color: #4b6482;
      cursor: pointer;
      flex-shrink: 0;
    }
    .pv-select-clear:hover { background: #d5e3f5; color: #17324d; }
    .custom-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 100;
      background: #fff; border: 1px solid #ddd; border-radius: 4px;
      margin-top: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      max-height: 250px; display: flex; flex-direction: column;
    }
    .dropdown-search {
      display: flex; align-items: center; padding: 8px; border-bottom: 1px solid #eee; gap: 8px;
    }
    .dropdown-search input {
      flex: 1; border: none; outline: none; font-size: 13px; background: transparent;
    }
    .dropdown-options {
      overflow-y: auto; flex: 1;
    }
    .dropdown-option {
      padding: 8px 12px; cursor: pointer; font-size: 13px;
    }
    .dropdown-option.empty-msg { color: #888; cursor: default; }
    .dropdown-option.empty-msg:hover { background: transparent; }
    .dropdown-option:hover { background: #f5f5f5; }
    .dropdown-option.selected { background: #e0f0ff; color: #0066cc; font-weight: 500; }
    .dropdown-option.is-disabled {
      color: #888;
      cursor: not-allowed;
      background: #fafafa;
    }
    .dropdown-option.is-disabled:hover { background: #fafafa; }
  `]
})
export class SelectInputComponent {
  @Input() value: string = '';
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = '';
  @Input() searchable: boolean = false;
  @Input() disabled: boolean = false;
  @Input() clearable: boolean = false;

  @Output() valueChange = new EventEmitter<string>();

  isOpen = signal(false);
  searchQuery = '';
  
  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.searchable && this.isOpen() && !this.el.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  toggleOpen() {
    if (!this.searchable || this.disabled) return;
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.searchQuery = '';
      setTimeout(() => {
        const input = this.el.nativeElement.querySelector('.dropdown-search input');
        if (input) input.focus();
      }, 50);
    }
  }

  onValueChange(val: string) {
    this.valueChange.emit(val);
  }

  selectOption(o: SelectOption) {
    if (o.disabled) return;
    this.valueChange.emit(o.value);
    this.isOpen.set(false);
  }

  clearSelection(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.searchQuery = '';
    this.valueChange.emit('');
    this.isOpen.set(false);
  }

  selectedLabel() {
    return this.options.find(o => o.value === this.value)?.label || '';
  }

  showClear() {
    return this.clearable && !!this.value && !this.disabled;
  }

  filteredOptions() {
    if (!this.searchQuery) return this.options;
    const terms = this.normalizeSearch(this.searchQuery).split(' ').filter(Boolean);
    if (terms.length === 0) return this.options;
    return this.options.filter(o => {
      const haystack = this.normalizeSearch(o.label);
      return terms.every(term => haystack.includes(term));
    });
  }

  private normalizeSearch(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
