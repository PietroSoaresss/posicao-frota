import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../components/icon/icon.component';

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="pv-date-field">
      <div
        class="pv-input-frame is-mono is-date has-icon"
        [class.is-compact]="compact"
        (click)="openNativePicker($event)"
      >
        <button
          type="button"
          class="pv-input-icon pv-date-trigger"
          aria-label="Selecionar data"
          tabindex="-1"
          (click)="openNativePicker($event)"
        >
          <app-icon name="calendar-days" [size]="14"></app-icon>
        </button>

        <input
          #nativeInput
          class="pv-input-control pv-date-native-control"
          type="date"
          [value]="value()"
          aria-label="Selecionar data"
          (input)="onNativeDateChange($event)"
          (change)="onNativeDateChange($event)"
        />
      </div>
    </div>
  `,
})
export class DateInputComponent {
  readonly value = input<string>('');

  @Input() compact = false;
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('nativeInput') nativeInput?: ElementRef<HTMLInputElement>;

  openNativePicker(event?: MouseEvent) {
    const inputElement = this.nativeInput?.nativeElement;
    if (!inputElement) return;

    const clickedInput = event?.target === inputElement;
    if (!clickedInput) {
      event?.preventDefault();
      event?.stopPropagation();
    }

    inputElement.focus();

    if (typeof inputElement.showPicker === 'function') {
      inputElement.showPicker();
    } else if (!clickedInput) {
      inputElement.click();
    }
  }

  onNativeDateChange(event: Event) {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
