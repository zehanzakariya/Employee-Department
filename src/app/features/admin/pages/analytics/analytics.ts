import { Component, inject, signal } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Employee } from '../../../../core/services/employee.service';
import { UI_IMPORTS } from '../../../../shared/ui-imports.ts/ui-imports.ts';
import {
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Admin, DeptCount } from '../../../../core/services/admin.service';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

@Component({
  selector: 'app-analytics',
  imports: [...UI_IMPORTS, BaseChartDirective],
  templateUrl: './analytics.html',
  styleUrl: './analytics.scss'
})
export class Analytics {
  private admin = inject(Admin);

  totalEmployees=signal(0)
  chartType: ChartType = 'bar';
  chartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Employees per Department' }]
  };

  ngOnInit() {
    this.loadEmployeeSummary();
    this.loadDepartmentCounts();
  }

  private loadEmployeeSummary() {
    this.admin.getEmployeeSummary().subscribe(res => this.totalEmployees.set(res.totalEmployees));
  }

  private loadDepartmentCounts() {
    this.admin.getDepartmentCounts().subscribe((res: DeptCount[]) => {
      this.chartData = {
        labels: res.map(d => d.departmentName),
        datasets: [{ data: res.map(d => d.employeeCount), label: 'Employees per Department' }]
      };
    });
  }
}