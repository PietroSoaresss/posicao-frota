import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pv-form-field" [class.pv-form-field-span-2]="span === 2" [class.is-error]="error">
      <label class="pv-form-label">
        {{ label }}
        <span *ngIf="required" class="pv-form-required">*</span>
      </label>
      <ng-content></ng-content>
      <div *ngIf="hint || error" class="pv-form-hint">{{ error || hint }}</div>
    </div>
  `
})
export class FormFieldComponent {
  @Input() label: string = '';
  @Input() hint: string = '';
  @Input() span: number = 1;
  @Input() required: boolean = false;
  @Input() error: string = '';
}
