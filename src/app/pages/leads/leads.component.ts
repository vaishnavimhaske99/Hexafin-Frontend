
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import {
  Lead,
  LeadService,
  LoanProductType
} from '../../services/lead.service';

interface UserDto {
  id: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: string;
  reportsToId?: number | null;
}

type LeadWithRawFlag = Lead & {
  raw?: boolean;
  isRaw?: boolean;
  importStatus?: 'RAW' | 'VALIDATED' | 'IMPORTED' | 'FAILED';
};

type LeadTab = 'ALL' | 'UNASSIGNED' | 'ASSIGNED';

type DashboardFilter =
  | 'ALL'
  | 'NEW'
  | 'WON'
  | 'ASSIGNED'
  | 'UNASSIGNED';

@Component({
  selector: 'app-leads',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.css']
})
export class LeadsComponent implements OnInit {

  // ==========================================
  // DATA
  // ==========================================

  leads: Lead[] = [];
  allUsers: UserDto[] = [];

  apiUrl = 'http://localhost:8080/api';

 userRole: string =
  (
    localStorage.getItem('crm_role') ||
    localStorage.getItem('userRole') ||
    localStorage.getItem('role') ||
    ''
  ).toUpperCase();
  // ==========================================
  // FILTER STATE
  // ==========================================
activeTab: LeadTab = 'ALL';

leadView: 'HOME' | 'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'PRODUCTS' | 'PRODUCT' = 'HOME';
  dashboardFilter: DashboardFilter = 'ALL';

  searchText = '';

  selectedStatus = 'ALL';

  selectedProduct: LoanProductType | 'ALL' = 'ALL';

  showFilters = false;

  isLoading = false;

  errorMessage = '';

  // ==========================================
  // ASSIGNMENT STATE
  // ==========================================

  isSelectionMode = false;

  selectedLeadIds = new Set<number>();

  bulkAssignUserId: number | null = null;

  isBulkAssigning = false;

  successMessage = '';

  assignmentError = '';

  // ==========================================
  // PRODUCT OPTIONS
  // ==========================================

  loanProducts: {
    label: string;
    value: LoanProductType;
  }[] = [
    {
      label: 'Home Loan',
      value: 'HOME_LOAN'
    },
    {
      label: 'Personal Loan',
      value: 'PERSONAL_LOAN'
    },
    {
      label: 'Business Loan',
      value: 'BUSINESS_LOAN'
    },
    {
      label: 'Loan Against Property',
      value: 'LOAN_AGAINST_PROPERTY'
    },
    {
      label: 'Car Loan',
      value: 'CAR_LOAN'
    },
    {
      label: 'Loan Against Securities',
      value: 'LOAN_AGAINST_SECURITIES'
    }
  ];

  statuses: string[] = [
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'FOLLOW_UP',
    'PROPOSAL',
    'WON',
    'LOST'
  ];

  // ==========================================
  // CONSTRUCTOR
  // ==========================================

