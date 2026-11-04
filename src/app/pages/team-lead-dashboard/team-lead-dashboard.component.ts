import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role: string;
  status?: string;
  reportsToId: number | null;
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
  product?: string;
  createdAt?: string;
}

type LeadFilter = 'ALL' | 'NEW' | 'ACTIVE' | 'WON' | 'LOST';
type ViewMode = 'DASHBOARD' | 'TEAM' | 'LEADS';

@Component({
  selector: 'app-team-lead-dashboard',
  templateUrl: './team-lead-dashboard.component.html',
  styleUrls: ['./team-lead-dashboard.component.css']
})
export class TeamLeadDashboardComponent implements OnInit {

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  assignLoading = false;

  currentUserName = '';
  currentUserId: number | null = null;

  mySalesTeam: UserDto[] = [];
  teamLeads: LeadDto[] = [];
  selectedFilter: LeadFilter = 'ALL';
  selectedView: ViewMode = 'DASHBOARD';

  stats = {
    totalSales: 0,
    totalLeads: 0,
    newLeads: 0,
    wonLeads: 0,
    activeLeads: 0,
    lostLeads: 0,
    conversionRate: 0
  };

  private readonly usersUrl = 'http://localhost:8080/api/users';
  private readonly leadsUrl = 'http://localhost:8080/api/leads';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const id = localStorage.getItem('userId');
    this.currentUserId = id ? Number(id) : null;
    this.currentUserName = localStorage.getItem('userName') || 'Team Lead';

    if (!this.currentUserId) {
      this.errorMessage = 'Session expired. Please login again.';
      return;
    }

    this.loadDashboard();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ============================================================
  // ✅ LOAD DASHBOARD (Team Lead + Team Leads)
  // ============================================================
  loadDashboard(): void {
    if (!this.currentUserId) return;
    this.isLoading = true;
    this.errorMessage = '';

    // ✅ १. Team Lead च्या खालील Sales Users घ्या
    this.http
      .get<UserDto[]>(`${this.usersUrl}/reports-to/${this.currentUserId}`, {
        headers: this.getHeaders()
      })
      .subscribe({
        next: (users) => {
          this.mySalesTeam = (users || []).filter(u => u.role === 'SALES');
          this.stats.totalSales = this.mySalesTeam.length;

          // ✅ २. आता लीड्स घ्या
          this.loadLeads();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load team members.';
        }
      });
  }

