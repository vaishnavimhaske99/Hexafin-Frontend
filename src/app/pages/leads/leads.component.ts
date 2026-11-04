import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { Lead, LeadService, LoanProductType } from '../../services/lead.service';

// ✅ नवीन इंटरफेस सगळ्या युजर्ससाठी
interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.css']
})
export class LeadsComponent implements OnInit {

  leads: Lead[] = [];
  
  // ✅ आता यात सगळे युजर्स साठवले जातील
  allUsers: UserDto[] = [];

  // ✅ HTML मध्ये वापरण्यासाठी युझरचा रोल
  userRole: string = localStorage.getItem('role') || '';

  assignSuccessMessage = '';
  assignErrorMessage = '';

  // Bulk Selection
  selectedLeadIds: Set<number> = new Set();
  bulkAssignUserId: number | null = null;
  isBulkAssigning = false;

  showFilters = false;
  searchText = '';
  selectedStatus = 'ALL';
  isLoading = false;
  errorMessage = '';

  dashboardFilter: 'ALL' | 'NEW' | 'WON' | 'ASSIGNED' | 'UNASSIGNED' = 'ALL';
  selectedProduct: LoanProductType | 'ALL' = 'ALL';

  readonly loanProducts = [
    { label: 'Home Loan', value: 'HOME_LOAN' },
    { label: 'Personal Loan', value: 'PERSONAL_LOAN' },
    { label: 'Business Loan', value: 'BUSINESS_LOAN' },
    { label: 'Loan Against Property', value: 'LOAN_AGAINST_PROPERTY' },
    { label: 'Car Loan', value: 'CAR_LOAN' },
    { label: 'Loan Against Securities', value: 'LOAN_AGAINST_SECURITIES' }
  ];

  readonly statuses = ['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'PROPOSAL', 'WON', 'LOST'];

  showAddLeadForm = false;
  showBulkUpload = false;

  private apiUrl = 'http://localhost:8080/api';

  constructor(
    private leadService: LeadService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const filter = params.get('filter')?.toUpperCase();
      const allowedFilters = ['ALL', 'NEW', 'WON', 'ASSIGNED', 'UNASSIGNED'];
      this.dashboardFilter = allowedFilters.includes(filter || '') ? filter as any : 'ALL';

      const product = params.get('product');
      const validProduct = this.loanProducts.find(item => item.value === product);
      this.selectedProduct = validProduct ? validProduct.value as LoanProductType : 'ALL';
    });

    this.loadLeads();
    this.loadAllUsers(); // ✅ नवीन मेथड कॉल केली
  }

  private getHeaders() {
    return new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    });
  }

  // ✅ सगळे युजर्स आणण्यासाठी
  loadAllUsers(): void {
    this.http.get<UserDto[]>(`${this.apiUrl}/users`, { headers: this.getHeaders() }).subscribe({
      next: (users) => {
        this.allUsers = users || [];
      },
      error: (err) => {
        console.error('Users API Error:', err);
        this.assignErrorMessage = 'Failed to load users for assignment.';
      }
    });
  }

  // ==========================================
  // ✅ Bulk Selection Methods
  // ==========================================
  toggleSelection(leadId: number): void {
    if (this.selectedLeadIds.has(leadId)) {
      this.selectedLeadIds.delete(leadId);
    } else {
      this.selectedLeadIds.add(leadId);
    }
  }

  toggleAll(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.filteredLeads.forEach(lead => this.selectedLeadIds.add(lead.id));
    } else {
      this.selectedLeadIds.clear();
    }
  }

  isAllSelected(): boolean {
    return this.filteredLeads.length > 0 && 
           this.filteredLeads.every(lead => this.selectedLeadIds.has(lead.id));
  }

  clearSelection(): void {
    this.selectedLeadIds.clear();
    this.bulkAssignUserId = null;
  }

  // ==========================================
  // ✅ Bulk Assign Logic
  // ==========================================
  bulkAssign(): void {
    if (!this.bulkAssignUserId || this.selectedLeadIds.size === 0) return;

    this.isBulkAssigning = true;
    this.assignSuccessMessage = '';
    this.assignErrorMessage = '';

    const userId = this.bulkAssignUserId;
    const leadIds = Array.from(this.selectedLeadIds);

    const requests = leadIds.map(id => this.leadService.assignLead(id, userId));

    forkJoin(requests).subscribe({
      next: () => {
        this.isBulkAssigning = false;
        this.assignSuccessMessage = `${leadIds.length} leads assigned successfully!`;
        this.clearSelection();
        this.loadLeads();
        setTimeout(() => this.assignSuccessMessage = '', 4000);
      },
      error: (error) => {
        this.isBulkAssigning = false;
        this.assignErrorMessage = 'Failed to assign some leads. Please check backend.';
        setTimeout(() => this.assignErrorMessage = '', 4000);
      }
    });
  }

  // ==========================================
  // Load Leads & Filters
  // ==========================================
  loadLeads(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.leadService.getAllLeads().subscribe({
      next: (response: Lead[]) => {
        this.leads = Array.isArray(response) ? response : [];
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.leads = [];
        this.errorMessage = 'Failed to fetch leads. HTTP Status: ' + error.status;
      }
    });
  }

  get filteredLeads(): Lead[] {
    const search = (this.searchText || '').toLowerCase().trim();

    return this.leads.filter((lead: Lead) => {
      const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase();
      const company = (lead.companyName || '').toLowerCase();
      const email = (lead.email || '').toLowerCase();
      const phone = lead.phone || '';

      const matchesSearch = !search || fullName.includes(search) || company.includes(search) || email.includes(search) || phone.includes(search);
      const matchesStatus = this.selectedStatus === 'ALL' || lead.status === this.selectedStatus;

      let matchesDashboardFilter = true;
      switch (this.dashboardFilter) {
        case 'NEW': matchesDashboardFilter = lead.status === 'NEW'; break;
        case 'WON': matchesDashboardFilter = lead.status === 'WON'; break;
        case 'ASSIGNED': matchesDashboardFilter = lead.assignedToId != null; break;
        case 'UNASSIGNED': matchesDashboardFilter = lead.assignedToId == null; break;
      }

      const matchesProduct = this.selectedProduct === 'ALL' || lead.product === this.selectedProduct;

      return matchesSearch && matchesStatus && matchesDashboardFilter && matchesProduct;
    });
  }
isSelectionMode = false; 

 
  toggleSelectionMode(): void {
    this.isSelectionMode = !this.isSelectionMode;
    if (!this.isSelectionMode) {
      this.clearSelection();}
      
  }
  get totalLeads(): number { return this.leads.length; }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatus = 'ALL';
    this.selectedProduct = 'ALL';
  }

  openAddLead(): void { this.router.navigate(['/leads/add']); }
  openLeadProfile(leadId: number): void { this.router.navigate(['/leads', leadId]); }
  openBulkUpload(): void { this.router.navigate(['/leads/bulk-upload']); }
  closeForms(): void { this.showAddLeadForm = false; this.showBulkUpload = false; }
}