import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiService, AuthenticatedUserResponse } from './api.service';
import { UserRole } from '../models/models';

export type AuthenticatedUser = {
  username: string;
  role: UserRole;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);

  private readonly _isAuthenticated = signal(false);
  private readonly _authError = signal<string | null>(null);
  private readonly _currentUser = signal<AuthenticatedUser | null>(null);

  readonly isAuthenticated: Signal<boolean> = this._isAuthenticated.asReadonly();
  readonly authError: Signal<string | null> = this._authError.asReadonly();
  readonly currentUser: Signal<AuthenticatedUser | null> = this._currentUser.asReadonly();
  readonly isAdmin: Signal<boolean> = computed(() => this._currentUser()?.role === 'ADMIN');

  async login(username: string, password: string): Promise<boolean> {
    try {
      this._authError.set(null);
      const user = await this.api.login(username, password);
      this.setUser(user);
      return true;
    } catch (e: any) {
      this.clearUser();
      this._authError.set(this.loginErrorMessage(e));
      return false;
    }
  }

  logout(): void {
    void this.api.logout();
    this.clearUser();
  }

  /**
   * Called from APP_INITIALIZER on app boot. The session lives in an HttpOnly
   * cookie that JS cannot read — the only way to know who is logged in is to
   * ask the backend. Resolves before routing decides whether to show /login.
   */
  async restoreSession(): Promise<void> {
    const user = await this.api.me();
    if (user) {
      this.setUser(user);
    } else {
      this.clearUser();
    }
  }

  private setUser(user: AuthenticatedUserResponse): void {
    this._isAuthenticated.set(true);
    this._currentUser.set({ username: user.username, role: user.role });
    this._authError.set(null);
  }

  private clearUser(): void {
    this._isAuthenticated.set(false);
    this._currentUser.set(null);
  }

  private loginErrorMessage(error: any): string {
    const message = String(error?.message || '');
    if (message.includes('401') || message.includes('403')) {
      return 'Usuário ou senha inválidos.';
    }

    return 'Não foi possível autenticar. Verifique a API e tente novamente.';
  }
}
