
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  LeadService,
  BulkUploadResponse
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
  errorMessage = '';

  uploadResult: BulkUploadResponse | null = null;

  constructor(
    private leadService: LeadService,
    private router: Router
  ) {}

  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.selectedFile = null;
    this.uploadResult = null;
    this.errorMessage = '';

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.errorMessage = 'Please select a valid Excel (.xlsx) file.';
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  uploadExcel(): void {

    if (!this.selectedFile || this.isUploading) {
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.uploadResult = null;

    this.leadService.bulkUploadLeads(this.selectedFile).subscribe({

      next: (response) => {

        this.isUploading = false;
        this.uploadResult = response;

        console.log('Bulk Import Result:', response);

        if (response.failedCount > 0) {
          this.errorMessage =
            'Import completed with some failed rows. Check the errors below.';
        }

      },

      error: (error) => {

        this.isUploading = false;

        console.error('Bulk Import Error:', error);

        this.errorMessage =
          error.error?.message ||
          'Excel upload failed. Please try again.';
      }

    });
  }

  backToLeads(): void {
    this.router.navigate(['/leads']);
  }
}