  // ============================================================
  // ✅ NEW: LOAD LEADS (Team Lead + Sales)
  // ============================================================
  loadLeads(): void {
    if (!this.currentUserId) return;

    // ✅ Team Lead स्वतःला ॲसाइन झालेले लीड्स घ्या
    this.http
      .get<LeadDto[]>(`${this.leadsUrl}/assigned-to/${this.currentUserId}`, {
        headers: this.getHeaders()
      })
      .subscribe({
        next: (myLeads) => {
          // ✅ आता प्रत्येक Sales User चे लीड्स घ्या
          const allLeads: LeadDto[] = [...(myLeads || [])];

          if (this.mySalesTeam.length === 0) {
            // जर टीममध्ये कोणी नसेल तर फक्त टीम लीडचे लीड्स
            this.teamLeads = allLeads;
            this.calculateStats();
            this.isLoading = false;
            return;
          }

          let completedRequests = 0;

          // प्रत्येक Sales User चे लीड्स घ्या
          this.mySalesTeam.forEach(member => {
            this.http
              .get<LeadDto[]>(`${this.leadsUrl}/assigned-to/${member.id}`, {
                headers: this.getHeaders()
              })
              .subscribe({
                next: (memberLeads) => {
                  allLeads.push(...(memberLeads || []));
                  completedRequests++;

                  if (completedRequests === this.mySalesTeam.length) {
                    this.teamLeads = allLeads;
                    this.calculateStats();
                    this.isLoading = false;
                  }
                },
                error: () => {
                  completedRequests++;
                  if (completedRequests === this.mySalesTeam.length) {
                    this.teamLeads = allLeads;
                    this.calculateStats();
                    this.isLoading = false;
                  }
                }
              });
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load leads.';
        }
      });
  }

  private calculateStats(): void {
    this.stats.totalLeads = this.teamLeads.length;
    this.stats.newLeads = this.teamLeads.filter(l => (l.status || '').toUpperCase() === 'NEW').length;
    this.stats.wonLeads = this.teamLeads.filter(l => (l.status || '').toUpperCase() === 'WON').length;
    this.stats.lostLeads = this.teamLeads.filter(l => (l.status || '').toUpperCase() === 'LOST').length;
    this.stats.activeLeads = this.teamLeads.filter(l => {
      const s = (l.status || '').toUpperCase();
      return ['CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'PROPOSAL'].includes(s);
    }).length;
    this.stats.conversionRate = this.stats.totalLeads > 0
      ? Math.round((this.stats.wonLeads / this.stats.totalLeads) * 100)
      : 0;
  }

  // ===========================
  // VIEW NAVIGATION
  // ===========================
  openTeamList(): void {
    this.selectedView = 'TEAM';
  }

  openLeadsList(filter: LeadFilter): void {
    this.selectedFilter = filter;
    this.selectedView = 'LEADS';
  }

  backToDashboard(): void {
    this.selectedView = 'DASHBOARD';
  }

  openMyOrganization(): void {
    this.router.navigate(['/my-organization']);
  }

  openUserProfile(userId: number): void {
    this.router.navigate(['/users', userId, 'profile']);
  }

  openLeadProfile(leadId: number): void {
    this.router.navigate(['/leads', leadId]);
  }

  openSalesUserDashboard(userId: number): void {
    this.router.navigate(['/sales-user-dashboard', userId]);
  }

  openSalesUserLeads(userId: number): void {
    this.router.navigate(['/sales-user-leads', userId]);
  }

  selectFilter(filter: LeadFilter): void {
    this.selectedFilter = filter;
  }

  get filteredLeads(): LeadDto[] {
    if (this.selectedFilter === 'ALL') return this.teamLeads;
    if (this.selectedFilter === 'ACTIVE') {
      return this.teamLeads.filter(l =>
        ['CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'PROPOSAL'].includes((l.status || '').toUpperCase())
      );
    }
    return this.teamLeads.filter(l => (l.status || '').toUpperCase() === this.selectedFilter);
  }

  // ===========================
  // ASSIGN LEAD
  // ===========================
  onAssignSelection(leadId: number, event: Event): void {
  const select = event.target as HTMLSelectElement;
  const userId = Number(select.value);
  if (!userId) return;

  this.assignLoading = true;
  this.successMessage = '';
  this.errorMessage = '';

  this.http.put<any>(
    `${this.leadsUrl}/${leadId}/assign/${userId}`,
    {},
    { headers: this.getHeaders() }
  ).subscribe({
    next: () => {
      this.assignLoading = false;
      this.successMessage = '✅ Lead assigned to Sales User successfully!';
      
      // ✅ लीड्स पुन्हा लोड करा (जेणेकरून काउंट आणि लिस्ट अपडेट होईल)
      this.loadLeads();
      
      setTimeout(() => this.successMessage = '', 4000);
    },
    error: (err) => {
      this.assignLoading = false;
      this.errorMessage = err?.error?.message || 'Failed to assign lead.';
      setTimeout(() => this.errorMessage = '', 4000);
    }
  });
}

  // ===========================
  // HELPERS
  // ===========================
  getFullName(lead: LeadDto): string {
    return `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim() || 'Unnamed';
  }

  getInitials(lead: LeadDto): string {
    const f = (lead.firstName ?? '').trim().charAt(0);
    const l = (lead.lastName ?? '').trim().charAt(0);
    return (f + l).toUpperCase() || 'L';
  }

  getStatusClass(status: string): string {
    return (status ?? '').toLowerCase().replace(/_/g, '-');
  }

  getAssignedName(lead: LeadDto): string {
    if (!lead.assignedToId) return 'Unassigned';
    return lead.assignedToName || `User #${lead.assignedToId}`;
  }

  memberInitials(user: UserDto): string {
    const f = (user.firstName ?? '').trim().charAt(0);
    const l = (user.lastName ?? '').trim().charAt(0);
    return (f + l).toUpperCase() || '?';
  }
}