
import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import {
  LeadService,
  CreateLeadRequest,
  LoanProductType
} from '../../../services/lead.service';

@Component({
  selector: 'app-add-lead',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-lead.component.html',
  styleUrls: ['./add-lead.component.css']
})
export class AddLeadComponent {

  @Output() leadCreated = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  leadSources: string[] = [
    'WEBSITE',
    'REFERRAL',
    'SOCIAL_MEDIA',
    'COLD_CALL',
    'EMAIL',
    'ADVERTISEMENT',
    'OTHER'
  ];

  loanProducts: {
    label: string;
    value: LoanProductType;
  }[] = [
    { label: 'Home Loan', value: 'HOME_LOAN' },
    { label: 'Personal Loan', value: 'PERSONAL_LOAN' },
    { label: 'Business Loan', value: 'BUSINESS_LOAN' },
    { label: 'Loan Against Property', value: 'LOAN_AGAINST_PROPERTY' },
    { label: 'Car Loan', value: 'CAR_LOAN' },
    { label: 'Loan Against Securities', value: 'LOAN_AGAINST_SECURITIES' }
  ];

  formData: CreateLeadRequest = this.emptyForm();

  constructor(
    private leadService: LeadService,
    private router: Router
  ) {}

  // ==========================================
  // EMPTY FORM
  // ==========================================

  private emptyForm(): CreateLeadRequest {

    return {
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',

      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      pincode: '',

      source: null,
      product: null,
      description: ''
    };

  }

  // ==========================================
  // ERROR MESSAGE HANDLER
  // ==========================================

  private getErrorMessage(error: any): string {

    if (error.status === 0) {
      return 'Cannot connect to Spring Boot server. Please check backend.';
    }

    if (error.status === 401) {
      return 'Session expired. Please login again.';
    }

    if (error.status === 403) {
      return 'Access denied. You do not have permission to create leads.';
    }

    if (error.status === 404) {
      return 'Create Lead API endpoint not found. Please check backend URL.';
    }

    if (error.status === 400) {

      return error.error?.message ||
        error.error?.error ||
        'Invalid lead data. Please check the entered information.';

    }

    if (error.status === 409) {
      return error.error?.message ||
        'A lead with these details may already exist.';
    }

    return error.error?.message ||
      error.error?.error ||
      (typeof error.error === 'string' ? error.error : '') ||
      `Unable to create lead. HTTP Status: ${error.status}`;

  }

  // ==========================================
  // CREATE LEAD
  // ==========================================

  submitLead(form: NgForm): void {

    if (form.invalid || this.isSubmitting) {

      form.control.markAllAsTouched();
      return;

    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Prepare clean request payload.
    const payload: CreateLeadRequest = {

      ...this.formData,

      firstName: this.formData.firstName.trim(),
      lastName: this.formData.lastName?.trim() || '',
      companyName: this.formData.companyName?.trim() || '',
      email: this.formData.email?.trim() || '',
      phone: this.formData.phone?.trim() || '',

      addressLine1: this.formData.addressLine1?.trim() || '',
      addressLine2: this.formData.addressLine2?.trim() || '',
      city: this.formData.city?.trim() || '',
      state: this.formData.state?.trim() || '',
      country: this.formData.country?.trim() || '',
      pincode: this.formData.pincode?.trim() || '',

      description: this.formData.description?.trim() || ''

    };

    console.log('Create Lead Request:', payload);

    this.leadService.createLead(payload).subscribe({

      next: response => {

        console.log('Lead Created Successfully:', response);

        this.isSubmitting = false;
        this.successMessage = 'Lead added successfully!';
        this.errorMessage = '';

        // Notify parent component.
        this.leadCreated.emit();

        // Reset form after successful API response.
        this.formData = this.emptyForm();
        form.resetForm(this.formData);

      },

      error: error => {

        this.isSubmitting = false;

        console.error('Create Lead API Error:', error);

        this.errorMessage = this.getErrorMessage(error);

      }

    });

  }

  // ==========================================
  // BACK TO LEADS
  // ==========================================

  cancel(): void {

    this.cancelled.emit();

    this.router.navigate(['/leads']);

  }

}
