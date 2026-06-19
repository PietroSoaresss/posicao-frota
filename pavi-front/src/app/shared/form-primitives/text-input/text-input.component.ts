import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon/icon.component';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="pv-input-frame" [class.is-mono]="mono" [class.has-icon]="icon">
      <span *ngIf="icon" class="pv-input-icon"><app-icon [name]="icon" [size]="14"></app-icon></span>
      <span *ngIf="prefix" class="pv-input-affix pv-input-prefix">{{ prefix }}</span>
      <input [type]="type" class="pv-input-control" [value]="value" (input)="onInput($event)"
        [attr.readonly]="readonly ? '' : null" [placeholder]="placeholder" [attr.inputmode]="inputMode || null"
        [attr.maxlength]="maxLength != null ? maxLength : null" />
      <span *ngIf="suffix" class="pv-input-affix pv-input-suffix">{{ suffix }}</span>
    </div>
  `
})
export class TextInputComponent {
  @Input() value: any = '';
  @Input() placeholder: string = '';
  @Input() mono: boolean = false;
  @Input() prefix: string = '';
  @Input() suffix: string = '';
  @Input() type: string = 'text';
  @Input() icon: string = '';
  @Input() readonly: boolean = false;
  @Input() inputMode: string = '';
  @Input() maxLength: number | null = null;

  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.valueChange.emit(val);
  }
}
