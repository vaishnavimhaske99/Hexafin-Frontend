import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type UserRole = 'ADMIN' | 'MANAGER' | 'TEAM_LEAD' | 'SALES';

export interface UserResponseDTO {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  mobile: string | null;
  status: string;
  role: UserRole;
  reportsToId: number | null;
  reportsToName: string | null;
}

export interface UpdateHierarchyRequest {
  role: UserRole;
  reportsToId: number | null;
}

// ✅ NEW: Lead DTO (for team member profile page)
export interface LeadResponseDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  status: string;
  source: string;
  assignedToId: number | null;
  assignedToName: string | null;
  product: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  pincode: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly apiUrl = 'http://localhost:8080/api/users';
  private readonly leadsUrl = 'http://localhost:8080/api/leads';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<UserResponseDTO[]> {
    return this.http.get<UserResponseDTO[]>(this.apiUrl);
      
  }

  getUserById(id: number): Observable<UserResponseDTO> {
    return this.http.get<UserResponseDTO>(`${this.apiUrl}/${id}`);
  }

  updateHierarchy(id: number, payload: UpdateHierarchyRequest): Observable<UserResponseDTO> {
    return this.http.put<UserResponseDTO>(`${this.apiUrl}/${id}/hierarchy`, payload);
  }

  // ═══════════════════════════════════════════════════════
  // ✅ NEW METHOD — Get team members of a team lead
  // GET /api/users/reports-to/{teamLeadId}
  // ═══════════════════════════════════════════════════════
  getTeamMembers(teamLeadId: number): Observable<UserResponseDTO[]> {
    return this.http.get<UserResponseDTO[]>(
      `${this.apiUrl}/reports-to/${teamLeadId}`
    );
  }

  // ═══════════════════════════════════════════════════════
  // ✅ NEW METHOD — Get all leads assigned to a sales user
  // GET /api/leads/sales-user/{salesUserId}
  // ═══════════════════════════════════════════════════════
  getLeadsBySalesUser(salesUserId: number): Observable<LeadResponseDTO[]> {
    return this.http.get<LeadResponseDTO[]>(
      `${this.leadsUrl}/sales-user/${salesUserId}`
    );
  }

  // ═══════════════════════════════════════════════════════
  // ✅ NEW METHOD — Get all leads
  // GET /api/leads
  // ═══════════════════════════════════════════════════════
  getAllLeads(): Observable<LeadResponseDTO[]> {
    return this.http.get<LeadResponseDTO[]>(this.leadsUrl);
  }

  // ═══════════════════════════════════════════════════════
  // ✅ NEW METHOD — Assign a lead to a sales user
  // PUT /api/leads/{leadId}/assign/{userId}
  // ═══════════════════════════════════════════════════════
  assignLead(leadId: number, userId: number): Observable<any> {
    return this.http.put<any>(
      `${this.leadsUrl}/${leadId}/assign/${userId}`,
      {}
    );
  }
}