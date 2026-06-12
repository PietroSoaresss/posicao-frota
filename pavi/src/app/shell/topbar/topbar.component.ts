import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

const ROUTE_LABELS: Record<string, { section: string; page: string }> = {
  dashboard: { section: 'Painel', page: 'Dashboard' },
  viagens: { section: 'Operação', page: 'Posição Frota' },
  rastreamento: { section: 'Operação', page: 'Rastreamento' },
  fretes: { section: 'Operação', page: 'Fretes' },
  caminhoes: { section: 'Frota', page: 'Caminhões' },
  motoristas: { section: 'Frota', page: 'Motoristas' },
  embarcadores: { section: 'Cadastros', page: 'Clientes' },
  usuarios: { section: 'Administração', page: 'Usuários' },
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="pv-topbar">
      <div class="pv-topbar-left">
        <nav class="pv-breadcrumb">
          <span class="pv-crumb-muted">{{ sectionLabel() }}</span>
          <app-icon name="chevron-r" [size]="12"></app-icon>
          <span class="pv-crumb">{{ pageLabel() }}</span>
        </nav>
      </div>
      <div class="pv-topbar-right">
        <div class="pv-global-search">
          <app-icon name="search" [size]="14"></app-icon>
          <input placeholder="Buscar em todo o sistema..." />
          <kbd class="pv-kbd">Ctrl K</kbd>
        </div>
        <button class="pv-icon-btn pv-has-badge" title="Notificações">
          <app-icon name="bell" [size]="16"></app-icon>
          <span class="pv-badge-dot">3</span>
        </button>
        <button class="pv-btn-ghost" title="Abrir ajustes">
          <app-icon name="settings" [size]="14"></app-icon>
          <span>Ajustes</span>
        </button>
        <button class="pv-btn-ghost" title="Sair do sistema" (click)="logout()">
          <app-icon name="logout" [size]="14"></app-icon>
          <span>Sair</span>
        </button>
      </div>
    </header>
  `
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly currentUrl = signal(this.router.url);

  readonly routeMeta = computed(() => {
    const segment = this.currentUrl().split('?')[0].split('/').filter(Boolean)[0] ?? 'dashboard';
    return ROUTE_LABELS[segment] ?? { section: 'Sistema', page: 'Dashboard' };
  });

  readonly sectionLabel = computed(() => this.routeMeta().section);
  readonly pageLabel = computed(() => this.routeMeta().page);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.currentUrl.set(event.urlAfterRedirects));
  }

  async logout(): Promise<void> {
    this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
