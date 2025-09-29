import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Employee } from './employee.service';
export interface DeptCount {
  departmentId: number;
  departmentName: string;
  employeeCount: number;
}
@Injectable({
  providedIn: 'root'
})
export class Admin {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/UserProfile`;
  private deptBase = `${environment.apiUrl}/Department`;


pendingEmployees() {
  return this.http.get<any>(`${this.base}/get_pending_requests`).pipe(
    map(response => response.users) // Extracting the users array
  );
}
  approveEmployee(userProfileId: number) {
    return this.http.post(`${this.base}/approve_reject_requests`, {
      userProfileId,
      isApproved: true,
    });
  }

  rejectEmployee(userProfileId: number, reason: string | null = null) {
    return this.http.post(`${this.base}/approve_reject_requests`, {
      userProfileId,
      isApproved: false,
      rejectionReason: reason,
      generatedPassword: null
    });
  }
  
  getEmployeeSummary() {
    return this.http.get<{ totalEmployees: number }>(`${this.deptBase}/employeecounttotal`);
  }

  getDepartmentCounts() {
    return this.http.get<DeptCount[]>(`${this.deptBase}/departmentwiseemployeecount`);
  }
  getDepartCounts() {
    return this.http.get<DeptCount[]>(`${this.deptBase}/GetActiveDepartments`);
  }
}