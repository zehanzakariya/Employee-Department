import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { EmployeeReadDto } from '../models/employee.model';
interface PagedResponse {
  data: EmployeeReadDto[];
  totalCount: number;
}
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class Employee {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Employees`;
  private userProfileBase = `${environment.apiUrl}/UserProfile`;

  me(): Observable<EmployeeReadDto[]> { 
    return this.http.get<EmployeeReadDto[]>(`${this.base}/getallemployeesactive`); 
  }
  
  update(id: number, formData: FormData): Observable<EmployeeReadDto> {
    return this.http.put<EmployeeReadDto>(`${this.base}/${id}`, formData);
  }
  
  counts() { 
    return this.http.get<{ departments: number; employeesApproved: number }>(`${this.base}/counts`); 
  }
  
  byDeptCounts() { 
    return this.http.get<{ department: string; count: number }[]>(`${this.base}/stats/by-department`); 
  }
 
  getPaged(search: string = '', page: number = 1, pageSize: number = 10, includeInactive: boolean = false) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('includeInactive', includeInactive.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PagedResponse>(`${this.base}/paged`, { params });
  }

  create(payload: any) {
    return this.http.post(`${this.base}`, payload);
  }
  
  delete(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }
  
  activate(id: number) {
    return this.http.patch(`${this.base}/${id}/activate`, {});
  }
  
  getById(id: number): Observable<EmployeeReadDto> {
    return this.http.get<EmployeeReadDto>(`${this.base}/${id}`);
  }
  
  changePassword(payload: ChangePasswordRequest) {
    return this.http.post(`${this.userProfileBase}/change-password`, payload);
  }
}