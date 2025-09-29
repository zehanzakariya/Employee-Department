import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environment/environment';
import { LocalUser, LoginRequest, LoginResponse, RegisterEmployeeRequest, Role } from '../models/auth.model';
import { jwtDecode } from 'jwt-decode';
const TOKEN_KEY = 'ems_token';
const USER_KEY = 'ems_user';

interface JwtPayload {
  email: string;
  [claim: string]: any; 
}
@Injectable({
  providedIn: 'root'
})
export class Auth {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}`;
  private userSubject = new BehaviorSubject<LocalUser | null>(this.loadUser());
  user$ = this.userSubject.asObservable();

  get token() { return sessionStorage.getItem(TOKEN_KEY); }
  get user() { return this.userSubject.value; }
  get isLoggedIn() { return !!this.token && !!this.user; }
  get profileComplete() { return !!this.user?.profileComplete; }

  
  registerEmployee(payload: RegisterEmployeeRequest) {
    return this.http.post(`${this.base}/UserProfile/register_employee`, payload);
  }

  login(payload: LoginRequest) {
    return this.http.post<LoginResponse>(`${this.base}/Auth/login`, payload);
  }

  setSession(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
    const decoded = this.decodeUser(token);
    if (decoded) {
      const storedExtra = this.getExtraUserData();
      const merged = { ...decoded, ...storedExtra };
      this.userSubject.next(merged);
      this.saveUser(merged);
    }
  }

  

  updateLocalUser(patch: Partial<LocalUser>) {
    if (!this.user) return;
    const merged = { ...this.user, ...patch };
    this.userSubject.next(merged);
    this.saveUser(merged);
  }


  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
  }
  //token decoding
private decodeUser(token: string | null = this.token): LocalUser | null {
  if (!token) return null;
  try {
    const payload = jwtDecode<JwtPayload>(token);
    return {
      email: payload.email,
      role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] as Role,
      profileComplete: payload['profileComplete'] || false,
    };
  } catch {
    return null;
  }
}

  private saveUser(user: LocalUser) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  }


  private loadUser(): LocalUser | null {
    const token = this.token;
    if (!token) return null;
    const decoded = this.decodeUser(token);
    const extra = this.getExtraUserData();
    return decoded ? { ...decoded, ...extra } : null;
  }

  private getExtraUserData(): Partial<LocalUser> {
    const data = sessionStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : {};
  }
}