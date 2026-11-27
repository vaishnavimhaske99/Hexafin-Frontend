
import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Observable } from 'rxjs';

export type LoanProductType =
  | 'HOME_LOAN'
  | 'PERSONAL_LOAN'
  | 'BUSINESS_LOAN'
  | 'LOAN_AGAINST_PROPERTY'
  | 'CAR_LOAN'
  | 'LOAN_AGAINST_SECURITIES';

// ==========================================
// LEAD INTERFACE
// ==========================================

export interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  source: string;
  product: LoanProductType | null;
  status: string;
  description: string;
  assignedToId: number | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// SALES USER INTERFACE
// ==========================================

export interface SalesUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: string;
  assignedLeadCount: number;
}

// ==========================================
// CREATE LEAD REQUEST
// ==========================================

export interface CreateLeadRequest {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  source: string | null;
  product: LoanProductType | null;
  description: string;
}

// ==========================================
// OLD BULK UPLOAD RESPONSE
// ==========================================

export interface BulkUploadResponse {
  totalRows: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
}

// ==========================================
// LEAD ACTIVITY
// ==========================================

export interface LeadActivity {
  id: number;
  leadId: number;
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'TEXT' | 'MEETING' | 'OTHER';
  activityDateTime: string;
  createdAt: string;
  createdById: number | null;
  createdByName: string | null;
  description: string;
}

export interface CreateActivityRequest {
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'TEXT' | 'MEETING' | 'OTHER';
  description: string;
  activityDateTime?: string;
}

// ==========================================
// LEAD NOTES
// ==========================================

export interface LeadNote {
  id: number;
  leadId: number;
  content: string;
  createdById?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadNoteRequest {
  content: string;
}

// ==========================================
// RAW LEAD
// ==========================================

export type LeadImportStatus =
  | 'RAW'
  | 'VALIDATED'
  | 'IMPORTED'
  | 'FAILED';

export interface RawLead extends Lead {
  raw: boolean;
  importStatus: LeadImportStatus;
}

// ==========================================
// SMART LEAD IMPORT RESPONSE
// ==========================================

export interface LeadImportSaveResponse {
  message: string;
  batchId: number;
  totalRows: number;
  savedCount: number;
  duplicateCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
}

// ==========================================
// SMART LEAD IMPORT PREVIEW
// ==========================================

export interface LeadImportPreview {
  headers: string[];
  autoMappings: { [key: string]: string };
  unknownColumns: string[];
  previewRows: { [key: string]: string }[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warnings: string[];
}

// ==========================================
// IMPORT BATCH ROW
// ==========================================

export interface ImportBatchRow {
  leadId: number;
  rawData: { [key: string]: any };
  assignedToId: number | null;
  assignedToName: string | null;
}

// ==========================================
// IMPORT BATCH RESPONSE
// ==========================================

export interface ImportBatchResponse {
  batchId: number;
  fileName: string;
  headers: string[];
  rows: ImportBatchRow[];
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

// ==========================================
// LEAD SERVICE
// ==========================================

@Injectable({
  providedIn: 'root'
})
export class LeadService {

  private readonly apiUrl = 'https://api.hexafin.cloud/api/leads';
  private readonly adminUrl = 'https://api.hexafin.cloud/api/admin';

  constructor(private http: HttpClient) {}

  // ==========================================
  // AUTH HEADERS
  // ==========================================

