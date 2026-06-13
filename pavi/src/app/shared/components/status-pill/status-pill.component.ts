import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { StatusMeta, StatusType } from '../../../core/models/models';

@Component({
  selector: 'app-status-pill',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="pv-status" [class.pv-status-sm]="size === 'sm'"
      [style.color]="meta.fg" [style.background]="meta.bg" [style.border-color]="meta.border">
      <span class="pv-status-dot" [style.background]="meta.solid"></span>
      {{ meta.label }}
    </span>
  `,
})
export class StatusPillComponent {
  @Input() status: StatusType = 'Vazio';
  @Input() size: 'sm' | 'md' = 'md';

  readonly STATUS_META: Record<StatusType, StatusMeta> = {
    'Aguardando Descarga': { solid: '#ef6c00', fg: '#b45309', bg: '#fff7ed', border: '#fed7aa', label: 'Aguardando Descarga' },
    'Aguardando Descarga na Diária': { solid: '#c2410c', fg: '#9a3412', bg: '#ffedd5', border: '#fdba74', label: 'Aguardando Descarga na Diária' },
    'Aguardando Carregar': { solid: '#085eac', fg: '#085eac', bg: '#e8f0fe', border: '#c2d7f5', label: 'Aguardando Carregar' },
    'Aguardando Carregar na Diária': { solid: '#1d4ed8', fg: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', label: 'Aguardando Carregar na Diária' },
    'Aguardando Troca de Nota': { solid: '#7c3aed', fg: '#6d28d9', bg: '#f3e8ff', border: '#ddd6fe', label: 'Aguardando Troca de Nota' },
    'Carregando': { solid: '#0284c7', fg: '#0369a1', bg: '#e0f2fe', border: '#bae6fd', label: 'Carregando' },
    'Descarregando': { solid: '#ea580c', fg: '#c2410c', bg: '#ffedd5', border: '#fed7aa', label: 'Descarregando' },
    'Desloc Carregar': { solid: '#0f766e', fg: '#0f766e', bg: '#ccfbf1', border: '#99f6e4', label: 'Desloc Carregar' },
    'Carregado/Folga': { solid: '#16a34a', fg: '#15803d', bg: '#dcfce7', border: '#bbf7d0', label: 'Carregado/Folga' },
    'Vazio': { solid: '#64748b', fg: '#475569', bg: '#f1f5f9', border: '#cbd5e1', label: 'Vazio' },
    'Viajando': { solid: '#2563eb', fg: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', label: 'Viajando' },
    'Vazio/Aguardando Canhoto': { solid: '#9333ea', fg: '#7e22ce', bg: '#f3e8ff', border: '#e9d5ff', label: 'Vazio/Aguardando Canhoto' },
    'Aguardando NF': { solid: '#ca8a04', fg: '#a16207', bg: '#fef9c3', border: '#fde68a', label: 'Aguardando NF' },
    'Repaletizando': { solid: '#be123c', fg: '#be123c', bg: '#ffe4e6', border: '#fecdd3', label: 'Repaletizando' },
    'Folga': { solid: '#2e7d32', fg: '#2e7d32', bg: '#e8f5e9', border: '#bcdfbf', label: 'Folga' },
  };

  get meta() {
    return this.STATUS_META[this.status] ?? this.STATUS_META.Vazio;
  }
}
