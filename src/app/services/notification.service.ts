
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificationResponse {
  id: number;
  actorId?: number;
  actorName?: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  referenceType?: string;
  referenceId?: number;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  isArchived: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationPage {
  content: NotificationResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private apiUrl = 'http://localhost:8080/api/notifications';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('crm_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt');

    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  // Get all notifications
  getNotifications(
    userId: number,
    page: number = 0,
    size: number = 20
  ): Observable<NotificationPage> {

    const params = new HttpParams()
      .set('userId', userId)
      .set('page', page)
      .set('size', size);

    return this.http.get<NotificationPage>(this.apiUrl, {
      headers: this.getHeaders(),
      params
    });
  }

  // Get unread notifications
  getUnreadNotifications(
    userId: number,
    page: number = 0,
    size: number = 20
  ): Observable<NotificationPage> {

    const params = new HttpParams()
      .set('userId', userId)
      .set('page', page)
      .set('size', size);

    return this.http.get<NotificationPage>(
      `${this.apiUrl}/unread`,
      { headers: this.getHeaders(), params }
    );
  }

  // Get unread count
  getUnreadCount(userId: number): Observable<number> {

    const params = new HttpParams().set('userId', userId);

    return this.http.get<number>(
      `${this.apiUrl}/unread/count`,
      { headers: this.getHeaders(), params }
    );
  }

  // Get notifications by category
  getNotificationsByCategory(
    userId: number,
    category: string,
    page: number = 0,
    size: number = 20
  ): Observable<NotificationPage> {

    const params = new HttpParams()
      .set('userId', userId)
      .set('page', page)
      .set('size', size);

    return this.http.get<NotificationPage>(
      `${this.apiUrl}/category/${category}`,
      { headers: this.getHeaders(), params }
    );
  }

  // Mark one notification as read
  markAsRead(
    notificationId: number,
    userId: number
  ): Observable<NotificationResponse> {

    const params = new HttpParams().set('userId', userId);

    return this.http.put<NotificationResponse>(
      `${this.apiUrl}/${notificationId}/read`,
      {},
      { headers: this.getHeaders(), params }
    );
  }

  // Mark all as read
  markAllAsRead(userId: number): Observable<number> {

    const params = new HttpParams().set('userId', userId);

    return this.http.put<number>(
      `${this.apiUrl}/read-all`,
      {},
      { headers: this.getHeaders(), params }
    );
  }

  // Archive notification
  archiveNotification(
    notificationId: number,
    userId: number
  ): Observable<void> {

    const params = new HttpParams().set('userId', userId);

    return this.http.put<void>(
      `${this.apiUrl}/${notificationId}/archive`,
      {},
      { headers: this.getHeaders(), params }
    );
  }

  // Get archived notifications
  getArchivedNotifications(
    userId: number,
    page: number = 0,
    size: number = 20
  ): Observable<NotificationPage> {

    const params = new HttpParams()
      .set('userId', userId)
      .set('page', page)
      .set('size', size);

    return this.http.get<NotificationPage>(
      `${this.apiUrl}/archived`,
      { headers: this.getHeaders(), params }
    );
  }
}
