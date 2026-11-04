
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: string;
  status: string;
  location?: string;
  joinedDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  private readonly apiUrl = 'http://localhost:8080/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get logged-in user's basic information from JWT
  getLoggedInUser(): UserProfile | null {
    const token = this.authService.getToken();

    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(
        atob(token.split('.')[1])
      );

      const id = Number(
        payload.userId ?? payload.id ?? payload.user_id
      );

      if (!Number.isInteger(id) || id <= 0) {
        return null;
      }

      return {
        id,
        firstName: payload.firstName ?? '',
        lastName: payload.lastName ?? '',
        email: payload.email ?? payload.sub ?? '',
        mobile: payload.mobile ?? '',
        role: payload.role ?? '',
        status: payload.status ?? ''
      };
    } catch {
      return null;
    }
  }

  // Get the currently authenticated user's profile
  getMyProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(
      `${this.apiUrl}/me`
    );
  }

  // ADMIN: Get a specific user's profile
  getUserById(id: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(
      `${this.apiUrl}/${id}`
    );
  }
}
