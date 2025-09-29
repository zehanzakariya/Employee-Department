import { Component, inject } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { UI_IMPORTS } from '../../../shared/ui-imports.ts/ui-imports.ts';

@Component({
  selector: 'app-employee-layout',
  imports: [UI_IMPORTS,RouterOutlet,RouterLink,RouterLinkActive,MatProgressBarModule],
  templateUrl: './employee-layout.html',
  styleUrl: './employee-layout.scss'
})
export class EmployeeLayout {
  private auth = inject(Auth);
  private router = inject(Router);
  
  sidebarCollapsed = false;
  user: any;
  currentTime: Date = new Date();

  ngOnInit() {
    const userData = sessionStorage.getItem('ems_user');
    if (userData) {
      this.user = JSON.parse(userData);
    }
    setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}