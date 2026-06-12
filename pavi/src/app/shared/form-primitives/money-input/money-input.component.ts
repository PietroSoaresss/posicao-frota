import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextInputComponent } from '../text-input/text-input.component';

@Component({
  selector: 'app-money-input',
  standalone: true,
  imports: [CommonModule, FormsModule, TextInputComponent],
  template: `
    <app-text-input [value]="displayValue" prefix="R$" [mono]="true" inputmode="numeric"
      placeholder="0,00" (valueChange)="onValueChange($event)"></app-text-input>
  `
})
export class MoneyInputComponent {
  @Input() value: number | null = null;
  @Output() valueChange = new EventEmitter<number | null>();

  get displayValue(): string {
    if (this.value == null || this.value === 0) return '';
    return (this.value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onValueChange(s: string) {
    const digits = s.replace(/\D/g, '');
    this.valueChange.emit(digits === '' ? null : Number(digits));
  }
}
