
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

  // STEP 1: PREVIEW SMART IMPORT
  uploadExcel(): void {

    if (!this.selectedFile || this.isUploading || this.isSaving) {
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

        next: (response: LeadImportPreview) => {

          this.isUploading = false;

          this.previewData = response;

          console.log('Smart Lead Preview:', response);

          if (!response || response.totalRows === 0) {
            this.errorMessage = 'No records found in the uploaded file.';
            this.previewData = null;
          }

        },

        error: (error) => {

          this.isUploading = false;

          console.error('Preview Error:', error);

          this.errorMessage =
            error.error?.message ||
            'File preview failed. Please check the file and try again.';

        }

      });
  }

  // STEP 2: SAVE VALID LEADS
  importLeads(): void {

    if (
      !this.selectedFile ||
      !this.previewData ||
      this.isSaving ||
      this.isUploading ||
      this.importResult ||
      this.previewData.validRows <= 0
    ) {
      return;
    }

    this.isSaving = true;

    this.errorMessage = '';
    this.successMessage = '';

    this.leadService
      .saveRawLeadImport(this.selectedFile)
      .subscribe({

        next: (response: LeadImportSaveResponse) => {

          this.isSaving = false;

          this.importResult = response;

          this.successMessage =
            response.message || 'Lead import completed successfully!';

          console.log('Smart Import Result:', response);

        },

        error: (error) => {

          this.isSaving = false;

          console.error('Database Import Error:', error);

          this.errorMessage =
            error.error?.message ||
            'Unable to save leads into database. Please try again.';

        }

      });
  }

  // BACK TO LEADS
  backToLeads(): void {
    this.router.navigate(['/leads']);
  }

  // CLEAR PREVIEW
  clearPreview(): void {

    if (this.isSaving || this.isUploading) {
      return;
    }

    this.selectedFile = null;
    this.previewData = null;
    this.importResult = null;

    this.errorMessage = '';
    this.successMessage = '';

  }

}
