import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role: string;
  status: string;
  reportsToId?: number | null;
  reportsToName?: string | null;
}

interface LeadDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  status: string;
  assignedToId: number | null;
  assignedToName: string | null;
  createdAt?: string;
}

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.css']
})
export class ManagerDashboardComponent implements OnInit {

  isLoading = true;
  errorMessage = '';
  currentUserName = '';
  currentUserId: number | null = null;

  // Team members (Team Leads + Sales)
  teamLeads: UserDto[] = [];
  salesUsers: UserDto[] = [];

  // Leads
  allLeads: LeadDto[] = [];

  stats = {
    totalTeamLeads: 0,
    totalSalesUsers: 0,
    totalLeads: 0,
    wonLeads: 0,
    newLeads: 0,
    activeLeads: 0,
    conversionRate: 0
  };

  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserName = this.authService.getUserName() || 'Manager';
    const userId = this.authService.getUserId();
    this.currentUserId = userId ? Number(userId) : null;

    if (!this.currentUserId) {
      this.errorMessage = 'Session expired. Please login again.';
      this.isLoading = false;
      return;
    }

    this.loadDashboard();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ Load Team Members (Team Leads + Sales under Manager)
  loadDashboard(): void {
    if (!this.currentUserId) return;

    this.isLoading = true;
    this.errorMessage = '';

    // सगळे users fetch कर
    this.http.get<UserDto[]>(`${this.apiUrl}/users`, { headers: this.getHeaders() }).subscribe({
      next: (users) => {
        // ✅ Manager च्या खाली Team Leads
        this.teamLeads = users.filter(u => 
          u.reportsToId === this.currentUserId && u.role === 'TEAM_LEAD'
        );

        // ✅ Team Lead च्या खाली Sales Users
        const teamLeadIds = this.teamLeads.map(tl => tl.id);
        this.salesUsers = users.filter(u => 
          teamLeadIds.includes(u.reportsToId || -1) && u.role === 'SALES'
        );

        this.stats.totalTeamLeads = this.teamLeads.length;
        this.stats.totalSalesUsers = this.salesUsers.length;

        // ✅ Leads fetch कर
        this.loadLeads();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load team data.';
        console.error(err);
      }
    });
  }

  // ✅ Load सगळे leads (Manager च्या टीमचे)
  loadLeads(): void {
    this.http.get<LeadDto[]>(`${this.apiUrl}/leads`, { headers: this.getHeaders() }).subscribe({
      next: (leads) => {
        // Team Lead + Sales Users च्या IDs
        const teamMemberIds = [
          ...this.teamLeads.map(tl => tl.id),
          ...this.salesUsers.map(su => su.id)
        ];

        // फक्त team चे leads
        this.allLeads = (leads || []).filter(lead =>
          lead.assignedToId && teamMemberIds.includes(Number(lead.assignedToId))
        );

        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load leads.';
        console.error(err);
      }
    });
  }

  private calculateStats(): void {
    this.stats.totalLeads = this.allLeads.length;
    this.stats.wonLeads = this.allLeads.filter(
      l => (l.status || '').toUpperCase() === 'WON'
    ).length;
    this.stats.newLeads = this.allLeads.filter(
      l => (l.status || '').toUpperCase() === 'NEW'
    ).length;
    this.stats.activeLeads = this.allLeads.filter(l => {
      const s = (l.status || '').toUpperCase();
      return ['CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'PROPOSAL'].includes(s);
    }).length;
    this.stats.conversionRate = this.stats.totalLeads > 0
      ? Math.round((this.stats.wonLeads / this.stats.totalLeads) * 100)
      : 0;
  }

  // ✅ Navigation
  openLeads(): void {
    this.router.navigate(['/leads']);
  }

  openTeamLeads(): void {
    this.router.navigate(['/my-organization']);
  }

  openCustomers(): void {
    this.router.navigate(['/customers']);
  }

  openTeamLeadProfile(teamLeadId: number): void {
    this.router.navigate(['/users', teamLeadId, 'profile']);
  }

  openSalesUserProfile(salesUserId: number): void {
    this.router.navigate(['/users', salesUserId, 'profile']);
  }

  openLeadProfile(leadId: number): void {
    this.router.navigate(['/leads', leadId]);
  }

  refresh(): void {
    this.loadDashboard();
  }

  // ✅ Helpers
  getFullName(user: UserDto): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unnamed';
  }

  getInitials(user: UserDto): string {
    const f = (user.firstName || '').charAt(0);
    const l = (user.lastName || '').charAt(0);
    return (f + l).toUpperCase() || '?';
  }

  getLeadName(lead: LeadDto): string {
    return `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed';
  }

  getLeadInitials(lead: LeadDto): string {
    const f = (lead.firstName || '').charAt(0);
    const l = (lead.lastName || '').charAt(0);
    return (f + l).toUpperCase() || 'L';
  }

  getStatusClass(status: string): string {
    return (status || '').toLowerCase().replace(/_/g, '-');
  }

  get recentLeads(): LeadDto[] {
    return [...this.allLeads]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 5);
  }
}