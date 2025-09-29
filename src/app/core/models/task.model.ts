export interface Task {
  taskItemId: number;
  taskName: string;
  projectId: number;
  projectName?: string;
  assignedToEmployeeId: number;
  assignedToEmployeeName?: string;
  assignedByUserId: string;
  assignedByUserName?: string;
  deadline: Date | string;
  taskPriorityId: number;
  priority: string;
  taskPriorityName?: string;
  description: string;
  taskTypeId: number;
  taskTypeName: string;
  taskStatusId: number;
  taskStatusName: string;
  status: string;
  estimatedTime?: number;
  spentTime?: number;
  startDate?: Date | string;
  dueDate?: Date | string;
  createdDate?: Date | string;
}

export interface TaskCreateRequest {
  taskName: string;
  projectId: number;
  assignedToEmployeeId: number;
  deadline: Date | string;
  taskPriorityId: number;
  description: string;
  taskTypeId: number;
  taskStatusId: number;
}

export interface TaskUpdateRequest {
  taskItemId: number;
  assignedToEmployeeId: number;
  taskName: string;
  deadline: Date | string;
  taskPriorityId: number;
  description: string;
  projectId: number;
  taskTypeId: number;
  taskStatusId: number;
}

// Add this new interface for status update
export interface TaskUpdateStatusRequest {
  taskItemId: number;
  taskStatusId: number;
}

export interface AssignTaskRequest {
  taskItemId: number;
  assignedToEmployeeId: number;
  assignedByUserId: string;
}

export interface TaskStatus {
  taskStatusId: number;
  statusName: string;
}

export interface TaskPriority {
  taskPriorityId: number;
  priorityName: string;
}

export interface TaskType {
  taskTypeId: number;
  taskTypeName: string;
}