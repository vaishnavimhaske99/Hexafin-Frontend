
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  LeadService,
  LeadImportPreview,
  LeadImportSaveResponse
} from '../../../services/lead.service';

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload.component.html',
  styleUrls: ['./bulk-upload.component.css']
})
export class BulkUploadComponent {

  selectedFile: File | null = null;

  isUploading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  previewData: LeadImportPreview | null = null;

  importResult: LeadImportSaveResponse | null = null;

  constructor(
    private leadService: LeadService,
    private router: Router
  ) {}

  // FILE SELECTION
  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.selectedFile = null;
    this.previewData = null;
    this.importResult = null;

    this.errorMessage = '';
    this.successMessage = '';

    if (!file) {
      return;
    }

    const allowedExtensions = ['.xlsx', '.xls', '.csv'];

    const isValidFile = allowedExtensions.some(extension =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!isValidFile) {

      this.errorMessage =
        'Please select a valid Excel (.xlsx, .xls) or CSV file.';

      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  // STEP 1: PREVIEW FILE
  uploadExcel(): void {

    if (!this.selectedFile || this.isUploading) {
      return;
    }

    this.isUploading = true;

    this.errorMessage = '';
    this.successMessage = '';
    this.previewData = null;
    this.importResult = null;

    this.leadService
      .previewRawLeadImport(this.selectedFile)
      .subscribe({

        next: (response) => {

          this.isUploading = false;
          this.previewData = response;

          console.log('Lead Preview:', response);

        },

        error: (error) => {

          this.isUploading = false;

          console.error('Preview Error:', error);

          this.errorMessage =
            error.error?.message ||
            'File preview failed. Please try again.';

        }

      });
  }

  // STEP 2: SAVE FILE DATA INTO DATABASE
  importLeads(): void {

    if (
      !this.selectedFile ||
      !this.previewData ||
      this.isSaving ||
      this.importResult
    ) {
      return;
    }

    this.isSaving = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.leadService
      .saveRawLeadImport(this.selectedFile)
      .subscribe({

        next: (response) => {

          this.isSaving = false;

          this.importResult = response;

          this.successMessage =
            response.message || 'Leads saved successfully!';

          console.log('Database Import Result:', response);

        },

        error: (error) => {

          this.isSaving = false;

          console.error('Database Import Error:', error);

          this.errorMessage =
            error.error?.message ||
            'Unable to save leads into database.';

        }

      });
  }

  // BACK TO LEADS
  backToLeads(): void {
    this.router.navigate(['/leads']);
  }

  // CLEAR PREVIEW
  clearPreview(): void {

    this.selectedFile = null;
    this.previewData = null;
    this.importResult = null;

    this.errorMessage = '';
    this.successMessage = '';
  }

}