  constructor(
    private leadService: LeadService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  // ==========================================
  // INITIALIZATION
  // ==========================================
ngOnInit(): void {

  this.route.paramMap.subscribe(params => {

    // Current child route
    const currentPath = this.route.snapshot.routeConfig?.path || '';

    // Product from URL
    const productFromUrl = params.get('product');

    const validProduct = this.loanProducts.find(
      item => item.value === productFromUrl
    );

    this.selectedProduct = validProduct
      ? validProduct.value
      : 'ALL';

    // Determine Lead View
   // Determine Enquiry View
if (
  currentPath === 'leads/all' ||
  currentPath === 'all'
) {
  this.leadView = 'ALL';
}
else if (
  currentPath === 'leads/assigned' ||
  currentPath === 'assigned'
) {
  this.leadView = 'ASSIGNED';
}
else if (
  currentPath === 'leads/unassigned' ||
  currentPath === 'unassigned'
) {
  this.leadView = 'UNASSIGNED';
}
else if (
  currentPath === 'leads/products' ||
  currentPath === 'products'
) {
  this.leadView = 'PRODUCTS';
}
else if (
  currentPath === 'leads/product/:product' ||
  currentPath === 'product/:product'
) {
  this.leadView = 'PRODUCT';
}
else {
  this.leadView = 'HOME';
}

    this.activeTab = 'ALL';
    this.clearSelection();

    this.loadLeads();
    this.loadAllUsers();

  });

  // Dashboard Filter
  this.route.queryParams.subscribe(params => {

    const filter = params['filter'];

    const allowedFilters: DashboardFilter[] = [
      'ALL',
      'NEW',
      'WON',
      'ASSIGNED',
      'UNASSIGNED'
    ];

    this.dashboardFilter = allowedFilters.includes(filter)
      ? filter
      : 'ALL';

  });

}
  // ==========================================
  // AUTH HEADERS
  // ==========================================

  getHeaders(): HttpHeaders {

    const token =
      localStorage.getItem('crm_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt');

    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set(
        'Authorization',
        `Bearer ${token}`
      );
    }

    return headers;
  }

  // ==========================================
  // LOAD LEADS
  // ==========================================

  loadLeads(): void {

    this.isLoading = true;
    this.errorMessage = '';

    this.leadService.getAllLeads().subscribe({

      next: (records: Lead[]) => {

        this.leads = records || [];

        this.isLoading = false;

        console.log('Leads API Response:', records);

        console.log(
          'RAW Leads:',
          this.leads.filter(lead => this.isRawLead(lead))
        );

      },

      error: (error) => {

        console.error('Load Leads Error:', error);

        this.isLoading = false;

        this.errorMessage =
          'Failed to fetch leads. HTTP Status: ' +
          error.status;

      }

    });

  }

  // ==========================================
  // LOAD USERS
  // ==========================================

  loadAllUsers(): void {

    this.http.get<UserDto[]>(
      `${this.apiUrl}/users`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({

      next: (users) => {

        this.allUsers = users || [];

        console.log('Users Loaded:', this.allUsers);

      },

      error: (error) => {

        console.error('Load Users Error:', error);

      }

    });

  }

  // ==========================================
  // USER DISPLAY NAME
  // ==========================================

  getUserDisplayName(user: UserDto): string {

    if (user.name) {
      return user.name;
    }

    return `${user.firstName || ''} ${user.lastName || ''}`
      .trim() || `User #${user.id}`;

  }

  // ==========================================
  // ELIGIBLE USERS
  // ==========================================

 get eligibleUsers(): UserDto[] {
  return this.allUsers;


  }

  // ==========================================
  // RAW LEAD CHECK
  // ==========================================

  isRawLead(lead: Lead): boolean {

    const rawLead = lead as LeadWithRawFlag;

    return (
      rawLead.raw === true ||
      rawLead.isRaw === true ||
      rawLead.importStatus === 'RAW'
    );

  }

  getImportStatus(lead: Lead): string {

    const rawLead = lead as LeadWithRawFlag;

    return (
      rawLead.importStatus ||
      (this.isRawLead(lead) ? 'RAW' : 'NORMAL')
    );

  }
navigateToLeadView(
  view: 'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'PRODUCTS'
): void {

  this.clearSelection();

  this.searchText = '';
  this.selectedStatus = 'ALL';
  this.activeTab = 'ALL';
  this.dashboardFilter = 'ALL';

  const paths: Record<typeof view, string> = {
    ALL: '/leads/all',
    ASSIGNED: '/leads/assigned',
    UNASSIGNED: '/leads/unassigned',
    PRODUCTS: '/leads/products'
  };

  this.router.navigate([paths[view]]);

}
  // ==========================================
  // SUMMARY COUNTS
  // ==========================================

  get allLeadsCount(): number {

    return this.leads.length;

  }

  get rawLeadsCount(): number {

    return this.leads.filter(
      lead => this.isRawLead(lead)
    ).length;

  }

 get unassignedCount(): number {
  return this.leads.filter(lead =>
    lead.assignedToId === null ||
    lead.assignedToId === undefined ||
    lead.assignedToId === 0
  ).length;
}
  get allProductsLeadsCount(): number {

  return this.leads.filter(
    lead => !!lead.product
  ).length;

}

 get assignedCount(): number {
  return this.leads.filter(lead =>
    lead.assignedToId !== null &&
    lead.assignedToId !== undefined &&
    lead.assignedToId !== 0
  ).length;
}

  // ==========================================
  // PRODUCT NAVIGATION
  // ==========================================

  selectProduct(
    product: LoanProductType | 'ALL'
  ): void {

    this.clearSelection();

    this.assignmentError = '';
    this.successMessage = '';

    this.activeTab = 'ALL';

    if (product === 'ALL') {

      this.router.navigate(['/leads']);

      return;

    }

    this.router.navigate([
      '/leads/product',
      product
    ]);

  }

  // ==========================================
  // BACK TO PRODUCTS
  // ==========================================

  backToProducts(): void {

    this.clearSelection();

    this.searchText = '';
    this.selectedStatus = 'ALL';
    this.activeTab = 'ALL';
    this.dashboardFilter = 'ALL';

    this.router.navigate(['/leads']);

  }

  // ==========================================
  // PRODUCT COUNT
  // ==========================================

  getProductCount(
    product: LoanProductType
  ): number {

    return this.leads.filter(
      lead => lead.product === product
    ).length;

  }

  // ==========================================
  // PRODUCT LABEL
  // ==========================================

  getProductLabel(
    product: LoanProductType | 'ALL' | string
  ): string {

    if (product === 'ALL') {
      return 'All Products';
    }

    const selected = this.loanProducts.find(
      item => item.value === product
    );

    if (selected) {
      return selected.label;
    }

    return product
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());

  }

