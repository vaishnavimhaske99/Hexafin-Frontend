import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export type LoanProductType =
  | 'HOME_LOAN'
  | 'PERSONAL_LOAN'
  | 'BUSINESS_LOAN'
  | 'LOAN_AGAINST_PROPERTY'
  | 'CAR_LOAN'
  | 'LOAN_AGAINST_SECURITIES';

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

export interface SalesUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: string;
  assignedLeadCount: number;
}

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

export interface BulkUploadResponse {
  totalRows: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
}

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

// ✅ Activity Request साठी interface
export interface CreateActivityRequest {
  type: 'CALL' | 'WHATSAPP' | 'EMAIL' | 'TEXT' | 'MEETING' | 'OTHER';
  description: string;
  activityDateTime?: string; // Optional
}

// ✅ NOTES INTERFACES (नवीन)
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


@Injectable({
  providedIn: 'root'
})
export class LeadService {

  private readonly apiUrl = 'http://localhost:8080/api/leads';
  private readonly adminUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient,
    
  ) {}
  // ==========================================
  // ✅ ACTIVITY API METHODS
  // ==========================================

  // 1. नवीन ॲक्टिव्हिटी तयार करण्यासाठी
  createActivity(leadId: number, request: CreateActivityRequest): Observable<LeadActivity> {
    return this.http.post<LeadActivity>(
      `${this.apiUrl}/${leadId}/activities`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

 
  updateActivity(activityId: number, request: CreateActivityRequest): Observable<LeadActivity> {
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
    `http://localhost:8080/api/leads/assigned-to/${userId}`,
    { headers: this.getAuthHeaders() }
  );
}
  // 3. ॲक्टिव्हिटी डिलीट करण्यासाठी
  deleteActivity(activityId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/activities/${activityId}`,
      { headers: this.getAuthHeaders() }
    );
  }
  // 🔥 JWT Token Header
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

// ✅ 1. Lead चा Status बदलण्यासाठी
updateLeadStatus(leadId: number, status: string): Observable<any> {
  return this.http.put<any>(                 // ← put → patch
    `${this.apiUrl}/${leadId}/status`,
    { status: status },
    { headers: this.getAuthHeaders() }
  );
}


// ✅ 2. Lead ची Status History
getStatusHistory(leadId: number): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.apiUrl}/${leadId}/status-history`,
    { headers: this.getAuthHeaders() }
  );
}


  // =========================================
  // GET — Sales User चे स्वतःचे Leads
  // =========================================
  getMyLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>(
      `${this.apiUrl}/my-leads`,
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // GET — Admin/Manager/Team Lead: Sales User चे Leads
  // =========================================
  getLeadsBySalesUser(userId: number): Observable<Lead[]> {
    return this.http.get<Lead[]>(
      `${this.apiUrl}/sales-user/${userId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // GET — सगळे Leads
  // =========================================
  getAllLeads(): Observable<Lead[]> {
    return this.http.get<Lead[]>(
      this.apiUrl,
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // GET — एक Lead
  // =========================================
  getLeadById(id: number): Observable<Lead> {
    return this.http.get<Lead>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // GET — Lead Activities
  // =========================================
  getActivitiesByLeadId(leadId: number): Observable<LeadActivity[]> {
    return this.http.get<LeadActivity[]>(
      `${this.apiUrl}/${leadId}/activities`,
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // GET — Sales Users List (Admin)
  // =========================================
  getSalesUsers(): Observable<SalesUser[]> {
    return this.http.get<SalesUser[]>(
      `${this.adminUrl}/sales-users`,
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // GET — Sales User चे Leads (Admin API)
  // =========================================
  getSalesUserLeads(userId: number): Observable<Lead[]> {
    return this.http.get<Lead[]>(
      `${this.adminUrl}/sales-users/${userId}/leads`,
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // PUT — Lead Assign
  // =========================================
  assignLead(leadId: number, assignedToId: number): Observable<Lead> {
    return this.http.put<Lead>(
      `${this.apiUrl}/${leadId}/assign/${assignedToId}`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // POST — Create Lead
  // =========================================
  createLead(request: CreateLeadRequest): Observable<Lead> {
    return this.http.post<Lead>(
      this.apiUrl,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  // =========================================
  // POST — Bulk Upload Leads
  // =========================================
  bulkUploadLeads(file: File): Observable<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<BulkUploadResponse>(
      `${this.apiUrl}/import`,
      formData,
      { headers }
    );
  }

  // =========================================
  // ✅ NOTES API METHODS (नवीन ॲड केलेले)
  // =========================================

  // 1. सगळ्या नोट्स आणण्यासाठी
  getNotesByLeadId(leadId: number): Observable<LeadNote[]> {
    return this.http.get<LeadNote[]>(
      `${this.apiUrl}/${leadId}/notes`,
      { headers: this.getAuthHeaders() }
    );
  }

  // 2. नवीन नोट तयार करण्यासाठी
  createNote(leadId: number, content: string): Observable<LeadNote> {
    const body: LeadNoteRequest = { content };
    return this.http.post<LeadNote>(
      `${this.apiUrl}/${leadId}/notes`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  // 3. नोट अपडेट करण्यासाठी
  updateNote(noteId: number, content: string): Observable<LeadNote> {
    const body: LeadNoteRequest = { content };
    return this.http.put<LeadNote>(
      `${this.apiUrl}/notes/${noteId}`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  // 4. नोट डिलीट करण्यासाठी
  deleteNote(noteId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/notes/${noteId}`,
      { headers: this.getAuthHeaders() }
    );
  }
  
}