
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserResponseDTO } from './user.service';

// =====================================
// ANNOUNCEMENT INTERFACES
// =====================================

export interface AnnouncementRequest {
  title: string;
  message: string;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
  read: boolean;
  readAt: string | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// =====================================
// CHAT INTERFACES
// =====================================

export interface ChatMessageRequest {
  receiverId: number;
  message: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  message: string;
  sentAt: string;
  isRead: boolean;
  readAt: string | null;
}

export interface Conversation {
  id: number;
  participantId: number;
  participantName: string;
  participantRole: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// =====================================
// COMMUNICATION SERVICE
// =====================================

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {

  private readonly apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // =====================================
  // AUTH HEADERS
  // =====================================

  private getAuthHeaders(): HttpHeaders {

    const token = localStorage.getItem('token') || '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // =====================================
  // ANNOUNCEMENT APIs
  // =====================================

  createAnnouncement(
    request: AnnouncementRequest
  ): Observable<Announcement> {

    return this.http.post<Announcement>(
      `${this.apiUrl}/announcements`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  getMyAnnouncements(): Observable<Announcement[]> {

    return this.http.get<Announcement[]>(
      `${this.apiUrl}/announcements`,
      { headers: this.getAuthHeaders() }
    );
  }

  markAnnouncementAsRead(
    announcementId: number
  ): Observable<any> {

    return this.http.put(
      `${this.apiUrl}/announcements/${announcementId}/read`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  getAnnouncementUnreadCount(): Observable<UnreadCountResponse> {

    return this.http.get<UnreadCountResponse>(
      `${this.apiUrl}/announcements/unread-count`,
      { headers: this.getAuthHeaders() }
    );
  }

  // =====================================
  // PRIVATE CHAT APIs
  // =====================================

  // Send Message

  sendMessage(
    request: ChatMessageRequest
  ): Observable<ChatMessage> {

    return this.http.post<ChatMessage>(
      `${this.apiUrl}/chat/send`,
      request,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get Conversations

  getMyConversations(): Observable<Conversation[]> {

    return this.http.get<Conversation[]>(
      `${this.apiUrl}/chat/conversations`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get Latest 30 Messages

  getMessages(
    conversationId: number
  ): Observable<ChatMessage[]> {

    return this.http.get<ChatMessage[]>(
      `${this.apiUrl}/chat/conversations/${conversationId}/messages`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Get Older Messages

  getOlderMessages(
    conversationId: number,
    lastMessageId: number
  ): Observable<ChatMessage[]> {

    return this.http.get<ChatMessage[]>(
      `${this.apiUrl}/chat/conversations/${conversationId}/messages/older`,
      {
        headers: this.getAuthHeaders(),
        params: {
          lastMessageId: lastMessageId.toString()
        }
      }
    );
  }

  // Get Available Active Users

  getAvailableUsers(): Observable<UserResponseDTO[]> {

    return this.http.get<UserResponseDTO[]>(
      `${this.apiUrl}/chat/available-users`,
      { headers: this.getAuthHeaders() }
    );
  }

  // Mark Conversation Messages As Read

  markMessagesAsRead(
    conversationId: number
  ): Observable<string> {

    return this.http.put(
      `${this.apiUrl}/chat/conversations/${conversationId}/read`,
      {},
      {
        headers: this.getAuthHeaders(),
        responseType: 'text'
      }
    );
  }

}
