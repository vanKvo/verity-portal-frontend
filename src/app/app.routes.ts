import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'leaver-audit',
    loadComponent: () => import('./features/leaver-audit/leaver-audit-dashboard.component').then(m => m.LeaverAuditDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'itar',
    loadComponent: () => import('./features/itar-audit/itar-dashboard.component').then(m => m.ItarDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'data-hub',
    loadComponent: () => import('./features/data-hub/data-hub.component').then(m => m.DataHubComponent),
    canActivate: [authGuard]
  },
  {
    path: 'asset-audit',
    loadComponent: () => import('./features/asset-audit-dashboard/asset-audit-dashboard.component').then(m => m.AssetAuditDashboardComponent),
    canActivate: [authGuard]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
