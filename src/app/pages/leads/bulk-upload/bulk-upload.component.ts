import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  LeadService,
  LeadImportPreview,
  LeadImportSaveResponse,
  ImportBatchResponse,
  ImportBatchRow
} from '../../../services/lead.service';

interface AssignUser {
  id: number;
  name: string;
  role: string;
}

interface BatchTableRow extends ImportBatchRow {
  pendingAssignedToId: number | null;
  isAssigning: boolean;
  assignMessage: string;
}

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
  batchId: number | null;
  headers: string[];
  rows: BatchTableRow[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLoadingRows: boolean;
}

@Component({
  selector: 'app-bulk-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-upload.component.html',
  styleUrls: ['./bulk-upload.component.css']
})
export class BulkUploadComponent implements OnInit {

  private readonly apiBaseUrl = 'https://api.hexafin.cloud';

  sheets: UploadSheet[] = [];
  activeSheetId = 1;
  nextSheetId = 2;

  users: AssignUser[] = [];
  isLoadingUsers = false;
  userLoadError = '';

  constructor(
    private leadService: LeadService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.createSheet();
    this.loadUsers();
  }

  // CURRENT SHEET
  get activeSheet(): UploadSheet {
    return this.sheets.find(
      sheet => sheet.id === this.activeSheetId
    ) || this.sheets[0];
  }

  // CREATE NEW SHEET
  createSheet(): void {
    const sheet: UploadSheet = {
      id: this.nextSheetId,
      name: `Sheet ${this.nextSheetId}`,
      selectedFile: null,
      isUploading: false,
      isSaving: false,
      errorMessage: '',
      successMessage: '',
      previewData: null,
      importResult: null,
      batchId: null,
      headers: [],
      rows: [],
      currentPage: 0,
      pageSize: 25,
      totalElements: 0,
      totalPages: 0,
      isLoadingRows: false
    };

    this.sheets.push(sheet);
    this.activeSheetId = sheet.id;
    this.nextSheetId++;
  }

  // CHANGE SHEET
  selectSheet(sheetId: number): void {
    this.activeSheetId = sheetId;
  }

  // FILE SELECTION
  onFileSelected(event: Event, sheet: UploadSheet): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    sheet.selectedFile = null;
    sheet.previewData = null;
    sheet.importResult = null;
    sheet.batchId = null;
    sheet.headers = [];
    sheet.rows = [];
    sheet.errorMessage = '';
    sheet.successMessage = '';

    if (!file) return;

    const allowedExtensions = ['.xlsx', '.xls', '.csv'];

    const isValidFile = allowedExtensions.some(extension =>
      file.name.toLowerCase().endsWith(extension)
    );

    if (!isValidFile) {
      sheet.errorMessage =
        'Please select a valid Excel (.xlsx, .xls) or CSV file.';
      input.value = '';
      return;
    }

