
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  password: string;
}

export interface SignupResponse {
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  id?: number;
  userId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient) {}

  // SIGNUP
  signup(request: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(
      `${this.apiUrl}/signup`,
      request
    );
  }

  // LOGIN
  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      request
    ).pipe(
      tap(response => {

        console.log('LOGIN RESPONSE:', response);

        if (!response || !response.token) {
          throw new Error(
            'Login response does not contain a token.'
          );
        }

        // Support both backend field names
        const userId = response.userId ?? response.id;

        // Save token
        localStorage.setItem(
          'crm_token',
          response.token
        );

        // Save user ID
        if (userId != null && Number.isFinite(Number(userId))) {
          localStorage.setItem(
            'crm_user_id',
            String(userId)
          );
        } else {
          localStorage.removeItem('crm_user_id');

          console.error(
            'User ID missing in login response. ' +
            'Backend must return userId or id.'
          );
        }

        // Save role
        if (response.role) {
          localStorage.setItem(
            'crm_role',
            response.role.toUpperCase()
          );
        }

        // Save first name
        if (response.firstName) {
          localStorage.setItem(
            'crm_first_name',
            response.firstName
          );
        }

        // Save last name
        if (response.lastName) {
          localStorage.setItem(
            'crm_last_name',
            response.lastName
          );
        }

        // Save email
        if (response.email) {
          localStorage.setItem(
            'crm_email',
            response.email
          );
        }

        // Save status
        if (response.status) {
          localStorage.setItem(
            'crm_status',
            response.status
          );
        }

        console.log(
          'Saved CRM User ID:',
          localStorage.getItem('crm_user_id')
        );
      })
    );
  }

  // GET TOKEN
  getToken(): string | null {
    return localStorage.getItem('crm_token');
  }

  // GET USER ID
  getUserId(): number | null {
    const id = localStorage.getItem('crm_user_id');

    if (id === null || id.trim() === '') {
      return null;
    }

    const userId = Number(id);

    return Number.isSafeInteger(userId) && userId > 0
      ? userId
      : null;
  }

  // GET ROLE
  getRole(): string | null {
    return localStorage.getItem('crm_role');
  }

  // GET USER NAME
  getUserName(): string {
    const firstName =
      localStorage.getItem('crm_first_name') ?? '';

    const lastName =
      localStorage.getItem('crm_last_name') ?? '';

    return `${firstName} ${lastName}`.trim();
  }

  // GET EMAIL
  getEmail(): string | null {
    return localStorage.getItem('crm_email');
  }

  // GET STATUS
  getStatus(): string | null {
    return localStorage.getItem('crm_status');
  }

  // CHECK LOGIN
  isLoggedIn(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      const expiration = payload.exp;

      return typeof expiration === 'number'
        && expiration * 1000 > Date.now();

    } catch (error) {
      console.error('Invalid login token:', error);
      return false;
    }
  }

  // CHECK USER ID
  hasUserId(): boolean {
    return this.getUserId() !== null;
  }

  // LOGOUT
  logout(): void {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_role');
    localStorage.removeItem('crm_user_id');
    localStorage.removeItem('crm_first_name');
    localStorage.removeItem('crm_last_name');
    localStorage.removeItem('crm_email');
    localStorage.removeItem('crm_status');
  }
}
