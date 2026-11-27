
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LeadService,
  LeadImportPreview,
  LeadImportSaveResponse
} from '../../../services/lead.service';

interface UploadSheet {
  id: number;
  name: string;
  selectedFile: File | null;
  isUploading: boolean;
  isSaving: boolean;
  errorMessage: string;
  successMessage: string;
  previewData: LeadImportPreview | null;
  importResult: LeadImportSaveResponse | null;
}

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload.component.html',
  styleUrls: ['./bulk-upload.component.css']
})
export class BulkUploadComponent {

  sheets: UploadSheet[] = [];
  activeSheetId = 1;
  private nextSheetId = 2;

  constructor(
    private leadService: LeadService,
    private router: Router
  ) {
    this.sheets.push(this.createSheet(1));
  }

  private createSheet(id: number): UploadSheet {
    return {
      id,
      name: `Sheet ${id}`,
      selectedFile: null,
      isUploading: false,
      isSaving: false,
      errorMessage: '',
      successMessage: '',
      previewData: null,
      importResult: null
    };
  }

  get activeSheet(): UploadSheet {
    return this.sheets.find(
      sheet => sheet.id === this.activeSheetId
    ) || this.sheets[0];
  }

  addSheet(): void {
    const id = this.nextSheetId++;
    this.sheets.push(this.createSheet(id));
    this.activeSheetId = id;
  }

  selectSheet(id: number): void {
    this.activeSheetId = id;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const sheet = this.activeSheet;

    sheet.selectedFile = null;
    sheet.previewData = null;
    sheet.importResult = null;
    sheet.errorMessage = '';
    sheet.successMessage = '';

    if (!file) return;

    const allowedExtensions = ['.xlsx', '.xls', '.csv'];

    const isValidFile = allowedExtensions.some(
      extension => file.name.toLowerCase().endsWith(extension)
    );

    if (!isValidFile) {
      sheet.errorMessage =
        'Please select a valid Excel (.xlsx, .xls) or CSV file.';
      input.value = '';
      return;
    }

    sheet.selectedFile = file;
    sheet.name = file.name;
  }

  uploadExcel(): void {
    const sheet = this.activeSheet;

    if (
      !sheet.selectedFile ||
      sheet.isUploading ||
      sheet.isSaving
    ) return;

    sheet.isUploading = true;
    sheet.errorMessage = '';
    sheet.successMessage = '';
    sheet.previewData = null;
    sheet.importResult = null;

    this.leadService
      .previewRawLeadImport(sheet.selectedFile)
      .subscribe({
        next: (response: LeadImportPreview) => {
          sheet.isUploading = false;
          sheet.previewData = response;

          console.log(`${sheet.name} Preview:`, response);

          if (!response || response.totalRows === 0) {
            sheet.errorMessage =
              'No records found in the uploaded file.';
            sheet.previewData = null;
          }
        },
        error: (error) => {
          sheet.isUploading = false;
          console.error(`${sheet.name} Preview Error:`, error);

          sheet.errorMessage =
            error.error?.message ||
            'File preview failed. Please check the file and try again.';
        }
      });
  }

  importLeads(): void {
    const sheet = this.activeSheet;

    if (
      !sheet.selectedFile ||
      !sheet.previewData ||
      sheet.isSaving ||
      sheet.isUploading ||
      sheet.importResult ||
      sheet.previewData.validRows <= 0
    ) return;

    sheet.isSaving = true;
    sheet.errorMessage = '';
    sheet.successMessage = '';

    this.leadService
      .saveRawLeadImport(sheet.selectedFile)
      .subscribe({
        next: (response: LeadImportSaveResponse) => {
          sheet.isSaving = false;
          sheet.importResult = response;

          sheet.successMessage =
            response.message ||
            `${sheet.name} import completed successfully!`;

          console.log(`${sheet.name} Import Result:`, response);
        },
        error: (error) => {
          sheet.isSaving = false;
          console.error(`${sheet.name} Database Import Error:`, error);

          sheet.errorMessage =
            error.error?.message ||
            'Unable to save leads into database. Please try again.';
        }
      });
  }

  clearPreview(): void {
    const sheet = this.activeSheet;

    if (sheet.isSaving || sheet.isUploading) return;

    sheet.selectedFile = null;
    sheet.previewData = null;
    sheet.importResult = null;
    sheet.errorMessage = '';
    sheet.successMessage = '';
    sheet.name = `Sheet ${sheet.id}`;
  }

  backToLeads(): void {
    this.router.navigate(['/leads']);
  }
}