    sheet.selectedFile = file;
  }

  // STEP 1: PREVIEW
  uploadExcel(sheet: UploadSheet): void {
    if (
      !sheet.selectedFile ||
      sheet.isUploading ||
      sheet.isSaving
    ) {
      return;
    }

    sheet.isUploading = true;
    sheet.errorMessage = '';
    sheet.successMessage = '';
    sheet.previewData = null;
    sheet.importResult = null;

    this.leadService.previewRawLeadImport(sheet.selectedFile).subscribe({
      next: (response: LeadImportPreview) => {
        sheet.isUploading = false;

        if (!response || response.totalRows === 0) {
          sheet.errorMessage = 'No records found in the uploaded file.';
          return;
        }

        sheet.previewData = response;
        console.log('Sheet Preview:', response);
      },
      error: (error) => {
        sheet.isUploading = false;
        console.error('Preview Error:', error);

        sheet.errorMessage =
          error.error?.message ||
          'File preview failed. Please check the file and try again.';
      }
    });
  }

  // STEP 2: SAVE TO DATABASE
  importLeads(sheet: UploadSheet): void {
    if (
      !sheet.selectedFile ||
      !sheet.previewData ||
      sheet.isSaving ||
      sheet.isUploading ||
      sheet.importResult ||
      sheet.previewData.validRows <= 0
    ) {
      return;
    }

    sheet.isSaving = true;
    sheet.errorMessage = '';
    sheet.successMessage = '';

    this.leadService.saveRawLeadImport(sheet.selectedFile).subscribe({
      next: (response: LeadImportSaveResponse) => {
        sheet.isSaving = false;
        sheet.importResult = response;

        if (!response.batchId) {
          sheet.errorMessage =
            'Import completed, but the server did not return a Batch ID.';
          return;
        }

        sheet.batchId = response.batchId;
        sheet.successMessage =
          response.message || 'Import completed successfully!';

        // Load saved records for this sheet
        this.loadBatchRows(sheet, 0);

        console.log('Import Result:', response);
      },
      error: (error) => {
        sheet.isSaving = false;
        console.error('Database Import Error:', error);

        sheet.errorMessage =
          error.error?.message ||
          'Unable to save leads into database. Please try again.';
      }
    });
  }

  // LOAD BATCH RECORDS WITH PAGINATION
  loadBatchRows(sheet: UploadSheet, page: number): void {
    if (!sheet.batchId || sheet.isLoadingRows) return;

    sheet.isLoadingRows = true;
    sheet.errorMessage = '';

    this.leadService.getImportBatchLeads(
      sheet.batchId,
      page,
      sheet.pageSize
    ).subscribe({
      next: (response: ImportBatchResponse) => {
        sheet.isLoadingRows = false;

        sheet.headers = response.headers || [];
        sheet.rows = (response.rows || []).map(row => ({
          ...row,
          pendingAssignedToId: row.assignedToId ?? null,
          isAssigning: false,
          assignMessage: ''
        }));

        sheet.currentPage = response.currentPage;
        sheet.pageSize = response.pageSize;
        sheet.totalElements = response.totalElements;
        sheet.totalPages = response.totalPages;
      },
      error: (error) => {
        sheet.isLoadingRows = false;
        console.error('Batch Records Error:', error);

        sheet.errorMessage =
          error.error?.message ||
          'Unable to load records for this sheet.';
      }
    });
  }

  // PAGINATION
  previousPage(sheet: UploadSheet): void {
    if (sheet.currentPage > 0) {
      this.loadBatchRows(sheet, sheet.currentPage - 1);
    }
  }

  nextPage(sheet: UploadSheet): void {
    if (sheet.currentPage + 1 < sheet.totalPages) {
      this.loadBatchRows(sheet, sheet.currentPage + 1);
    }
  }

  // LOAD SALES USERS FOR ASSIGNMENT
  loadUsers(): void {
    this.isLoadingUsers = true;
    this.userLoadError = '';

    this.http.get<any>(
      `${this.apiBaseUrl}/api/users`,
      { headers: this.getAuthHeaders() }
    ).subscribe({
      next: (response) => {
        this.isLoadingUsers = false;

        const userList = Array.isArray(response)
          ? response
          : response?.content || response?.users || [];

        this.users = userList
          .filter((user: any) =>
            String(user.role || user.roleName || '')
              .toUpperCase()
              .includes('SALES')
          )
          .map((user: any) => ({
            id: Number(user.id),
            name: user.name ||
              `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
              user.email ||
              `User ${user.id}`,
            role: user.role || user.roleName || 'SALES'
          }))
          .filter((user: AssignUser) => Number.isFinite(user.id));
      },
      error: (error) => {
        this.isLoadingUsers = false;
        console.error('Load Users Error:', error);
        this.userLoadError =
          error.error?.message ||
          'Unable to load Sales users. Check user API permissions.';
      }
    });
  }

  // ASSIGN ONE IMPORTED ROW
  assignRow(sheet: UploadSheet, row: BatchTableRow): void {
    if (
      !row.pendingAssignedToId ||
      row.isAssigning
    ) {
      return;
    }

    row.isAssigning = true;
    row.assignMessage = '';

    this.leadService.assignLead(
      row.leadId,
      row.pendingAssignedToId
    ).subscribe({
      next: () => {
        row.isAssigning = false;
        row.assignedToId = row.pendingAssignedToId;

        const selectedUser = this.users.find(
          user => user.id === row.pendingAssignedToId
        );

        row.assignedToName = selectedUser?.name || null;
        row.assignMessage = 'Assigned successfully';
      },
      error: (error) => {
        row.isAssigning = false;
        console.error('Assign Lead Error:', error);

        row.assignMessage =
          error.error?.message || 'Assignment failed';
      }
    });
  }

  // AUTH HEADERS
  private getAuthHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('crm_token') ||
      localStorage.getItem('jwt');

    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // CLEAR CURRENT SHEET PREVIEW
  clearPreview(sheet: UploadSheet): void {
    if (sheet.isSaving || sheet.isUploading) return;

    sheet.selectedFile = null;
    sheet.previewData = null;
    sheet.importResult = null;
    sheet.batchId = null;
    sheet.headers = [];
    sheet.rows = [];
    sheet.errorMessage = '';
    sheet.successMessage = '';
    sheet.currentPage = 0;
    sheet.totalElements = 0;
    sheet.totalPages = 0;
  }

  // BACK TO LEADS
  backToLeads(): void {
    this.router.navigate(['/leads']);
  }

  // TRACK BY
  trackBySheetId(index: number, sheet: UploadSheet): number {
    return sheet.id;
  }

  trackByRowId(index: number, row: BatchTableRow): number {
    return row.leadId;
  }
}