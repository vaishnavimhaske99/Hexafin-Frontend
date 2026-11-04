
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

  // API States
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Exact values from Backend LeadSource enum
  leadSources: string[] = [
    'WEBSITE',
    'REFERRAL',
    'SOCIAL_MEDIA',
    'COLD_CALL',
    'EMAIL',
    'ADVERTISEMENT',
    'OTHER'
  ];
  loanProducts: { label: string; value: LoanProductType }[] = [
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

  // Empty Lead Form
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

  // CREATE LEAD API
  submitLead(form: NgForm): void {

    if (form.invalid || this.isSubmitting) {
      form.control.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.leadService.createLead(this.formData).subscribe({

      next: (response) => {

        console.log('Lead created successfully:', response);

        this.isSubmitting = false;

        // Show success message
        this.successMessage = 'Lead added successfully!';
        this.errorMessage = '';

        // Reset form
        this.formData = this.emptyForm();
        form.resetForm(this.formData);

        // Do not redirect immediately.
        // User can click Back to All Leads.

      },

      error: (error) => {

        this.isSubmitting = false;
        this.successMessage = '';

        console.error('Create Lead Error:', error);

        if (error.status === 403) {
          this.errorMessage =
            'Access denied. You do not have permission to create leads.';
        } else if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to Spring Boot server.';
        } else {
          this.errorMessage =
            error.error?.message ||
            'Unable to create lead. Please try again.';
        }
      }

    });
  }

  // Back to All Leads
  cancel(): void {
    this.cancelled.emit();
    this.router.navigate(['/leads']);
  }

}
