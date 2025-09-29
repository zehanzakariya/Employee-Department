import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable,switchMap,of } from 'rxjs';
import { environment } from '../../../environment/environment';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../models/project.model';


@Injectable({
  providedIn: 'root'
})
export class projectService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Project`;

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/GetAll`).pipe(
      switchMap(projects => {
        console.log('Projects from API:', projects);
        
        return this.http.get<any[]>(`${environment.apiUrl}/Department/sp/GetAllDepartments`).pipe(
          catchError(error => {
            console.error('Failed to fetch departments:', error);
            console.log('Department API URL attempted:', `${environment.apiUrl}/Department/sp/GetAllDepartments`);
            return of([]);
          }),
          map(departments => {
            console.log('Departments from API:', departments);
            
            //mapping departmentId -> departmentName
            const departmentMap = new Map<number, string>();
            departments.forEach(dept => {
              console.log('Processing department:', dept);
              departmentMap.set(dept.departmentId, dept.departmentName);
            });

            console.log('Department map:', Array.from(departmentMap.entries()));
            
            // Adding departmentName for each project
            const enrichedProjects = projects.map(project => {
              const deptName = departmentMap.get(project.departmentId) || 'Unknown Department';
              console.log(`Project ${project.projectId} (dept ${project.departmentId}) -> ${deptName}`);
              return {
                ...project,
                departmentName: deptName
              };
            });
            
            console.log('Final enriched projects:', enrichedProjects);
            return enrichedProjects;
          })
        );
      })
    );
  }

  getById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/${id}`).pipe(
      switchMap(project => {
        return this.http.get<any>(`${environment.apiUrl}/Department/${project.departmentId}`).pipe(
          catchError(error => {
            console.error('Failed to fetch department:', error);
            return of({ departmentName: 'Unknown Department' });
          }),
          map(department => ({
            ...project,
            departmentName: department.departmentName || 'Unknown Department'
          }))
        );
      })
    );
  }

  create(project: ProjectCreateRequest): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/Create`, project);
  }

  update(id: number, project: ProjectUpdateRequest): Observable<Project> {
    return this.http.put<Project>(`${this.apiUrl}/Update/${id}`, project);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/Delete/${id}`);
  }
}