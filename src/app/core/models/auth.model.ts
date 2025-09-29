export type Role = 'Admin' | 'Employee';
export type UserStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: Role;
  dashboardUrl: string;
}

export interface LocalUser {
  email: string;
  role: Role;
  status?: UserStatus;       
  profileComplete?: boolean;
  employeeId?: number;
  fullName?: string;
  departmentName?: string;
}

export interface RegisterEmployeeRequest {
  fullName: string;
  email: string;
  age: number;
  departmentId: number;
  gender: 'Male' | 'Female' | 'Other';
}
