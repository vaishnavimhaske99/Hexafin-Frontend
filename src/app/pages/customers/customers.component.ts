import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {

  customers: Customer[] = [];
  loading = true;
  errorMessage = '';
  userRole = localStorage.getItem('role') || '';

  searchTerm = '';
  statusFilter = '';

  // 🆕 Expanded row tracking (Set of customer IDs)
  expandedIds = new Set<number>();

  constructor(
    private customerService: CustomerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.customerService.getAllCustomers().subscribe({
      next: (res) => {
        this.customers = res || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load customers.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  openCustomerProfile(id: number): void {
    this.router.navigate(['/customers', id]);
  }

  // 🆕 Expand/collapse
  toggleExpand(id: number, event: Event): void {
    event.stopPropagation();
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedIds.has(id);
  }

  get filteredCustomers(): Customer[] {
    return this.customers.filter(c => {
      const term = (this.searchTerm || '').trim().toLowerCase();
      const haystack = [
        c.firstName || '', c.lastName || '',
        c.email || '', c.phone || ''
      ].join(' ').toLowerCase();

      const matchSearch = !term || haystack.includes(term);
      const matchStatus = !this.statusFilter || c.loanStatus === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  get hasActiveFilter(): boolean {
    return !!this.searchTerm.trim() || !!this.statusFilter;
  }

  // ✅ Formatters
  formatEnum(v?: string): string {
    if (!v) return '—';
    return v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatLoanType(type?: string): string {
    return this.formatEnum(type);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return d; }
  }

  cibilClass(score?: number): string {
    if (!score) return '';
    if (score >= 750) return 'cibil-good';
    if (score >= 650) return 'cibil-avg';
    return 'cibil-poor';
  }

  urgencyClass(u?: string): string {
    if (!u) return '';
    const s = u.toUpperCase();
    if (s === 'HIGH') return 'urgency-high';
    if (s === 'MEDIUM') return 'urgency-medium';
    return 'urgency-low';
  }
}