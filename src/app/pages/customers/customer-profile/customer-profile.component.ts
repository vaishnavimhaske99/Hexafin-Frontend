import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService, Customer, CustomerRequest } from '../../../services/customer.service';

@Component({
  selector: 'app-customer-profile',
  templateUrl: './customer-profile.component.html',
  styleUrls: ['./customer-profile.component.css']
})
export class CustomerProfileComponent implements OnInit {

  customer: Customer | null = null;
  loading = true;
  errorMessage = '';
  activeTab = 'overview';

  // ✅ EDIT MODE
  editMode = false;
  saving = false;
  saveError = '';
  editForm: CustomerRequest = {};

  // Dropdown options
  employmentTypes = ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'FREELANCER'];
  genders = ['MALE', 'FEMALE', 'OTHER'];
  maritalStatuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
  urgencies = ['LOW', 'MEDIUM', 'HIGH'];
  leadSources = ['WALK_IN', 'REFERRAL', 'ONLINE', 'CALL', 'CAMPAIGN'];
  loanStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED'];
  previousLoanStatuses = ['ACTIVE', 'CLOSED', 'DEFAULT', 'NPA'];
  repaymentHistories = ['EXCELLENT', 'GOOD', 'LATE', 'DEFAULTED'];
  loanTypes = [
    'HOME_LOAN', 'PERSONAL_LOAN', 'BUSINESS_LOAN',
    'LOAN_AGAINST_PROPERTY', 'CAR_LOAN', 'LOAN_AGAINST_SECURITIES'
  ];
  // ═══════════════════════════════════════════════
// ✅ DOCUMENTS
// ═══════════════════════════════════════════════

documentTypes = [
  { value: 'PAN_CARD',        label: 'PAN Card',        field: 'panCardUrl',        icon: '🪪' },
  { value: 'AADHAAR_CARD',    label: 'Aadhaar Card',    field: 'aadhaarCardUrl',    icon: '🆔' },
  { value: 'SALARY_SLIPS',    label: 'Salary Slips',    field: 'salarySlipsUrl',    icon: '📄' },
  { value: 'BANK_STATEMENT',  label: 'Bank Statement',  field: 'bankStatementUrl',  icon: '🏦' },
  { value: 'ITR',             label: 'ITR',             field: 'itrUrl',            icon: '📊' },
  { value: 'PROPERTY_PAPERS', label: 'Property Papers', field: 'propertyPapersUrl', icon: '🏠' },
  { value: 'PHOTO',           label: 'Photo',           field: 'photoDocUrl',       icon: '📷' }
];

uploadingType: string | null = null;

getDocUrl(docType: string): string | undefined {
  const type = this.documentTypes.find(t => t.value === docType);
  return type ? (this.customer as any)?.[type.field] : undefined;
}

getFileName(path?: string): string {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
}

onFileSelect(event: Event, docType: string): void {
  if (!this.customer?.id) return;

  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    alert('File size 10MB peksha jasta nahi pahije.');
    input.value = '';
    return;
  }

  this.uploadingType = docType;

  this.customerService.uploadDocument(this.customer.id, docType, file).subscribe({
    next: (updated) => {
      this.customer = updated;
      this.uploadingType = null;
      input.value = '';
    },
    error: (err) => {
      this.uploadingType = null;
      input.value = '';
      alert(err?.error?.message || 'Upload failed.');
      console.error(err);
    }
  });
}

downloadDoc(docType: string): void {
  if (!this.customer?.id) return;
  const url = this.getDocUrl(docType);
  const fileName = this.getFileName(url);
  this.customerService.downloadDocument(this.customer.id, docType, fileName);
}

deleteDoc(docType: string): void {
  if (!this.customer?.id) return;
  if (!confirm('Delete this document?')) return;

  this.customerService.deleteDocument(this.customer.id, docType).subscribe({
    next: (updated) => {
      this.customer = updated;
    },
    error: (err) => {
      alert('Delete failed.');
      console.error(err);
    }
  });
}

formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'kyc', label: 'KYC & Personal' },
    { id: 'employment', label: 'Employment' },
    { id: 'loan', label: 'Loan Details' },
    { id: 'previous', label: 'Previous Loans' },
    { id: 'documents', label: 'Documents' },
    { id: 'consultation', label: 'Consultation' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.errorMessage = 'Invalid customer ID.';
      this.loading = false;
      return;
    }
    this.loadCustomer(id);
  }

  loadCustomer(id: number): void {
    this.loading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (res) => {
        this.customer = res;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Customer details load zale nahit.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }

  // ═══════════ EDIT MODE ═══════════

  startEdit(): void {
    if (!this.customer) return;
    // Deep clone customer to editForm
    this.editForm = { ...this.customer };
    this.editMode = true;
    this.saveError = '';
    this.activeTab = 'overview';
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editForm = {};
    this.saveError = '';
  }

  saveEdit(): void {
    if (!this.customer || !this.customer.id) return;

    if (!this.editForm.firstName || !this.editForm.phone || !this.editForm.email) {
      this.saveError = 'First name, phone, and email are required.';
      return;
    }

    this.saving = true;
    this.saveError = '';

    this.customerService.updateCustomer(this.customer.id, this.editForm).subscribe({
      next: (updated) => {
        this.customer = updated;
        this.editMode = false;
        this.editForm = {};
        this.saving = false;
      },
      error: (err) => {
        this.saving = false;
        this.saveError = err.error?.message || 'Failed to save changes.';
        console.error(err);
      }
    });
  }

  // ═══════════ DISPLAY HELPERS ═══════════

  get fullName(): string {
    return this.customer
      ? `${this.customer.firstName || ''} ${this.customer.lastName || ''}`.trim()
      : '';
  }

  get initials(): string {
    if (!this.customer) return '?';
    return (
      (this.customer.firstName?.charAt(0) || '') +
      (this.customer.lastName?.charAt(0) || '')
    ).toUpperCase() || '?';
  }

  get calculatedEmi(): number {
    if (!this.customer) return 0;
    const p = this.customer.loanAmount;
    const r = this.customer.interestRate;
    const n = this.customer.tenureMonths;
    if (!p || !r || !n) return 0;
    const mr = r / (12 * 100);
    return Math.round((p * mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1));
  }

  get docCount(): number {
    if (!this.customer) return 0;
    const docs = [
      this.customer.docPanCard,
      this.customer.docAadhaarCard,
      this.customer.docSalarySlips,
      this.customer.docBankStatement,
      this.customer.docItr,
      this.customer.docPropertyPapers,
      this.customer.docPhoto
    ];
    return docs.filter(Boolean).length;
  }

  // ✅ Live doc count during edit
  get editDocCount(): number {
    const docs = [
      this.editForm.docPanCard,
      this.editForm.docAadhaarCard,
      this.editForm.docSalarySlips,
      this.editForm.docBankStatement,
      this.editForm.docItr,
      this.editForm.docPropertyPapers,
      this.editForm.docPhoto
    ];
    return docs.filter(Boolean).length;
  }

  // Live doc count based on mode
  get currentDocCount(): number {
    return this.editMode ? this.editDocCount : this.docCount;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return d;
    }
  }

  formatEnum(v?: string): string {
    if (!v) return '—';
    return v.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatLoanType(type?: string): string {
    return this.formatEnum(type);
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

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}