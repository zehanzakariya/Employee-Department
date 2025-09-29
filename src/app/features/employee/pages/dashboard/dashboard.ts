import { Component, inject } from '@angular/core';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Auth } from '../../../../core/services/auth.service';

interface Project {
  id: number;
  name: string;
  deadline: Date;
  progress: number;
  status: 'on-track' | 'at-risk' | 'delayed';
}

interface Meeting {
  id: number;
  title: string;
  time: Date;
  type: 'scrum' | 'meeting' | 'review';
  participants: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [UI_IMPORTS,MatProgressBarModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {
  private auth = inject(Auth); 
  
  user: any; 

  public taskChartData: ChartData<'doughnut'> = {
    labels: ['Completed', 'InProgress', 'Pending'],
    datasets: [{
      data: [65, 25, 10],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'],
      hoverBackgroundColor: ['#059669', '#2563eb', '#d97706'],
      borderWidth: 0
    }]
  };

  public taskChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      }
    }
  };

  projects: Project[] = [
    {
      id: 1,
      name: 'Website Redesign',
      deadline: new Date('2024-03-15'),
      progress: 75,
      status: 'on-track'
    },
    {
      id: 2,
      name: 'Mobile App Development',
      deadline: new Date('2024-03-10'),
      progress: 45,
      status: 'at-risk'
    },
    {
      id: 3,
      name: 'Database Migration',
      deadline: new Date('2024-03-05'),
      progress: 90,
      status: 'on-track'
    },
    {
      id: 4,
      name: 'API Integration',
      deadline: new Date('2024-03-20'),
      progress: 30,
      status: 'delayed'
    }
  ];

  meetings: Meeting[] = [
    {
      id: 1,
      title: 'Daily Standup',
      time: new Date('2024-02-28T09:30:00'),
      type: 'scrum',
      participants: 8
    },
    {
      id: 2,
      title: 'Project Review',
      time: new Date('2024-02-28T14:00:00'),
      type: 'review',
      participants: 5
    },
    {
      id: 3,
      title: 'Client Meeting',
      time: new Date('2024-02-29T11:00:00'),
      type: 'meeting',
      participants: 3
    },
    {
      id: 4,
      title: 'Sprint Planning',
      time: new Date('2024-03-01T10:00:00'),
      type: 'scrum',
      participants: 6
    }
  ];

  ngOnInit() {
    const userData = sessionStorage.getItem('ems_user');
    if (userData) {
      this.user = JSON.parse(userData);
    }
  }

  getDaysUntilDeadline(deadline: Date): number {
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'on-track': return 'status-on-track';
      case 'at-risk': return 'status-at-risk';
      case 'delayed': return 'status-delayed';
      default: return '';
    }
  }

  getMeetingIcon(type: string): string {
    switch (type) {
      case 'scrum': return 'groups';
      case 'meeting': return 'meeting_room';
      case 'review': return 'rate_review';
      default: return 'event';
    }
  }
}