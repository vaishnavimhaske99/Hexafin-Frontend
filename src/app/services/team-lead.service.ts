import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: string;
  role: string;
  reportsToId: number | null;
  reportsToName: string | null;
}

export interface LeadDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  status: string;
  assignedToId: number | null;
  assignedToName: string | null;
  product?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class TeamLeadService {

  private readonly usersUrl = 'http://localhost:8080/api/users';
  private readonly leadsUrl = 'http://localhost:8080/api/leads';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.usersUrl, { headers: this.getAuthHeaders() });
  }

  getMySalesTeam(teamLeadId: number): Observable<UserDto[]> {
    return new Observable(observer => {
      this.getAllUsers().subscribe({
        next: (users) => {
          const myTeam = users.filter(u => u.reportsToId === teamLeadId && u.role === 'SALES');
          observer.next(myTeam);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  getAllLeads(): Observable<LeadDto[]> {
    return this.http.get<LeadDto[]>(this.leadsUrl, { headers: this.getAuthHeaders() });
  }

  getTeamLeads(teamMemberIds: number[]): Observable<LeadDto[]> {
    return new Observable(observer => {
      this.getAllLeads().subscribe({
        next: (leads) => {
          const filtered = leads.filter(l => {
            if (l.assignedToId === null || l.assignedToId === undefined) return true;
            return teamMemberIds.includes(Number(l.assignedToId));
          });
          observer.next(filtered);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  assignLeadToSales(leadId: number, salesUserId: number): Observable<any> {
    return this.http.put<any>(
      `${this.leadsUrl}/${leadId}/assign/${salesUserId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
  

}