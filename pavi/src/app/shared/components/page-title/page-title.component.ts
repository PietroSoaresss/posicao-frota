import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-page-title',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="pv-page-title">
      <div class="pv-page-title-left">
        <app-icon *ngIf="icon" [name]="icon" [size]="18"></app-icon>
        <h1>{{ title }}</h1>
        <span *ngIf="count != null" class="pv-page-count">{{ count }}</span>
      </div>
      <div class="pv-page-title-right">
        <ng-content></ng-content>
      </div>
    </div>
  `
})
export class PageTitleComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() count: number | null = null;
}
