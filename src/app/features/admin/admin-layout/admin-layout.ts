import { Component, HostListener, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../../../core/services/auth.service';
import { UI_IMPORTS } from '../../../shared/ui-imports.ts/ui-imports.ts';

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    ...UI_IMPORTS
  ], templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss'
})
export class AdminLayout {
  sidebarCollapsed = false;
  private router = inject(Router);
  private auth = inject(Auth);
  userRole: string | null = null;
  mobileMenuOpen = false;


  sidebarItems: SidebarItem[] = [
    { id: '', label: 'Dashboard', icon: 'dashboard' },
    { id: 'employees', label: 'Employees', icon: 'people' },
    { id: 'departments', label: 'Departments', icon: 'business' },
    { id: 'projects', label: 'Projects', icon: 'work' },
    { id: 'employee-crud', label: 'Employee CRUD', icon: 'person_add' },
    { id: 'task-list', label: 'Task-list', icon: 'task' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' }

  ];

  ngOnInit() {
    const user = sessionStorage.getItem('ems_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        this.userRole = parsed.role || null;
      } catch {
        this.userRole = null;
      }
    }
  }
  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {

    if (event.target.innerWidth > 768) {
      this.mobileMenuOpen = false;
    }
  }


  // Closing mobile menu when clicking outside on mobile
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.mobileMenuOpen && !target.closest('.sidebar') && !target.closest('.mobile-menu-btn')) {
      this.closeMobileMenu();
    }
  }
}