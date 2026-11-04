import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  role: string;
  status: string;
  reportsToId?: number | null;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  isLoading = true;
  errorMessage = '';

  // Stats
  stats = {
    totalLeads: 0,
    newLeads: 0,
    wonLeads: 0
  };

  // Organization Stats
  userStats = {
    admin: 0,
    manager: 0,
    teamLead: 0,
    sales: 0
  };

  // Loan Products
  loanProducts = [
    { label: 'Home Loan', value: 'HOME_LOAN', icon: '🏠' },
    { label: 'Personal Loan', value: 'PERSONAL_LOAN', icon: '👤' },
    { label: 'Business Loan', value: 'BUSINESS_LOAN', icon: '💼' },
    { label: 'Car Loan', value: 'CAR_LOAN', icon: '🚗' }
  ];
  productLeadCounts: { [key: string]: number } = {};

  // Users Data
  allUsers: UserDto[] = [];
  salesUsers: UserDto[] = [];
  showSalesUsers = false;

  // Role Modal
  showRoleUsersModal = false;
  selectedRoleFilter = '';

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    });
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // 1. Load Users (For Org Stats & Modals)
    this.http.get<UserDto[]>(`${this.apiUrl}/users`, { headers: this.getHeaders() })
      .subscribe({
        next: (users) => {
          this.allUsers = users || [];
          this.calculateUserStats();
          this.salesUsers = this.allUsers.filter(u => u.role === 'SALES');
          this.loadLeads();
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load users data.';
          console.error(err);
        }
      });
  }

  private calculateUserStats(): void {
    this.userStats.admin = this.allUsers.filter(u => u.role === 'ADMIN').length;
    this.userStats.manager = this.allUsers.filter(u => u.role === 'MANAGER').length;
    this.userStats.teamLead = this.allUsers.filter(u => u.role === 'TEAM_LEAD').length;
    this.userStats.sales = this.allUsers.filter(u => u.role === 'SALES').length;
  }

  private loadLeads(): void {
    this.http.get<any[]>(`${this.apiUrl}/leads`, { headers: this.getHeaders() })
      .subscribe({
        next: (leads) => {
          this.isLoading = false;
          this.stats.totalLeads = leads.length;
          this.stats.newLeads = leads.filter(l => (l.status || '').toUpperCase() === 'NEW').length;
          this.stats.wonLeads = leads.filter(l => (l.status || '').toUpperCase() === 'WON').length;

          // Count leads per product
          this.productLeadCounts = {};
          this.loanProducts.forEach(p => this.productLeadCounts[p.value] = 0);
          leads.forEach(l => {
            const p = l.product;
            if (p && this.productLeadCounts[p] !== undefined) {
              this.productLeadCounts[p]++;
            }
          });
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to load leads data.';
          console.error(err);
        }
      });
  }

  // ==========================================
  // Navigation & Actions
  // ==========================================
  openMyOrganization(): void {
    this.router.navigate(['/my-organization']);
  }

  openLeads(filter: string): void {
    this.router.navigate(['/leads'], { queryParams: { status: filter } });
  }

  openRoleUsers(role: string): void {
    this.selectedRoleFilter = role;
    this.showRoleUsersModal = true;
  }

  closeRoleUsersModal(): void {
    this.showRoleUsersModal = false;
    this.selectedRoleFilter = '';
  }

  // ✅ Modal मधून युजरची प्रोफाईल उघडण्यासाठी नवीन मेथड
  openUserProfile(userId: number): void {
    console.log('Navigating to profile of User ID:', userId);
    this.router.navigate(['/users', userId, 'profile']);
  }

  // तुझी जुनी सेल्स युजर प्रोफाईल मेथड
  openSalesUserProfile(userId: number): void {
    this.openUserProfile(userId);
  }

  // Modal मधील युजर्सची फिल्टर केलेली यादी
  get filteredRoleUsers(): UserDto[] {
    if (!this.selectedRoleFilter) return [];
    return this.allUsers.filter(u => u.role === this.selectedRoleFilter);
  }

  openProductLeads(product: string): void {
    this.router.navigate(['/leads'], { queryParams: { product: product } });
  }

  addProductLead(product: string): void {
    this.router.navigate(['/leads/add'], { queryParams: { product: product } });
  }

  toggleSalesUsers(): void {
    this.showSalesUsers = !this.showSalesUsers;
  }

  closeSalesUsers(): void {
    this.showSalesUsers = false;
  }
}