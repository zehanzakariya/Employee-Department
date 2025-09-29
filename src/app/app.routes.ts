import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { firstLoginGuard } from './core/guards/first-login-guard';
import { roleGuard } from './core/guards/role-guard';
import { EmployeeLayout } from './features/employee/employee-layout/employee-layout';
import { Landing } from './features/landing/landing';

export const routes: Routes = [

  {
    path: '',
    component: Landing,
    pathMatch: 'full'
  },

  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register').then(m => m.Register) },
      { path: '', pathMatch: 'full', redirectTo: 'login' }
    ]
  },

  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] },
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/admin/pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'employees', loadComponent: () => import('./features/admin/pages/employees/employees').then(m => m.Employees) },
      { path: 'departments', loadComponent: () => import('./features/admin/pages/departments/departments').then(m => m.Departments) },
      { path: 'analytics', loadComponent: () => import('./features/admin/pages/analytics/analytics').then(m => m.Analytics) },
      { path: 'projects', loadComponent: () => import('./features/admin/pages/projects/projects').then(m => m.Projects) },
      { path: 'employee-crud', loadComponent: () => import('./features/admin/pages/employee-crud/employee-crud').then(m => m.EmployeeCrud) },
      { path: 'task-list', loadComponent: () => import('./features/admin/pages/task/task').then(m => m.TaskListComponent) }

    ]
  },

  {
    path: 'employee',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Employee'] },
    children: [
      {
        path: 'complete-profile',
        loadComponent: () => import('./features/employee/pages/complete-profile/complete-profile').then(m => m.CompleteProfile)
      },
      {
        path: '',
        component: EmployeeLayout,
        canActivate: [firstLoginGuard],
        children: [
          { 
            path: '', 
            pathMatch: 'full', 
            redirectTo: 'dashboard'
          },
          { 
            path: 'dashboard', 
            canActivate: [firstLoginGuard], 
            loadComponent: () => 
              import('./features/employee/pages/dashboard/dashboard').then(m => m.Dashboard)
          },
          { 
            path: 'profile', 
            canActivate: [firstLoginGuard], 
            loadComponent: () => 
              import('./features/employee/pages/profile/profile').then(m => m.Profile)
          },
          { 
            path: 'task-view', 
            canActivate: [firstLoginGuard], 
            loadComponent: () => 
              import('./features/employee/pages/task-view/task-view').then(m => m.TaskView)
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];