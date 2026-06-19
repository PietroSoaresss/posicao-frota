import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly router = inject(Router);

  readonly username = signal('');
  readonly password = signal('');
  readonly isSubmitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly displayError = computed(() => this.formError() || this.auth.authError());

  /** Live local clock for the operational status line (honest, not a fabricated stat). */
  readonly clock = signal(this.formatClock());
  private readonly clockTimer = setInterval(() => this.clock.set(this.formatClock()), 30_000);

  private formatClock(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockTimer);
  }

  async submit(): Promise<void> {
    const username = this.username().trim();
    const password = this.password();

    this.formError.set(null);

    if (!username || !password) {
      this.formError.set('Informe usuário e senha para acessar o painel.');
      return;
    }

    this.isSubmitting.set(true);

    try {
      const authenticated = await this.auth.login(username, password);
      if (!authenticated) return;

      await this.data.syncAll();
      await this.router.navigate(['/viagens']);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
