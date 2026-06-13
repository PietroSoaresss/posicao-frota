import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

const ICONS: Record<string, string> = {
  'search': '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  'dashboard': '<rect x="3" y="3" width="7" height="8" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/>',
  'chart': '<path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5"/><rect x="12" y="7" width="3" height="9"/><rect x="17" y="9" width="3" height="7"/>',
  'target': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  'expand': '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/><path d="M3 3l6 6M21 3l-6 6M3 21l6-6M21 21l-6-6"/>',
  'collapse': '<path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/><path d="M3 9l6-6M21 9l-6-6M3 15l6 6M21 15l-6 6"/>',
  'refresh': '<path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18 11a6 6 0 0 0-10.5-4M6 13a6 6 0 0 0 10.5 4"/>',
  'filter': '<path d="M3 5h18M6 12h12M10 19h4"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'close': '<path d="M6 6l12 12M18 6L6 18"/>',
  'chevron-l': '<path d="m15 6-6 6 6 6"/>',
  'chevron-r': '<path d="m9 6 6 6-6 6"/>',
  'chevron-d': '<path d="m6 9 6 6 6-6"/>',
  'chevron-u': '<path d="m6 15 6-6 6 6"/>',
  'arrow-r': '<path d="M5 12h14M13 5l7 7-7 7"/>',
  'truck': '<path d="M3 7h11v10H3zM14 10h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  'route': '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H14a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h5.5"/>',
  'map': '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15"/>',
  'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'building': '<path d="M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M10 7h4M10 11h4M10 15h4"/>',
  'wrench': '<path d="M14.7 6.3a4 4 0 0 1 5 5L9 22l-5-5L14.7 6.3z"/>',
  'money': '<rect x="2" y="6" width="20" height="12" rx="1"/><circle cx="12" cy="12" r="2.5"/>',
  'report': '<path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h6M8 8h4"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09"/>',
  'bell': '<path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  'calendar': '<rect x="3" y="5" width="18" height="16" rx="1"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  'calendar-days': '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01"/>',
  'calendar-range': '<rect x="2" y="5" width="8" height="14" rx="1"/><path d="M2 9h8M5 3v2M8 3v2"/><rect x="14" y="5" width="8" height="14" rx="1"/><path d="M14 9h8M17 3v2M20 3v2"/><path d="M10 12h4"/>',
  'download': '<path d="M12 3v13M6 13l6 6 6-6M4 21h16"/>',
  'pin': '<path d="M12 22s7-7.5 7-12a7 7 0 1 0-14 0c0 4.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  'dot': '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
  'sort': '<path d="M8 4v16M4 8l4-4 4 4M16 20V4M20 16l-4 4-4-4"/>',
  'check': '<path d="M5 12l5 5L20 6"/>',
  'alert': '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17v.5"/>',
  'eye': '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'edit': '<path d="M4 20h4L20 8l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
  'external': '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  'logout': '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M21 4v16"/>',
  'trash': '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
      [style]="svgStyle" [innerHTML]="iconSvg | safeHtml">
    </svg>
  `,
  styles: [`:host { display: inline-flex; }`]
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: number = 16;
  @Input() style: Record<string, string> = {};

  get iconSvg(): string {
    return ICONS[this.name] || '';
  }

  get svgStyle(): string {
    return `width: ${this.size}px; height: ${this.size}px`;
  }
}
