import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ApiService, AuthTokens } from './api.service';
import { UserRole } from '../models/models';

export type AuthenticatedUser = {
  username: string;
  role: UserRole;
};

type StoredSession = {
  token: string;
  expiresAt: number;
  username: string;
  role: UserRole;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storageKey = 'pavi.auth.session';
  private readonly sessionTtlMs = 24 * 60 * 60 * 1000;
  private expirationTimer: ReturnType<typeof setTimeout> | null = null;

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
      const session = await this.api.login(username, password);
      this.persistSession(session, Date.now() + this.sessionTtlMs);
      return true;
    } catch (e: any) {
      this.logout();
      this._authError.set(this.loginErrorMessage(e));
      return false;
    }
  }

  logout(): void {
    this.clearExpirationTimer();
    this.api.clearToken();
    this._isAuthenticated.set(false);
    this._authError.set(null);
    this._currentUser.set(null);
    this.storage?.removeItem(this.storageKey);
  }

  restoreSession(): void {
    const session = this.readStoredSession();

    if (!session || session.expiresAt <= Date.now()) {
      this.logout();
      return;
    }

    this.api.setToken(session.token);
    this._isAuthenticated.set(true);
    this._currentUser.set({ username: session.username, role: session.role });
    this.scheduleExpiration(session.expiresAt);
  }

  private persistSession(session: AuthTokens, expiresAt: number): void {
    this.api.setToken(session.token);
    this._isAuthenticated.set(true);
    this._currentUser.set({ username: session.username, role: session.role });
    this.storage?.setItem(this.storageKey, JSON.stringify({
      token: session.token,
      expiresAt,
      username: session.username,
      role: session.role,
    } satisfies StoredSession));
    this.scheduleExpiration(expiresAt);
  }

  private readStoredSession(): StoredSession | null {
    const raw = this.storage?.getItem(this.storageKey);
    if (!raw) return null;

    try {
      const session = JSON.parse(raw) as Partial<StoredSession>;
      if (typeof session.token !== 'string' || typeof session.expiresAt !== 'number') return null;
      if (typeof session.username !== 'string' || !this.isKnownRole(session.role)) return null;
      return { token: session.token, expiresAt: session.expiresAt, username: session.username, role: session.role };
    } catch {
      return null;
    }
  }

  private scheduleExpiration(expiresAt: number): void {
    this.clearExpirationTimer();

    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      this.logout();
      return;
    }

    this.expirationTimer = setTimeout(() => this.logout(), delay);
  }

  private clearExpirationTimer(): void {
    if (!this.expirationTimer) return;
    clearTimeout(this.expirationTimer);
    this.expirationTimer = null;
  }

  private loginErrorMessage(error: any): string {
    const message = String(error?.message || '');
    if (message.includes('401') || message.includes('403')) {
      return 'Usuário ou senha inválidos.';
    }

    return 'Não foi possível autenticar. Verifique a API e tente novamente.';
  }

  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }

  private isKnownRole(role: unknown): role is UserRole {
    return role === 'ADMIN' || role === 'OPERADOR';
  }
}
