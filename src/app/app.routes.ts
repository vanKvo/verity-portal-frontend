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
    path: 'audit',
    loadComponent: () => import('./features/audit/audit-dashboard.component').then(m => m.AuditDashboardComponent),
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
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
