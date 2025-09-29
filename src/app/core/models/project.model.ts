export interface Project {
  projectId: number;
  projectName: string;
  deadline: Date | string;
  description: string;
  departmentId: number;
  projectStatusId?: number;
  departmentName?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  budget?: number;
  managerId?: number;
}

export interface ProjectCreateRequest {
  projectName: string;
  deadline: Date | string;
  description: string;
  departmentId: number;
}

export interface ProjectUpdateRequest {
  projectId: number;
  projectName: string;
  deadline: Date | string;
  description: string;
  departmentId: number;
  projectStatusId: number;
}