import { Routes } from '@angular/router';
import { adminGuard, authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'viagens',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/viagens/viagens.component').then((m) => m.ViagensComponent),
  },
  {
    path: 'rastreamento',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/rastreamento/rastreamento.component').then((m) => m.RastreamentoComponent),
  },
  {
    path: 'fretes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/fretes/fretes.component').then((m) => m.FretesComponent),
  },
  {
    path: 'caminhoes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/caminhoes/caminhoes.component').then((m) => m.CaminhoesComponent),
  },
  {
    path: 'motoristas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/motoristas/motoristas.component').then((m) => m.MotoristasComponent),
  },
  {
    path: 'embarcadores',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/embarcadores/embarcadores.component').then((m) => m.EmbarcadoresComponent),
  },
  {
    path: 'usuarios',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/usuarios/usuarios.component').then((m) => m.UsuariosComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
