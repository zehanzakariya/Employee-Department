import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { Chart, ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { environment } from '../../../../../environment/environment';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import {
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  PieController,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Admin } from '../../../../core/services/admin.service';
import { projectService } from '../../../../core/services/project.service';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, PieController, ArcElement, Title, Tooltip, Legend);

interface DeptCount {
  departmentId: number;
  departmentName: string;
  employeeCount: number;
  budget?: number;
}

interface LeaveApplication {
  id: number;
  name: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  date: string;
  type: string;
}

interface EmployeeAward {
  id: number;
  name: string;
  department: string;
  award: string;
  date: string;
}

interface Notice {
  id: number;
  title: string;
  description: string;
  time: string;
  type: 'meeting' | 'maintenance';
}
interface PendingEmployee {
  userProfileId: number;
  fullName: string;
  email: string;
  departmentName: string;
  requestedAt: string;
  status: 'Pending';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [...UI_IMPORTS, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private http = inject(HttpClient);
  private adminService = inject(Admin);
  private projectService = inject(projectService);

  totalEmployees = signal(0);
  departmentCounts = signal<DeptCount[]>([]);
  activeDepartments = signal(0); 
  pendingEmployees = signal<PendingEmployee[]>([]);
  totalProjects = signal(0); 
  projectsDueThisWeek = signal(0); 
  hello=signal(0);
  
  leaveApplications: LeaveApplication[] = [
    { id: 1, name: 'Thomas Goodman', status: 'Approved', date: '2024-01-15', type: 'Annual' },
  ];
  
  employeeAwards: EmployeeAward[] = [
    { id: 1, name: 'Alice Cooper', department: 'Engineering', award: 'Employee of the Month', date: '2024-01-10' },
  ];
  
  notices: Notice[] = [
    { id: 1, title: 'Monthly All-Hands Meeting', description: 'Get ready for meeting at 6 pm in the main conference room', time: 'Posted 2 hours ago', type: 'meeting' },
  ];

  employeeChartData = signal<ChartConfiguration['data']>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Employees per Department',
        backgroundColor: 'hsl(224, 76%, 48%)',
        borderRadius: 4
      }
    ]
  });

  employeeChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: (value) => Number(value).toLocaleString()
        },
        grid: {
          color: '#e5e7eb',
          ...( { borderDash: [3, 3] } as any)
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1
      }
    }
  };

  departmentChartData = signal<ChartConfiguration['data']>({
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Employee Distribution',
        backgroundColor: ['hsl(224, 76%, 48%)', 'hsl(224, 86%, 58%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)']
      }
    ]
  });

  departmentChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 20,
          color: '#1f2937'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = typeof context.raw === 'number' ? context.raw : 0;
            const total = context.dataset.data.reduce((sum: number, current: any) => sum + current, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} employees)`;
          }
        },
        enabled:false,
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1
      }
    }
  };

  ngOnInit() {
    this.loadEmployeeSummary();
    this.loadDepartmentCounts();
    this.loadActiveDepartments();
    this.loadPendingEmployees();
    this.loadProjectsData(); 
  }

  private loadEmployeeSummary() {
    this.http.get<number>(`${environment.apiUrl}/Employees/count/total`)
      .subscribe(count => this.totalEmployees.set(count));
  }

  private loadDepartmentCounts() {
    this.http.get<any[]>(`${environment.apiUrl}/Department/GetActiveDepartments`)
      .subscribe(activeDepartments => {
        this.http.get<DeptCount[]>(`${environment.apiUrl}/Department/departmentwiseemployeecount`)
          .subscribe(allDepartments => {
            const activeDepartmentNames = activeDepartments.map(dept => dept.departmentName);
            const activeDepartmentsWithCounts = allDepartments.filter(dept => 
              activeDepartmentNames.includes(dept.departmentName)
            );

            this.departmentCounts.set(activeDepartmentsWithCounts);
            
            // Updating employee chart with active departments only
            this.employeeChartData.set({
              labels: activeDepartmentsWithCounts.map(d => d.departmentName),
              datasets: [
                {
                  data: activeDepartmentsWithCounts.map(d => d.employeeCount),
                  label: 'Employees per Department',
                  backgroundColor: 'hsl(224, 76%, 48%)',
                  borderRadius: 4,
                  maxBarThickness: 50,
                  minBarLength: 5      
                }
              ]
            });

            // Updating department chart with employee counts
            this.departmentChartData.set({
              labels: activeDepartmentsWithCounts.map(d => d.departmentName),
              datasets: [
                {
                  data: activeDepartmentsWithCounts.map(d => d.employeeCount),
                  label: 'Employee Distribution',
                  backgroundColor: ['hsl(202, 76%, 48%)', 'hsl(224, 86%, 58%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)']
                }
              ]
            });
          });
      });
  }

  private loadActiveDepartments() {
    this.adminService.getDepartCounts().subscribe({
      next: (activeDepartments: any[]) => {
        this.activeDepartments.set(activeDepartments.length);
      },
      error: (error) => {
        console.error('Error loading active departments:', error);
        this.activeDepartments.set(0);
      }
    });
  }

  private loadPendingEmployees() {
    this.adminService.pendingEmployees().subscribe({
      next: (employees: any[]) => {
        const pendingEmployees = employees.map(emp => ({
          userProfileId: emp.userProfileId,
          fullName: emp.fullName,
          email: emp.email,
          departmentName: emp.departmentName || '',
          requestedAt: emp.requestedAt || new Date().toISOString(),
          status: 'Pending' as const
        }));
        this.pendingEmployees.set(pendingEmployees);
      },
      error: (error) => {
        console.error('Error loading pending employees:', error);
      }
    });
  }

  private loadProjectsData() {
    this.projectService.getAll().subscribe({
      next: (projects: any[]) => {
        this.totalProjects.set(projects.length);
        
        // Calculating projects due this week
        const today = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);
        
        const dueThisWeek = projects.filter(project => {
          if (!project.deadline) return false;
          const deadline = new Date(project.deadline);
          return deadline >= today && deadline <= oneWeekFromNow;
        });
        
        this.projectsDueThisWeek.set(dueThisWeek.length);
      },
      error: (error) => {
        console.error('Error loading projects:', error);
        this.totalProjects.set(0);
        this.projectsDueThisWeek.set(0);
      }
    });
  }

  approveEmployee(employee: PendingEmployee) {
    this.adminService.approveEmployee(employee.userProfileId).subscribe({
      next: () => {
        this.pendingEmployees.set(
          this.pendingEmployees().filter(emp => emp.userProfileId !== employee.userProfileId)
        );
        this.totalEmployees.set(this.totalEmployees() + 1);
      },
      error: (error) => {
        console.error('Error approving employee:', error);
      }
    });
  }

  rejectEmployee(employee: PendingEmployee, reason: string) {
    this.adminService.rejectEmployee(employee.userProfileId, reason).subscribe({
      next: () => {
        this.pendingEmployees.set(
          this.pendingEmployees().filter(emp => emp.userProfileId !== employee.userProfileId)
        );
      },
      error: (error) => {
        console.error('Error rejecting employee:', error);
      }
    });
  }
}