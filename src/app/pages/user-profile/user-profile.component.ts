import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

type ProfileTab = 'overview' | 'leads';

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  role: string;
  status: string;
  reportsToId?: number | null;
  reportsToName?: string | null;
}

interface Lead {
  id: number;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  status?: string;
  assignedToId?: number | null;
  updatedAt?: string;
}

interface ProfileLead {
  id: number;
  name: string;
  company: string;
  status: string;
  statusClass: string;
  updated: string;
  assignedToId?: number | null;
}

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {

  activeTab: ProfileTab = 'overview';
  loading = true;
  leadsLoading = false;
  errorMessage = '';
  leadsErrorMessage = '';

  profile: UserProfile = {
    id: 0, firstName: '', lastName: '', email: '', mobile: '', role: '', status: ''
  };

  stats = [
    { label: 'Assigned Leads', value: 0, icon: 'users', note: 'Assigned to this user' },
    { label: 'Completed Tasks', value: 0, icon: 'check', note: 'Completed' },
    { label: 'Pending Follow-ups', value: 0, icon: 'clock', note: 'Require attention' },
    { label: 'Activities', value: 0, icon: 'activity', note: 'Recorded' }
  ];

  leads: ProfileLead[] = [];
  salesUsers: any[] = [];

  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('userId');
      if (userId) {
        this.loadSelectedUserProfile(Number(userId));
      } else {
        this.loadMyProfile();
      }
    });
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json'
    });
  }

  // ✅ युझरची प्रोफाईल लोड करा
  loadSelectedUserProfile(userId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<UserProfile>(
      `${this.apiUrl}/users/${userId}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
        this.loadAssignedLeads();

        // ✅ जर TEAM_LEAD किंवा MANAGER असेल तर Sales Users घ्या
        if (this.profile.role === 'TEAM_LEAD' || this.profile.role === 'MANAGER') {
          this.loadSalesUsers(profile.id);
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Unable to load profile.';
      }
    });
  }

  // ✅ स्वतःची प्रोफाईल लोड करा
  loadMyProfile(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<UserProfile>(
      `${this.apiUrl}/users/me`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
        this.loadAssignedLeads();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Unable to load profile.';
      }
    });
  }

  // ✅ Sales Users (Team Lead / Manager साठी)
  loadSalesUsers(supervisorId: number): void {
    this.http.get<any[]>(
      `${this.apiUrl}/users/reports-to/${supervisorId}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (users) => {
        this.salesUsers = (users || []).filter(u => u.role === 'SALES');
      }
    });
  }

  // ✅ लीड्स लोड करा (नवीन API वापरून)
  loadAssignedLeads(): void {
    if (!this.profile.id) return;

    this.leadsLoading = true;
    this.leadsErrorMessage = '';

    this.http.get<Lead[]>(
      `${this.apiUrl}/leads/assigned-to/${this.profile.id}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (leads) => {
        this.leads = (leads || []).map(lead => ({
          id: lead.id,
          name: `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim() || 'Unnamed',
          company: lead.companyName ?? '—',
          status: lead.status ?? '',
          statusClass: (lead.status ?? '').toLowerCase().replace(/_/g, '-'),
          updated: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '—',
          assignedToId: lead.assignedToId
        }));

        const stat = this.stats.find(s => s.label === 'Assigned Leads');
        if (stat) stat.value = this.leads.length;

        this.leadsLoading = false;
      },
      error: (err) => {
        this.leadsLoading = false;
        this.leadsErrorMessage = 'Failed to load leads.';
      }
    });
  }

  // ✅ लीड ॲसाइन करा
  onAssignLead(leadId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const assignedToId = Number(select.value);

    if (!assignedToId) return;

    this.http.put<any>(
      `${this.apiUrl}/leads/${leadId}/assign/${assignedToId}`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        alert('✅ Lead assigned successfully!');
        this.loadAssignedLeads();
      },
      error: (err) => {
        alert('Failed to assign lead.');
      }
    });
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
  }

  openLead(leadId: number): void {
    this.router.navigate(['/leads', leadId]);
  }

  // ✅ Role नुसार Back Navigation
  goBack(): void {
    const role = (localStorage.getItem('role') || '').toUpperCase();

    if (role === 'ADMIN') {
      this.router.navigate(['/dashboard']);
    } else if (role === 'MANAGER') {
      this.router.navigate(['/manager-dashboard']);
    } else if (role === 'TEAM_LEAD') {
      this.router.navigate(['/team-lead-dashboard']);
    } else if (role === 'SALES') {
      this.router.navigate(['/user-dashboard']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  get fullName(): string {
    return `${this.profile.firstName} ${this.profile.lastName}`.trim() || 'User';
  }

  get initials(): string {
    const f = (this.profile.firstName ?? '').trim().charAt(0);
    const l = (this.profile.lastName ?? '').trim().charAt(0);
    return (f + l).toUpperCase() || '?';
  }
}