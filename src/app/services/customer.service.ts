import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ═══════════════════════════════════════════════════════════
// REQUEST
// ═══════════════════════════════════════════════════════════
export interface CustomerRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;

  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  photoUrl?: string;
  permanentAddress?: string;

  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  employmentType?: string;
  companyName?: string;
  designation?: string;
  experienceYears?: number;
  itrFiled?: boolean;

  loanType?: string;
  loanPurpose?: string;
  loanAmount?: number;
  tenureMonths?: number;
  interestRate?: number;

  monthlyIncome?: number;
  propertyValue?: number;
  existingEmi?: number;
  cibilScore?: number;
  otherIncome?: number;
  expectedEmi?: number;
  downPayment?: number;

  previousLoanTaken?: boolean;
  previousLoanType?: string;
  previousLoanLender?: string;
  previousLoanAmount?: number;
  previousLoanEmi?: number;
  previousLoanTenure?: number;
  previousLoanReason?: string;
  previousLoanStatus?: string;
  previousRepaymentHistory?: string;

  urgency?: string;

  docPanCard?: boolean;
  docAadhaarCard?: boolean;
  docSalarySlips?: boolean;
  docBankStatement?: boolean;
  docItr?: boolean;
  docPropertyPapers?: boolean;
  docPhoto?: boolean;

  bankName?: string;
  accountNumber?: string;
  loanStatus?: string;

  leadSource?: string;
  notes?: string;
  nextFollowUp?: string;
}

// ═══════════════════════════════════════════════════════════
// RESPONSE
// ═══════════════════════════════════════════════════════════
export interface Customer extends CustomerRequest {
  id: number;
  annualIncome?: number;
  sourceLeadId?: number;
  sourceLeadName?: string;
  createdById?: number;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;

  // Document URLs
  panCardUrl?: string;
  aadhaarCardUrl?: string;
  salarySlipsUrl?: string;
  bankStatementUrl?: string;
  itrUrl?: string;
  propertyPapersUrl?: string;
  photoDocUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {

  private readonly apiUrl = 'http://localhost:8080/api/customers';

  constructor(private http: HttpClient) {}

  // ── JSON headers (only for JSON requests) ──
  private getJsonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json'
    });
  }

  // ── Auth only (for multipart / download) ──
  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    });
  }

  // ═══════════════ CRUD ═══════════════

  convertLeadToCustomer(leadId: number, request: CustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(
      `${this.apiUrl}/convert/${leadId}`,
      request,
      { headers: this.getJsonHeaders() }
    );
  }

  updateCustomer(id: number, request: CustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(
      `${this.apiUrl}/${id}`,
      request,
      { headers: this.getJsonHeaders() }
    );
  }

  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(
      this.apiUrl,
      { headers: this.getJsonHeaders() }
    );
  }

  getCustomerById(id: number): Observable<Customer> {
    return this.http.get<Customer>(
      `${this.apiUrl}/${id}`,
      { headers: this.getJsonHeaders() }
    );
  }

  // ═══════════════ DOCUMENTS ═══════════════

  uploadDocument(customerId: number, docType: string, file: File): Observable<Customer> {
    const formData = new FormData();
    formData.append('file', file);

    // ⚠️ Fakt Authorization — Content-Type set karu NAKA
    return this.http.post<Customer>(
      `${this.apiUrl}/${customerId}/documents/${docType}`,
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteDocument(customerId: number, docType: string): Observable<Customer> {
    return this.http.delete<Customer>(
      `${this.apiUrl}/${customerId}/documents/${docType}`,
      { headers: this.getJsonHeaders() }
    );
  }

  downloadDocument(customerId: number, docType: string, fileName: string): void {
    this.http.get(
      `${this.apiUrl}/${customerId}/documents/${docType}/download`,
      {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      }
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `${docType}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Download failed:', err);
        alert('Download failed. File kayam asel ka te check kara.');
      }
    });
  }
}