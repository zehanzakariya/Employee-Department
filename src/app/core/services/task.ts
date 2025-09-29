import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AssignTaskRequest, Task, TaskCreateRequest, TaskUpdateRequest, TaskUpdateStatusRequest } from '../models/task.model';
export interface EmployeeTasksResponse {
  employeeId: number;
  fullName: string;
  email: string;
  username: string;
  tasks: Task[];
}
@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Task`;

  getAll(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/AllTasks`);
  }

  getById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  getByProject(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/ByProject/${projectId}`);
  }

  create(task: TaskCreateRequest): Observable<Task> {
    return this.http.post<Task>(`${this.apiUrl}/Create`, task);
  }

  update(id: number, task: TaskUpdateRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/Update/${id}`, task);
  }
  updateStatus(updateRequest: TaskUpdateStatusRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/UpdateStatus`, updateRequest);
  }

  assign(taskAssignment: AssignTaskRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/Assign`, taskAssignment);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }

  getByEmployee(employeeId: number): Observable<EmployeeTasksResponse> {
    return this.http.get<EmployeeTasksResponse>(`${environment.apiUrl}/Employees/${employeeId}/tasks`);
  }
}