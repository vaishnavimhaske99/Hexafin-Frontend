import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { Lead, LeadActivity, LeadService, LeadNote } from 'src/app/services/lead.service';
import { CustomerService, CustomerRequest } from '../../../services/customer.service';

@Component({
  selector: 'app-lead-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lead-profile.component.html',
  styleUrls: ['./lead-profile.component.css']
})
export class LeadProfileComponent implements OnInit, OnDestroy {

  lead: Lead | null = null;
  loading = true;
  errorMessage = '';
  activeTab = 'overview';

  // Activities
  activities: LeadActivity[] = [];
  activitiesLoading = false;
  activitiesError = '';

  // Notes
  notes: LeadNote[] = [];
  notesLoading = false;
  notesError = '';
  newNoteContent = '';
  isSavingNote = false;
  editingNoteId: number | null = null;
  editingNoteContent = '';

  // Role
  userRole = localStorage.getItem('role') || '';

  // Action Modal
  showActionModal = false;
  actionType = '';
  actionDescription = '';

  // Follow-up Modal
  showFollowUpModal = false;
  followUpDate = '';

  // Call Modal
  showCallModal = false;
  callTimerInterval: any = null;
  callSeconds = 0;
  callNotes = '';
  callOutcome: 'INTERESTED' | 'NOT_INTERESTED' | 'CALLBACK' | 'WRONG_NUMBER' | '' = '';
  isLoggingCall = false;

