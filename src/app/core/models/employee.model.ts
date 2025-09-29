export interface Employee {
    id: string;
    fullName: string;
    email: string;
    departmentId: number;
    gender: string;
    status: 'Pending'|'Approved'|'Rejected';
    profileComplete: boolean;
    phone?: string;
    address?: string;
    pictureUrl?: string;
  }
  export interface EmployeeReadDto {
    employeeId: number;
    fullName: string;
    email: string;
    username: string;
    departmentName: string;
    phoneNo:string;
    departmentId:number;
    isProfileCompleted: boolean;
    isActive: boolean;
    degreeCertificatePath: string | null;
    plusTwoCertificatePath: string | null;
    sslCertificatePath: string | null;
    experienceCertificatePath: string | null;
    passportPath: string | null;
    aadharPath: string | null;
  }
  interface PendingEmployee {
    userProfileId: number; 
    fullName: string;
    email: string;
    gender: string;
    age: number;
    departmentId: number;
    userStatusId: number;
    userStatus: string | null;
    rejectionReason: string | null;
    departmentName?: string; 
  }