import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // ✅ HttpClient इम्पोर्ट करा
import {
  Lead,
  LeadService,
  LoanProductType
} from '../../services/lead.service';

type LeadFilter = 'ALL' | 'NEW' | 'ACTIVE' | 'WON' | 'LOST';

interface DashboardStat {
  title: string;
  value: number;
  icon: string;
  description: string;
  filter: LeadFilter;
  color: string;
}

interface ProductSummary {
  name: string;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: false,
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {

  loading = true;
  errorMessage = '';

  currentSalesUserName = '';
  salesUserId: number | null = null;

  leads: Lead[] = [];
  selectedFilter: LeadFilter = 'ALL';
  stats: DashboardStat[] = [];
  productSummaries: ProductSummary[] = [];

  private readonly apiUrl = 'http://localhost:8080/api'; // ✅ API URL

  get isAdminViewingSalesUser(): boolean {
    return this.salesUserId !== null;
  }

  readonly activeStatuses: string[] = [
    'CONTACTED',
    'QUALIFIED',
    'FOLLOW_UP',
    'PROPOSAL'
  ];

  readonly productLabels: Record<LoanProductType, string> = {
    HOME_LOAN: 'Home Loan',
    PERSONAL_LOAN: 'Personal Loan',
    BUSINESS_LOAN: 'Business Loan',
    LOAN_AGAINST_PROPERTY: 'Loan Against Property',
    CAR_LOAN: 'Car Loan',
    LOAN_AGAINST_SECURITIES: 'Loan Against Securities'
  };

  constructor(
    private leadService: LeadService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient // ✅ HttpClient इंजेक्ट करा
  ) {
    this.currentSalesUserName = this.authService.getUserName();
  }

  ngOnInit(): void {
    this.currentSalesUserName = this.authService.getUserName();

    const userIdParam = this.route.snapshot.paramMap.get('userId');

    if (userIdParam !== null) {
      const parsedUserId = Number(userIdParam);

      if (!Number.isSafeInteger(parsedUserId) || parsedUserId <= 0) {
        this.loading = false;
        this.errorMessage = 'Invalid Sales User ID.';
        return;
      }

      this.salesUserId = parsedUserId;
    }

    this.loadDashboard();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json'
    });
  }

  // ==========================================
  // ✅ LOAD DASHBOARD (Dynamic API)
  // ==========================================
  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    const loggedInUserId = this.authService.getUserId();
    const currentRole = localStorage.getItem('role') || '';

    if (this.salesUserId === null && loggedInUserId === null) {
      this.loading = false;
      this.errorMessage = 'Login User ID not found. Please log in again.';
      return;
    }

    // ✅ कोणत्या युझरचे लीड्स घ्यायचे ते ठरवा
    // जर Admin/Team Lead ने specific user चा dashboard उघडला असेल, तर त्या user चे
    // नाहीतर लॉगिन केलेल्या user चे
    const targetUserId = this.salesUserId !== null 
      ? this.salesUserId 
      : Number(loggedInUserId);

    // ✅ ही नवीन API वापरा जी कोणत्याही युझरचे लीड्स देते
    this.http.get<Lead[]>(
      `${this.apiUrl}/leads/assigned-to/${targetUserId}`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (response) => {
        this.leads = Array.isArray(response) ? response : [];
        this.calculateStats();
        this.calculateProductSummary();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;

        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to view these leads.';
        } else if (error.status === 404) {
          this.errorMessage = 'User or requested resource was not found.';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to the server. Please check your backend.';
        } else {
          this.errorMessage = 'Unable to load dashboard data. Please try again.';
        }
      }
    });
  }

  private calculateStats(): void {
    const newCount = this.leads.filter(
      lead => this.normalizedStatus(lead.status) === 'NEW'
    ).length;

    const activeCount = this.leads.filter(
      lead => this.activeStatuses.includes(this.normalizedStatus(lead.status))
    ).length;

    const wonCount = this.leads.filter(
      lead => this.normalizedStatus(lead.status) === 'WON'
    ).length;

    const lostCount = this.leads.filter(
      lead => this.normalizedStatus(lead.status) === 'LOST'
    ).length;

    this.stats = [
      { title: 'Total Leads', value: this.leads.length, icon: 'users', description: 'All assigned leads', filter: 'ALL', color: 'blue' },
      { title: 'New Leads', value: newCount, icon: 'user-plus', description: 'Awaiting first contact', filter: 'NEW', color: 'violet' },
      { title: 'Active Leads', value: activeCount, icon: 'trending-up', description: 'Currently in progress', filter: 'ACTIVE', color: 'orange' },
      { title: 'Won Leads', value: wonCount, icon: 'trophy', description: 'Successfully closed', filter: 'WON', color: 'green' },
      { title: 'Lost Leads', value: lostCount, icon: 'circle-x', description: 'Not converted', filter: 'LOST', color: 'red' }
    ];
  }

  private calculateProductSummary(): void {
    const counts = new Map<string, number>();

    this.leads.forEach(lead => {
      const product = lead.product || 'NOT_SPECIFIED';
      counts.set(product, (counts.get(product) ?? 0) + 1);
    });

    this.productSummaries = Array.from(counts.entries())
      .map(([product, count]) => ({
        name: product === 'NOT_SPECIFIED'
          ? 'Not specified'
          : this.productLabels[product as LoanProductType] ?? product,
        count,
        percentage: this.leads.length
          ? Math.round((count / this.leads.length) * 100)
          : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  selectFilter(filter: LeadFilter): void {
    this.selectedFilter = filter;
  }

  onStatClick(filter: LeadFilter): void {
    this.selectFilter(filter);
  }

  get filteredLeads(): Lead[] {
    if (this.selectedFilter === 'ALL') return this.sortedLeads;
    return this.sortedLeads.filter(lead => {
      const status = this.normalizedStatus(lead.status);
      if (this.selectedFilter === 'ACTIVE') return this.activeStatuses.includes(status);
      return status === this.selectedFilter;
    });
  }

  get sortedLeads(): Lead[] {
    return [...this.leads].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }

  get recentLeads(): Lead[] {
    return this.sortedLeads.slice(0, 5);
  }

  get wonCount(): number {
    return this.leads.filter(l => this.normalizedStatus(l.status) === 'WON').length;
  }

  get conversionRate(): number {
    return this.leads.length
      ? Math.round((this.wonCount / this.leads.length) * 100)
      : 0;
  }

  get selectedFilterTitle(): string {
    const titles: Record<LeadFilter, string> = {
      ALL: this.isAdminViewingSalesUser ? 'All Assigned Leads' : 'All My Leads',
      NEW: 'New Leads',
      ACTIVE: 'Active Leads',
      WON: 'Won Leads',
      LOST: 'Lost Leads'
    };
    return titles[this.selectedFilter];
  }

  getFullName(lead: Lead): string {
    return `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim() || 'Unnamed Lead';
  }

  getInitials(lead: Lead): string {
    const first = (lead.firstName ?? '').trim().charAt(0);
    const last = (lead.lastName ?? '').trim().charAt(0);
    return (first + last).toUpperCase() || 'L';
  }

  getStatusClass(status: string): string {
    return this.normalizedStatus(status).toLowerCase().replace(/_/g, '-');
  }

  getStatusLabel(status: string): string {
    return this.normalizedStatus(status).replace(/_/g, ' ') || 'Unknown';
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '—';
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return '—';
    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  isTeamLeadOrAdmin(): boolean {
    const role = (localStorage.getItem('role') || '').toUpperCase();
    return role === 'TEAM_LEAD' || role === 'ADMIN' || role === 'MANAGER';
  }

  viewFullProfile(): void {
    if (this.salesUserId) {
      this.router.navigate(['/users', this.salesUserId, 'profile']);
    }
  }

  openMyLeads(): void {
    if (this.salesUserId !== null) {
      this.router.navigate(['/sales-user-leads', this.salesUserId]);
    } else {
      this.router.navigate(['/my-leads']);
    }
  }

  openLead(leadId: number): void {
    if (this.salesUserId !== null) {
      this.router.navigate(['/leads', leadId], {
        state: {
          backUrl: ['/sales-user-leads', this.salesUserId],
          backLabel: 'Back to Assigned Leads',
          salesUserId: this.salesUserId
        }
      });
    } else {
      this.router.navigate(['/my-leads', leadId], {
        state: {
          backUrl: ['/my-leads'],
          backLabel: 'Back to My Leads'
        }
      });
    }
  }

  backToSalesUsers(): void {
    const role = (localStorage.getItem('role') || '').toUpperCase();
    
    if (role === 'TEAM_LEAD') {
      this.router.navigate(['/team-lead-dashboard']);
    } else if (role === 'MANAGER') {
      this.router.navigate(['/manager-dashboard']);
    } else {
      this.router.navigate(['/sales-users']);
    }
  }

  private normalizedStatus(status: string | null | undefined): string {
    return (status ?? '').trim().toUpperCase();
  }
}