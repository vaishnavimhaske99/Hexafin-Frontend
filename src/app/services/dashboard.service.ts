import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  wonLeads: number;
  assignedLeads: number;
  unassignedLeads: number;
  totalSalesUsers: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly apiUrl = 'http://localhost:8080/api/dashboard/admin';

  constructor(private http: HttpClient) {}

  getAdminDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(this.apiUrl);
  }
}