  // ==========================================
  // SUMMARY TAB
  // ==========================================

  changeTab(tab: LeadTab): void {

    this.activeTab = tab;

    this.clearSelection();

  }

  // ==========================================
  // FILTERED LEADS
  // ==========================================

  
get filteredLeads(): Lead[] {

  return this.leads.filter(lead => {

    const fullName =
      `${lead.firstName || ''} ${lead.lastName || ''}`
        .toLowerCase();

    const search =
      this.searchText.trim().toLowerCase();

    const isAssigned =
      lead.assignedToId !== null &&
      lead.assignedToId !== undefined &&
      lead.assignedToId !== 0;

    const matchesSearch =
      !search ||
      fullName.includes(search) ||
      (lead.companyName || '').toLowerCase().includes(search) ||
      (lead.email || '').toLowerCase().includes(search) ||
      (lead.phone || '').toLowerCase().includes(search) ||
      (lead.city || '').toLowerCase().includes(search);

    const matchesStatus =
      this.selectedStatus === 'ALL' ||
      lead.status === this.selectedStatus;

    const matchesProduct =
      this.selectedProduct === 'ALL' ||
      lead.product === this.selectedProduct;

    const matchesLeadView =
      this.leadView === 'ALL' ||
      (
        this.leadView === 'ASSIGNED' &&
        isAssigned
      ) ||
      (
        this.leadView === 'UNASSIGNED' &&
        !isAssigned
      ) ||
      (
        this.leadView === 'PRODUCTS' &&
        !!lead.product
      ) ||
      (
        this.leadView === 'PRODUCT' &&
        this.selectedProduct !== 'ALL' &&
        lead.product === this.selectedProduct
      );

    const matchesDashboard =
      this.dashboardFilter === 'ALL' ||
      (
        this.dashboardFilter === 'NEW' &&
        lead.status === 'NEW'
      ) ||
      (
        this.dashboardFilter === 'WON' &&
        lead.status === 'WON'
      ) ||
      (
        this.dashboardFilter === 'ASSIGNED' &&
        isAssigned
      ) ||
      (
        this.dashboardFilter === 'UNASSIGNED' &&
        !isAssigned
      );

    const matchesTab =
      this.activeTab === 'ALL' ||
      (
        this.activeTab === 'UNASSIGNED' &&
        !isAssigned
      ) ||
      (
        this.activeTab === 'ASSIGNED' &&
        isAssigned
      );

    return (
      matchesSearch &&
      matchesStatus &&
      matchesProduct &&
      matchesLeadView &&
      matchesTab &&
      matchesDashboard
    );

  });

}