  // Status Change
  statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'FOLLOW_UP', 'PROPOSAL', 'WON', 'LOST'];
  isUpdatingStatus = false;
  statusSuccessMessage = '';

  // Status History
  statusHistory: any[] = [];
  statusHistoryLoading = false;
  statusHistoryError = '';

  // Customer Conversion
  showCustomerForm = false;
  isConverting = false;
  showSuccessPopup = false;
  convertedCustomerName = '';
  convertedCustomerId = 0;
  convertedCustomerLoanType = '';

  // ═══════════ DROPDOWN OPTIONS ═══════════
  employmentTypes = ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'FREELANCER'];
  genders = ['MALE', 'FEMALE', 'OTHER'];
  maritalStatuses = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];
  urgencies = ['LOW', 'MEDIUM', 'HIGH'];
  leadSources = ['WALK_IN', 'REFERRAL', 'ONLINE', 'CALL', 'CAMPAIGN'];
  loanStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'DISBURSED'];
  previousLoanStatuses = ['ACTIVE', 'CLOSED', 'DEFAULT', 'NPA'];
  repaymentHistories = ['EXCELLENT', 'GOOD', 'LATE', 'DEFAULTED'];

  // ═══════════ FULL CUSTOMER FORM (58 fields) ═══════════
  customerForm: CustomerRequest = {
    // Personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',

    // KYC
    dateOfBirth: '',
    gender: '',
    maritalStatus: '',
    panNumber: '',
    aadhaarNumber: '',
    photoUrl: '',
    permanentAddress: '',

    // Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',

    // Employment
    employmentType: '',
    companyName: '',
    designation: '',
    experienceYears: undefined,
    itrFiled: false,

    // Loan
    loanType: '',
    loanPurpose: '',
    loanAmount: undefined,
    tenureMonths: undefined,
    interestRate: undefined,

    // Financial
    monthlyIncome: undefined,
    propertyValue: undefined,
    existingEmi: undefined,
    cibilScore: undefined,
    otherIncome: undefined,
    expectedEmi: undefined,
    downPayment: undefined,

    // Previous Loan
    previousLoanTaken: false,
    previousLoanType: '',
    previousLoanLender: '',
    previousLoanAmount: undefined,
    previousLoanEmi: undefined,
    previousLoanTenure: undefined,
    previousLoanReason: '',
    previousLoanStatus: '',
    previousRepaymentHistory: '',

    // Requirement
    urgency: 'MEDIUM',

    // Documents
    docPanCard: false,
    docAadhaarCard: false,
    docSalarySlips: false,
    docBankStatement: false,
    docItr: false,
    docPropertyPapers: false,
    docPhoto: false,

    // Bank
    bankName: '',
    accountNumber: '',
    loanStatus: 'PENDING',

    // Consultation
    leadSource: '',
    notes: '',
    nextFollowUp: ''
  };

  private leadId: number | null = null;

  tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'status-history', label: 'Status History' },
    { id: 'actions', label: 'Actions' },
    { id: 'notes', label: 'Notes' },
    { id: 'history', label: 'Activity History' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private leadService: LeadService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.errorMessage = 'Invalid lead ID.';
      this.loading = false;
      return;
    }
    this.leadId = id;
    this.loadLead(id);
  }

  ngOnDestroy(): void {
    this.stopCallTimer();
  }

  // ==========================================
  // LOAD LEAD
  // ==========================================
  loadLead(id: number): void {
    this.loading = true;
    this.leadService.getLeadById(id).subscribe({
      next: (res: Lead) => {
        this.lead = res;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Lead details load zale nahit.';
        this.loading = false;
      }
    });
  }

  // ==========================================
  // STATUS CHANGE
  // ==========================================
  changeStatus(newStatus: string): void {
    if (!this.leadId || !this.lead) return;
    if (this.lead.status === newStatus) return;

    this.isUpdatingStatus = true;
    this.statusSuccessMessage = '';

    this.leadService.updateLeadStatus(this.leadId, newStatus).subscribe({
      next: () => {
        this.isUpdatingStatus = false;
        if (this.lead) this.lead.status = newStatus;

        this.statusSuccessMessage = `Status changed to ${newStatus.replace('_', ' ')}`;
        setTimeout(() => this.statusSuccessMessage = '', 3000);

        this.statusHistory = [];
        if (this.activeTab === 'status-history') {
          this.loadStatusHistory();
        }
      },
      error: (err) => {
        this.isUpdatingStatus = false;
        alert(err?.error?.message || 'Failed to change status');
        console.error(err);
      }
    });
  }

  // ==========================================
  // STATUS HISTORY
  // ==========================================
  loadStatusHistory(): void {
    if (!this.leadId) return;
    this.statusHistoryLoading = true;
    this.statusHistoryError = '';

    this.leadService.getStatusHistory(this.leadId).subscribe({
      next: (res) => {
        this.statusHistory = (res || []).sort(
          (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
        );
        this.statusHistoryLoading = false;
      },
      error: (err) => {
        this.statusHistoryError = 'Status history load zali nahi.';
        this.statusHistoryLoading = false;
        console.error(err);
      }
    });
  }

  // ==========================================
  // ACTIVITIES
  // ==========================================
  loadActivities(): void {
    if (!this.leadId) return;
    this.activitiesLoading = true;
    this.activitiesError = '';

    this.leadService.getActivitiesByLeadId(this.leadId).subscribe({
      next: (res) => {
        this.activities = (res || []).sort(
          (a, b) => new Date(b.activityDateTime).getTime() - new Date(a.activityDateTime).getTime()
        );
        this.activitiesLoading = false;
      },
      error: (err) => {
        this.activitiesError = 'Activity history load zali nahi.';
        this.activitiesLoading = false;
        console.error(err);
      }
    });
  }

  saveActivity(): void {
    if (!this.leadId || !this.actionDescription.trim() || !this.actionType) return;

    const request = {
      type: this.actionType as 'CALL' | 'WHATSAPP' | 'EMAIL' | 'TEXT' | 'MEETING' | 'OTHER',
      description: this.actionDescription.trim()
    };

    this.leadService.createActivity(this.leadId, request).subscribe({
      next: () => {
        this.showActionModal = false;
        this.actionDescription = '';
        this.setActiveTab('history');
        this.loadActivities();
      },
      error: (err) => {
        if (err.status === 401) {
          alert('Session expired. Please login again.');
        } else {
          alert('Activity save zali nahi. Please try again.');
        }
        console.error(err);
      }
    });
  }

  // ==========================================
  // NOTES
  // ==========================================
  loadNotes(): void {
    if (!this.leadId) return;
    this.notesLoading = true;
    this.notesError = '';

    this.leadService.getNotesByLeadId(this.leadId).subscribe({
      next: (res) => {
        this.notes = (res || []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.notesLoading = false;
      },
      error: (err) => {
        this.notesError = 'Notes load zale nahit.';
        this.notesLoading = false;
        console.error(err);
      }
    });
  }

  saveNote(): void {
    if (!this.newNoteContent.trim() || !this.leadId) return;
    this.isSavingNote = true;

    this.leadService.createNote(this.leadId, this.newNoteContent).subscribe({
      next: (createdNote) => {
        this.notes = [createdNote, ...this.notes];
        this.newNoteContent = '';
        this.isSavingNote = false;
      },
      error: (err) => {
        alert('Note save zali nahi.');
        this.isSavingNote = false;
        console.error(err);
      }
    });
  }

  startEditNote(note: LeadNote): void {
    this.editingNoteId = note.id;
    this.editingNoteContent = note.content;
  }

  cancelEditNote(): void {
    this.editingNoteId = null;
    this.editingNoteContent = '';
  }

  updateNote(): void {
    if (!this.editingNoteId || !this.editingNoteContent.trim()) return;

    this.leadService.updateNote(this.editingNoteId, this.editingNoteContent).subscribe({
      next: (updatedNote) => {
        this.notes = this.notes.map(n =>
          n.id === updatedNote.id ? updatedNote : n
        );
        this.editingNoteId = null;
        this.editingNoteContent = '';
      },
      error: (err) => {
        alert('Note update zali nahi.');
        console.error(err);
      }
    });
  }

  deleteNote(noteId: number): void {
    if (!confirm('Are you sure you want to delete this note?')) return;

    this.leadService.deleteNote(noteId).subscribe({
      next: () => {
        this.notes = this.notes.filter(n => n.id !== noteId);
      },
      error: (err) => {
        alert('Note delete zali nahi.');
        console.error(err);
      }
    });
  }

  // ==========================================
  // TAB SWITCHING
  // ==========================================
  setActiveTab(tabId: string): void {
    this.activeTab = tabId;

    if (tabId === 'notes' && this.notes.length === 0 && !this.notesLoading) {
      this.loadNotes();
    }

    if (tabId === 'history' && this.activities.length === 0 && !this.activitiesLoading) {
      this.loadActivities();
    }

    if (tabId === 'status-history' && this.statusHistory.length === 0 && !this.statusHistoryLoading) {
      this.loadStatusHistory();
    }
  }

  // ==========================================
  // ACTION MODAL
  // ==========================================
  openActionModal(type: string): void {
    this.actionType = type;
    this.actionDescription = '';
    this.showActionModal = true;
  }

  // ==========================================
  // CALL MODAL
  // ==========================================
  makeCall(): void {
    if (!this.lead?.phone) return;
    window.location.href = `tel:${this.lead.phone}`;
    this.showCallModal = true;
    this.callSeconds = 0;
    this.callNotes = '';
    this.callOutcome = '';
    this.startCallTimer();
  }

  startCallTimer(): void {
    if (this.callTimerInterval) clearInterval(this.callTimerInterval);
    this.callTimerInterval = setInterval(() => {
      this.callSeconds++;
      if (this.callSeconds >= 1800) {
        this.stopCallTimer();
        this.closeCallModal();
      }
    }, 1000);
  }

  stopCallTimer(): void {
    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }
  }

  get formattedCallDuration(): string {
    const mins = Math.floor(this.callSeconds / 60);
    const secs = this.callSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  closeCallModal(): void {
    this.stopCallTimer();
    this.showCallModal = false;
    this.callSeconds = 0;
    this.callNotes = '';
    this.callOutcome = '';
  }

  saveCallLog(): void {
    if (!this.leadId || !this.callOutcome) {
      alert('Please select a call outcome.');
      return;
    }

    this.isLoggingCall = true;

    const request = {
      type: 'CALL' as const,
      description: `Call outcome: ${this.callOutcome.replace('_', ' ')} | Duration: ${this.formattedCallDuration} | Notes: ${this.callNotes || 'No notes'}`
    };

    this.leadService.createActivity(this.leadId, request).subscribe({
      next: () => {
        this.isLoggingCall = false;
        this.stopCallTimer();
        this.showCallModal = false;
        this.setActiveTab('history');
        this.loadActivities();
      },
      error: (err) => {
        this.isLoggingCall = false;
        alert('Failed to save call log.');
        console.error(err);
      }
    });
  }

  // ==========================================
  // FOLLOW-UP
  // ==========================================
  openFollowUpModal(): void {
    this.showFollowUpModal = true;
    this.followUpDate = '';
  }

  saveFollowUp(): void {
    console.log('Saving Follow-up for:', this.followUpDate);
    this.showFollowUpModal = false;
    alert('Follow-up scheduled!');
  }

  // ==========================================
  // CUSTOMER CONVERSION
  // ==========================================
  openConvertForm(): void {
    if (!this.lead) return;

    // ✅ Prefill from lead data, rest reset
    this.customerForm = {
      // Personal (from lead)
      firstName: this.lead.firstName || '',
      lastName: this.lead.lastName || '',
      email: this.lead.email || '',
      phone: this.lead.phone || '',
      alternatePhone: '',

      // KYC
      dateOfBirth: '',
      gender: '',
      maritalStatus: '',
      panNumber: '',
      aadhaarNumber: '',
      photoUrl: '',
      permanentAddress: '',

      // Address (from lead)
      addressLine1: (this.lead as any).addressLine1 || '',
      addressLine2: (this.lead as any).addressLine2 || '',
      city: this.lead.city || '',
      state: (this.lead as any).state || '',
      country: (this.lead as any).country || 'India',
      pincode: (this.lead as any).pincode || '',

      // Employment
      employmentType: '',
      companyName: this.lead.companyName || '',
      designation: '',
      experienceYears: undefined,
      itrFiled: false,

      // Loan (prefill product)
      loanType: this.lead.product || '',
      loanPurpose: '',
      loanAmount: undefined,
      tenureMonths: undefined,
      interestRate: undefined,

      // Financial
      monthlyIncome: undefined,
      propertyValue: undefined,
      existingEmi: undefined,
      cibilScore: undefined,
      otherIncome: undefined,
      expectedEmi: undefined,
      downPayment: undefined,

      // Previous Loan
      previousLoanTaken: false,
      previousLoanType: '',
      previousLoanLender: '',
      previousLoanAmount: undefined,
      previousLoanEmi: undefined,
      previousLoanTenure: undefined,
      previousLoanReason: '',
      previousLoanStatus: '',
      previousRepaymentHistory: '',

      // Requirement
      urgency: 'MEDIUM',

      // Documents
      docPanCard: false,
      docAadhaarCard: false,
      docSalarySlips: false,
      docBankStatement: false,
      docItr: false,
      docPropertyPapers: false,
      docPhoto: false,

      // Bank
      bankName: '',
      accountNumber: '',
      loanStatus: 'PENDING',

      // Consultation (leadSource from lead.source)
      leadSource: this.lead.source || '',
      notes: '',
      nextFollowUp: ''
    };

    this.showCustomerForm = true;
  }

  closeConvertForm(): void {
    this.showCustomerForm = false;
  }

  saveCustomer(): void {
    if (!this.leadId) return;

    if (!this.customerForm.firstName || !this.customerForm.phone) {
      alert('First name and phone are required.');
      return;
    }

    this.isConverting = true;

    this.customerService.convertLeadToCustomer(this.leadId, this.customerForm).subscribe({
      next: (customer) => {
        this.isConverting = false;
        this.showCustomerForm = false;

        this.convertedCustomerName = `${customer.firstName} ${customer.lastName || ''}`.trim();
        this.convertedCustomerId = customer.id;
        this.convertedCustomerLoanType = customer.loanType || 'N/A';
        this.showSuccessPopup = true;

        if (this.lead) {
          this.lead.status = 'WON';
        }
      },
      error: (err) => {
        this.isConverting = false;
        alert(err?.error?.message || 'Conversion failed. Please try again.');
        console.error(err);
      }
    });
  }

  closeSuccessPopup(): void {
    this.showSuccessPopup = false;
  }

  goToCustomersList(): void {
    this.showSuccessPopup = false;
    this.router.navigate(['/customers']);
  }

  // ==========================================
  // EMI CALCULATOR
  // ==========================================
  get calculatedEmi(): number {
    const p = this.customerForm.loanAmount;
    const r = this.customerForm.interestRate;
    const n = this.customerForm.tenureMonths;

    if (!p || !r || !n) return 0;

    const monthlyRate = r / (12 * 100);
    const emi = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) /
                (Math.pow(1 + monthlyRate, n) - 1);
    return Math.round(emi);
  }

  get totalPayment(): number {
    return this.calculatedEmi * (this.customerForm.tenureMonths || 0);
  }

  get totalInterest(): number {
    return this.totalPayment - (this.customerForm.loanAmount || 0);
  }

  // ✅ Annual income preview (server-calculated will override)
  get formTotalAnnualIncome(): number {
    const monthly = (Number(this.customerForm.monthlyIncome) || 0)
                  + (Number(this.customerForm.otherIncome) || 0);
    return monthly * 12;
  }

  // ==========================================
  // HELPERS
  // ==========================================
  get fullName(): string {
    return this.lead ? `${this.lead.firstName} ${this.lead.lastName}` : '';
  }

  get whatsappUrl(): string {
    const phone = this.lead?.phone?.replace(/\D/g, '') ?? '';
    return `https://wa.me/${phone}`;
  }

  goBack(): void {
    this.router.navigate(['/leads']);
  }
}