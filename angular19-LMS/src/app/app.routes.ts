import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { LoginComponent } from './features/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'investor', loadComponent: () => import('./features/investor/investor.component').then(m => m.InvestorComponent) },
      { path: 'collections', loadComponent: () => import('./features/collections/collections-page.component').then(m => m.CollectionsPageComponent) },
      { path: 'customers', loadComponent: () => import('./features/customers/customers-page.component').then(m => m.CustomersPageComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports-page.component').then(m => m.ReportsPageComponent) }
    ]
  },
  { path: 'agent-dashboard', loadComponent: () => import('./features/agent-dashboard/agent-dashboard.component').then(m => m.AgentDashboardComponent), canActivate: [authGuard] },
  { path: '**', redirectTo: 'dashboard' }
];