  // ==========================================
  // STATUS CSS CLASS
  // ==========================================

  getStatusClass(
    status: string | null | undefined
  ): string {

    return (status || 'NORMAL')
      .toLowerCase()
      .replace(/ /g, '_');

  }

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedStatus = 'ALL';

    // Keep selectedProduct unchanged.
    // This is important on Product Workspace pages.

    this.activeTab = 'ALL';

    this.clearSelection();

  }

  // ==========================================
  // CLEAR DASHBOARD FILTER
  // ==========================================

  clearDashboardFilter(): void {

    this.dashboardFilter = 'ALL';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        filter: null
      },
      queryParamsHandling: 'merge'
    });

  }

  // ==========================================
  // SELECTION MODE
  // ==========================================

  toggleSelectionMode(): void {

    this.isSelectionMode = !this.isSelectionMode;

    this.clearSelection();

    this.assignmentError = '';
    this.successMessage = '';

  }
toggleSelection(
  leadId: number,
  checked: boolean
): void {

  const lead = this.leads.find(
    item => item.id === leadId
  );

  if (!lead) {
    return;
  }

  if (checked) {
    this.selectedLeadIds.add(leadId);
  } else {
    this.selectedLeadIds.delete(leadId);
  }
}

  toggleAll(checked: boolean): void {

  const eligibleLeads = this.filteredLeads;

  if (checked) {
    eligibleLeads.forEach(lead => {
      this.selectedLeadIds.add(lead.id);
    });
  } else {
    eligibleLeads.forEach(lead => {
      this.selectedLeadIds.delete(lead.id);
    });
  }
}

 isAllSelected(): boolean {

  const eligibleLeads = this.filteredLeads;

  return (
    eligibleLeads.length > 0 &&
    eligibleLeads.every(
      lead => this.selectedLeadIds.has(lead.id)
    )
  );
}
  clearSelection(): void {

    this.selectedLeadIds.clear();

    this.bulkAssignUserId = null;

  }

  // ==========================================
  // BULK ASSIGNMENT
  // ==========================================

  bulkAssign(): void {

    if (
      this.selectedLeadIds.size === 0 ||
      !this.bulkAssignUserId
    ) {
      return;
    }

    const userId = this.bulkAssignUserId;

    const leadIds = Array.from(this.selectedLeadIds);

    this.isBulkAssigning = true;

    this.successMessage = '';
    this.assignmentError = '';

    const requests = leadIds.map(leadId =>
      this.leadService.assignLead(leadId, userId)
    );

    forkJoin(requests).subscribe({

      next: () => {

        this.isBulkAssigning = false;

        this.successMessage =
          `${leadIds.length} leads assigned successfully.`;

        this.clearSelection();

        this.isSelectionMode = false;

        this.loadLeads();

      },

      error: (error) => {

        console.error('Bulk Assignment Error:', error);

        this.isBulkAssigning = false;

        this.assignmentError =
          'Bulk assignment failed. Please check the selected leads and try again.';

      }

    });

  }

  // ==========================================
  // ADD LEAD NAVIGATION
  // ==========================================

  openAddLead(): void {

    this.router.navigate(['/leads/add']);

  }

  // ==========================================
  // BULK UPLOAD NAVIGATION
  // ==========================================

  openBulkUpload(): void {

    this.router.navigate(['/leads/bulk-upload']);

  }

  // ==========================================
  // LEAD PROFILE NAVIGATION
  // ==========================================

  openLeadProfile(leadId: number): void {

    this.router.navigate(['/leads', leadId]);

  }

}
