import { Component } from '@angular/core';
import { UI_IMPORTS } from '../../shared/ui-imports.ts/ui-imports.ts';
import { Login } from '../auth/login/login';
import { Register } from '../auth/register/register';
interface Feature {
  icon: string;
  title: string;
  description: string;
  highlights: string[];
}
@Component({
  selector: 'app-landing',
  imports: [...UI_IMPORTS, Login, Register],
  standalone: true,
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class Landing {
  features: Feature[] = [
    {
      icon: 'person_add',
      title: 'Employee Registration',
      description: 'Secure registration with admin approval workflow',
      highlights: ['Multi-step verification', 'Role-based access', 'Automated workflows']
    },
    {
      icon: 'apartment',
      title: 'Department Management',
      description: 'Complete CRUD operations for organizational structure',
      highlights: ['Hierarchical structure', 'Team assignments', 'Resource allocation']
    },
    {
      icon: 'analytics',
      title: 'Analytics Dashboard',
      description: 'Real-time insights and department-wise statistics',
      highlights: ['Live reporting', 'Performance metrics', 'Data visualization']
    }
  ];

  constructor() {
    sessionStorage.clear();
  }
}