
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  Lead,
  LeadService
} from '../../services/lead.service';

type LeadFilter = 'ALL' | 'NEW' | 'ACTIVE' | 'WON' | 'LOST';

@Component({
  selector: 'app-my-leads',
  standalone: false,
  templateUrl: './my-leads.component.html',
  styleUrls: ['./my-leads.component.css']
})
export class MyLeadsComponent implements OnInit {

  leads: Lead[] = [];

  loading = false;
  errorMessage = '';

  selectedFilter: LeadFilter = 'ALL';

  readonly filters: LeadFilter[] = [
    'ALL',
    'NEW',
    'ACTIVE',
    'WON',
    'LOST'
  ];

  readonly activeStatuses = [
    'CONTACTED',
    'QUALIFIED',
    'FOLLOW_UP',
    'PROPOSAL'
  ];

  constructor(
    private leadService: LeadService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // ==========================================
  // INITIALIZATION
  // ==========================================

  ngOnInit(): void {

    // Read filter from dashboard query parameters
    this.route.queryParamMap.subscribe(params => {

      const status = params.get('status')?.trim().toUpperCase();

      this.selectedFilter = this.filters.includes(status as LeadFilter)
        ? status as LeadFilter
        : 'ALL';

    });

    this.loadMyLeads();
  }

  // ==========================================
  // LOAD LOGGED-IN SALES USER LEADS
  // ==========================================

  loadMyLeads(): void {

    this.loading = true;
    this.errorMessage = '';

    this.leadService.getMyLeads().subscribe({

      next: (response: Lead[]) => {

        this.leads = response ?? [];

        this.loading = false;
      },

      error: (error) => {

        console.error('Unable to load assigned leads:', error);

        if (error.status === 401) {
          this.errorMessage =
            'Your session has expired. Please log in again.';

        } else if (error.status === 403) {
          this.errorMessage =
            'You do not have permission to view these leads.';

        } else if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to the backend server.';

        } else {
          this.errorMessage =
            'Unable to load your leads. Please try again.';
        }

        this.loading = false;
      }
    });
  }

  // ==========================================
  // FILTER SELECTION
  // ==========================================

  selectFilter(filter: LeadFilter): void {

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: filter
      },
      queryParamsHandling: 'merge'
    });
  }

  // ==========================================
  // FILTERED AND SORTED LEADS
  // ==========================================

  get filteredLeads(): Lead[] {

    // Sort newest leads first
    const sortedLeads = [...this.leads].sort((a, b) => {

      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return dateB - dateA;
    });

    // All assigned leads
    if (this.selectedFilter === 'ALL') {
      return sortedLeads;
    }

    // Filter by lead status
    return sortedLeads.filter(lead => {

      const status = (lead.status ?? '').trim().toUpperCase();

      if (this.selectedFilter === 'ACTIVE') {
        return this.activeStatuses.includes(status);
      }

      return status === this.selectedFilter;
    });
  }

  // ==========================================
  // PAGE TITLE
  // ==========================================

  get pageTitle(): string {

    const titles: Record<LeadFilter, string> = {
      ALL: 'All My Leads',
      NEW: 'New Leads',
      ACTIVE: 'Active Leads',
      WON: 'Won Leads',
      LOST: 'Lost Leads'
    };

    return titles[this.selectedFilter];
  }

  // ==========================================
  // FILTER COUNTS
  // ==========================================

  getFilterCount(filter: LeadFilter): number {

    if (filter === 'ALL') {
      return this.leads.length;
    }

    return this.leads.filter(lead => {

      const status = (lead.status ?? '').trim().toUpperCase();

      if (filter === 'ACTIVE') {
        return this.activeStatuses.includes(status);
      }

      return status === filter;
    }).length;
  }

  // ==========================================
  // LEAD PROFILE NAVIGATION
  // ==========================================

  openLead(leadId: number): void {
    this.router.navigate(['/my-leads', leadId]);
  }

  // ==========================================
  // DISPLAY HELPERS
  // ==========================================

  getLeadName(lead: Lead): string {

    return `${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim()
      || 'Unnamed Lead';
  }

  getStatusLabel(status: string): string {

    return (status ?? '')
      .trim()
      .toUpperCase()
      .replace(/_/g, ' ') || 'Unknown';
  }

  getStatusClass(status: string): string {

    return (status ?? '')
      .trim()
      .toLowerCase()
      .replace(/_/g, '-');
  }

}