  private getAuthHeaders(): HttpHeaders {

    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ==========================================
  // ACTIVITY API METHODS
  // ==========================================

  createActivity(
    leadId: number,
    request: CreateActivityRequest
  ): Observable<LeadActivity> {

    return this.http.post<LeadActivity>(
      `${this.apiUrl}/${leadId}/activities`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  updateActivity(
    activityId: number,
    request: CreateActivityRequest
  ): Observable<LeadActivity> {

    return this.http.put<LeadActivity>(
      `${this.apiUrl}/activities/${activityId}`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  getLeadsByAssignedTo(userId: number): Observable<Lead[]> {

    return this.http.get<Lead[]>(
      `${this.apiUrl}/assigned-to/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getLeadsAssignedToUser(userId: number): Observable<Lead[]> {

    return this.http.get<Lead[]>(
      `${this.apiUrl}/assigned-to/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteActivity(activityId: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/activities/${activityId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ==========================================
  // LEAD STATUS APIs
  // ==========================================

  updateLeadStatus(leadId: number, status: string): Observable<any> {

    return this.http.put<any>(
      `${this.apiUrl}/${leadId}/status`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }

  getStatusHistory(leadId: number): Observable<any[]> {

    return this.http.get<any[]>(
      `${this.apiUrl}/${leadId}/status-history`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ==========================================
  // RAW LEAD MANAGEMENT APIs
  // ==========================================

  getRawLeads(): Observable<RawLead[]> {

    return this.http.get<RawLead[]>(
      `${this.apiUrl}/raw`,
      { headers: this.getAuthHeaders() }
    );
  }

  getRawLeadsByStatus(
    status: LeadImportStatus
  ): Observable<RawLead[]> {

    return this.http.get<RawLead[]>(
      `${this.apiUrl}/raw/status/${status}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getRawLeadsCount(): Observable<number> {

    return this.http.get<number>(
      `${this.apiUrl}/raw/count`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ==========================================
  // SMART LEAD IMPORT APIs
  // ==========================================

  // PREVIEW EXCEL / CSV
  previewRawLeadImport(file: File): Observable<LeadImportPreview> {

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<LeadImportPreview>(
      `${this.apiUrl}/import/preview`,
      formData,
      { headers }
    );
  }

  // SAVE IMPORT DATA
  saveRawLeadImport(file: File): Observable<LeadImportSaveResponse> {

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<LeadImportSaveResponse>(
      `${this.apiUrl}/import/save-raw`,
      formData,
      { headers }
    );
  }

  // ==========================================
  // GET BATCH-WISE IMPORTED LEADS
  // ==========================================

  getImportBatchLeads(
    batchId: number,
    page: number = 0,
    size: number = 25
  ): Observable<ImportBatchResponse> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<ImportBatchResponse>(
      `${this.apiUrl}/import-batches/${batchId}/leads`,
      {
        headers: this.getAuthHeaders(),
        params
      }
    );
  }

  // ==========================================
  // LEAD LIST APIs
  // ==========================================

  getMyLeads(): Observable<Lead[]> {

    return this.http.get<Lead[]>(
      `${this.apiUrl}/my-leads`,
      { headers: this.getAuthHeaders() }
    );
  }

  getLeadsBySalesUser(userId: number): Observable<Lead[]> {

    return this.http.get<Lead[]>(
      `${this.apiUrl}/sales-user/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getAllLeads(): Observable<Lead[]> {

    return this.http.get<Lead[]>(
      this.apiUrl,
      { headers: this.getAuthHeaders() }
    );
  }

  getLeadById(id: number): Observable<Lead> {

    return this.http.get<Lead>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getActivitiesByLeadId(leadId: number): Observable<LeadActivity[]> {

    return this.http.get<LeadActivity[]>(
      `${this.apiUrl}/${leadId}/activities`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ==========================================
  // SALES USERS APIs
  // ==========================================

  getSalesUsers(): Observable<SalesUser[]> {

    return this.http.get<SalesUser[]>(
      `${this.adminUrl}/sales-users`,
      { headers: this.getAuthHeaders() }
    );
  }

  getSalesUserLeads(userId: number): Observable<Lead[]> {

    return this.http.get<Lead[]>(
      `${this.adminUrl}/sales-users/${userId}/leads`,
      { headers: this.getAuthHeaders() }
    );
  }

  // ==========================================
  // LEAD ASSIGNMENT
  // EXISTING API - KEEP UNCHANGED
  // ==========================================

  assignLead(
    leadId: number,
    assignedToId: number
  ): Observable<Lead> {

    return this.http.put<Lead>(
      `${this.apiUrl}/${leadId}/assign/${assignedToId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // ==========================================
  // CREATE LEAD
  // ==========================================

  createLead(request: CreateLeadRequest): Observable<Lead> {

    return this.http.post<Lead>(
      this.apiUrl,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  // ==========================================
  // OLD BULK UPLOAD API
  // ==========================================

  bulkUploadLeads(file: File): Observable<BulkUploadResponse> {

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token') || '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<BulkUploadResponse>(
      `${this.apiUrl}/import`,
      formData,
      { headers }
    );
  }

  // ==========================================
  // NOTES API METHODS
  // ==========================================

  getNotesByLeadId(leadId: number): Observable<LeadNote[]> {

    return this.http.get<LeadNote[]>(
      `${this.apiUrl}/${leadId}/notes`,
      { headers: this.getAuthHeaders() }
    );
  }

  createNote(
    leadId: number,
    content: string
  ): Observable<LeadNote> {

    const body: LeadNoteRequest = { content };

    return this.http.post<LeadNote>(
      `${this.apiUrl}/${leadId}/notes`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  updateNote(
    noteId: number,
    content: string
  ): Observable<LeadNote> {

    const body: LeadNoteRequest = { content };

    return this.http.put<LeadNote>(
      `${this.apiUrl}/notes/${noteId}`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteNote(noteId: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/notes/${noteId}`,
      { headers: this.getAuthHeaders() }
    );
  }

}
