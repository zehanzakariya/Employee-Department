import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Department } from '../models/dept.model';

@Injectable({
  providedIn: 'root'
})
export class Dept {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Department`;

  list(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.base}/sp/GetAllDepartments`);
  }

  getById(id: number): Observable<Department> {
    return this.http.get<Department>(`${this.base}/${id}`);
  }

  create(formData: FormData): Observable<Department> {
    return this.http.post<Department>(`${this.base}/CreateDepartment`, formData);
  }
  
  update(id: number, formData: FormData): Observable<Department> {
    return this.http.put<Department>(`${this.base}/UpdateDepartment/${id}`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/DeleteDepartment/${id}`);
  }

  search(name: string): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.base}/search?name=${name}`);
  }
  count(): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.base}/sp/GetAllDepartments`);
  }
}