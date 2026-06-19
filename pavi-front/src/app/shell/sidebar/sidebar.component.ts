import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AuthService } from '../../core/services/auth.service';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { path: '/viagens', label: 'Posição Frota', icon: 'route' },
  { path: '/rastreamento', label: 'Rastreamento', icon: 'map' },
  { path: '/fretes', label: 'Fretes', icon: 'money' },
  { path: '/caminhoes', label: 'Caminhões', icon: 'truck' },
  { path: '/motoristas', label: 'Motoristas', icon: 'user' },
  { path: '/motorista-veiculos', label: 'Motorista x Veiculo', icon: 'route' },
  { path: '/embarcadores', label: 'Clientes', icon: 'building' },
  { path: '/frotas', label: 'Frotas', icon: 'truck' },
  { path: '/manutencoes', label: 'Manutenções', icon: 'wrench' },
  { path: '/financeiro', label: 'Financeiro', icon: 'money' },
  { path: '/destinos', label: 'Destinos', icon: 'pin' },
  { path: '/usuarios', label: 'Usuários', icon: 'user' },
  { path: '/configuracoes', label: 'Configurações', icon: 'settings' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="pv-sidebar">
      <div class="pv-brand">
        <img src="logo.png" class="pv-brand-mark" alt="Logo" style="object-fit: cover; background: transparent;" />
        <div class="pv-brand-text">
          <div class="pv-brand-name">PAVI</div>
          <div class="pv-brand-sub">Gestão de Frotas</div>
        </div>
      </div>

      <div class="pv-sidebar-section">MENU PRINCIPAL</div>

      <nav class="pv-sidebar-nav">
        <a *ngFor="let item of navItems()" class="pv-nav-item"
           [routerLink]="item.path" routerLinkActive="is-active">
          <app-icon [name]="item.icon" [size]="16"></app-icon>
          <span>{{ item.label }}</span>
        </a>
      </nav>

      <div class="pv-sidebar-footer">
        <div class="pv-user-chip">
          <div class="pv-user-avatar">{{ initials() }}</div>
          <div class="pv-user-info">
            <div class="pv-user-name">{{ currentUser()?.username || 'Sessão expirada' }}</div>
            <div class="pv-user-role">{{ roleLabel(currentUser()?.role) }}</div>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  readonly currentUser = this.auth.currentUser;

  readonly navItems = computed(() =>
    NAV_ITEMS.filter(
      item => item.path !== '/usuarios' || this.auth.isAdmin()
    )
  );

  readonly initials = computed(() => {
    const username = this.currentUser()?.username?.trim();

    if (!username) return '??';

    return username.slice(0, 2).toUpperCase();
  });

  roleLabel(role?: string | null): string {
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'OPERADOR') return 'Operador';

    return 'Sem perfil';
  }
}
