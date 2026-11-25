
import {
  Component,
  OnInit,
  OnDestroy,
  HostListener
} from '@angular/core';

import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import {
  NotificationService,
  NotificationResponse,
  NotificationPage
} from '../../services/notification.service';

type NotificationFilter = 'all' | 'unread' | 'archived';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit, OnDestroy {

  notifications: NotificationResponse[] = [];
  private allNotifications: NotificationResponse[] = [];

  unreadCount = 0;
  userId = 0;

  showDropdown = false;

  loading = false;
  refreshing = false;
  errorMessage = '';

  activeFilter: NotificationFilter = 'all';
  activeCategory = 'ALL';
  searchText = '';

  currentPage = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  private subscriptions = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  // =========================================
  // INITIALIZATION
  // =========================================

  ngOnInit(): void {

    this.loadUserId();

    if (!this.userId) {
      this.errorMessage = 'Unable to identify logged-in user.';
      return;
    }

    this.loadUnreadCount();
    this.loadNotifications();

    // AUTO REFRESH EVERY 30 SECONDS
    const pollingSubscription = interval(30000).subscribe(() => {

      // Update unread count for every logged-in role
      this.loadUnreadCount();

      // Refresh notification list when dropdown is open
      if (this.showDropdown) {
        this.loadNotifications();
      }

    });

    this.subscriptions.add(pollingSubscription);
  }

  private loadUserId(): void {

    const storedUserId =
      localStorage.getItem('crm_user_id') ||
      localStorage.getItem('userId');

    this.userId = Number(storedUserId) || 0;
  }

  // =========================================
  // LOAD NOTIFICATIONS
  // =========================================

  loadNotifications(): void {

    if (!this.userId) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    let request;

    switch (this.activeFilter) {

      case 'unread':
        request = this.notificationService.getUnreadNotifications(
          this.userId,
          this.currentPage,
          this.pageSize
        );
        break;

      case 'archived':
        request = this.notificationService.getArchivedNotifications(
          this.userId,
          this.currentPage,
          this.pageSize
        );
        break;

      default:
        request = this.notificationService.getNotifications(
          this.userId,
          this.currentPage,
          this.pageSize
        );
        break;
    }

    const sub = request.subscribe({

      next: (response: NotificationPage) => {

        this.allNotifications = response.content || [];

        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.currentPage = response.number || 0;

        this.applyLocalFilters();

        this.loading = false;
        this.refreshing = false;
      },

      error: (error) => {

        console.error('Notification loading failed:', error);

        this.errorMessage =
          error?.error?.message ||
          'Unable to load notifications. Please try again.';

        this.loading = false;
        this.refreshing = false;
      }

    });

    this.subscriptions.add(sub);
  }

  // =========================================
  // UNREAD COUNT
  // =========================================

  loadUnreadCount(): void {

    if (!this.userId) {
      return;
    }

    const sub = this.notificationService
      .getUnreadCount(this.userId)
      .subscribe({

        next: (count) => {
          this.unreadCount = Number(count) || 0;
        },

        error: (error) => {
          console.error('Unread count loading failed:', error);
        }

      });

    this.subscriptions.add(sub);
  }

  // =========================================
  // DROPDOWN
  // =========================================

  toggleDropdown(): void {

    this.showDropdown = !this.showDropdown;

    if (this.showDropdown) {

      this.currentPage = 0;

      this.loadNotifications();
      this.loadUnreadCount();
    }
  }

  // =========================================
  // FILTERS
  // =========================================

  setFilter(filter: NotificationFilter): void {

    this.activeFilter = filter;
    this.currentPage = 0;

    this.loadNotifications();
  }

  setCategory(category: string): void {

    this.activeCategory = category;
    this.applyLocalFilters();
  }

  onSearchChange(value: string): void {

    this.searchText = value || '';
    this.applyLocalFilters();
  }

  private applyLocalFilters(): void {

    let result = [...this.allNotifications];

    if (this.activeCategory !== 'ALL') {

      result = result.filter(notification =>
        notification.category?.toUpperCase() ===
        this.activeCategory.toUpperCase()
      );
    }

    const search = this.searchText.trim().toLowerCase();

    if (search) {

      result = result.filter(notification => {

        return (
          notification.title?.toLowerCase().includes(search) ||
          notification.message?.toLowerCase().includes(search) ||
          notification.category?.toLowerCase().includes(search) ||
          notification.type?.toLowerCase().includes(search) ||
          notification.actorName?.toLowerCase().includes(search)
        );

      });
    }

    this.notifications = result;
  }

  // =========================================
  // PAGINATION
  // =========================================

  nextPage(): void {

    if (this.currentPage + 1 < this.totalPages) {

      this.currentPage++;
      this.loadNotifications();
    }
  }

  previousPage(): void {

    if (this.currentPage > 0) {

      this.currentPage--;
      this.loadNotifications();
    }
  }

  // =========================================
  // REFRESH
  // =========================================

  refreshNotifications(): void {

    this.refreshing = true;

    this.loadNotifications();
    this.loadUnreadCount();
  }

  // =========================================
  // MARK AS READ
  // =========================================

  markAsRead(notification: NotificationResponse): void {

    if (notification.isRead || !this.userId) {
      return;
    }

    const sub = this.notificationService
      .markAsRead(notification.id, this.userId)
      .subscribe({

        next: (updated) => {

          notification.isRead = updated.isRead;

          this.loadUnreadCount();
          this.applyLocalFilters();
        },

        error: (error) => {
          console.error('Mark as read failed:', error);
        }

      });

    this.subscriptions.add(sub);
  }

  // =========================================
  // MARK ALL AS READ
  // =========================================

  markAllAsRead(): void {

    if (!this.userId || this.unreadCount === 0) {
      return;
    }

    const sub = this.notificationService
      .markAllAsRead(this.userId)
      .subscribe({

        next: () => {

          this.allNotifications.forEach(notification => {
            notification.isRead = true;
          });

          this.unreadCount = 0;

          this.applyLocalFilters();
        },

        error: (error) => {
          console.error('Mark all as read failed:', error);
        }

      });

    this.subscriptions.add(sub);
  }

  // =========================================
  // ARCHIVE
  // =========================================

  archiveNotification(
    event: Event,
    notification: NotificationResponse
  ): void {

    event.stopPropagation();

    if (!this.userId) {
      return;
    }

    const sub = this.notificationService
      .archiveNotification(notification.id, this.userId)
      .subscribe({

        next: () => {

          this.allNotifications =
            this.allNotifications.filter(
              item => item.id !== notification.id
            );

          this.applyLocalFilters();
          this.loadUnreadCount();
        },

        error: (error) => {
          console.error('Archive failed:', error);
        }

      });

    this.subscriptions.add(sub);
  }

  // =========================================
  // NOTIFICATION NAVIGATION
  // =========================================

  private getNotificationUrl(
    notification: NotificationResponse
  ): string | null {

    // Backend actionUrl has first priority
    if (notification.actionUrl) {

      const url = notification.actionUrl.trim();

      if (url.startsWith('/') && !url.startsWith('//')) {
        return url;
      }
    }

    switch (notification.type) {

      case 'LEAD_ASSIGNED':
      case 'LEAD_UPDATED':
      case 'LEAD_STATUS_CHANGED':
      case 'LEAD_FOLLOW_UP':

        if (notification.referenceId) {
          return `/leads/${notification.referenceId}`;
        }

        break;

      case 'CHAT_MESSAGE':
        return '/chat';

      case 'LIVE_LOCATION_STARTED':
      case 'LIVE_LOCATION_STOPPED':

        if (notification.referenceId) {
          return `/users/${notification.referenceId}/profile`;
        }

        break;

      default:
        return null;
    }

    return null;
  }

  // =========================================
  // OPEN NOTIFICATION
  // =========================================

  openNotification(notification: NotificationResponse): void {

    const destination = this.getNotificationUrl(notification);

    this.showDropdown = false;

    if (notification.isRead) {

      if (destination) {
        this.router.navigateByUrl(destination);
      }

      return;
    }

    const sub = this.notificationService
      .markAsRead(notification.id, this.userId)
      .subscribe({

        next: (updated) => {

          notification.isRead = updated.isRead;

          this.loadUnreadCount();

          if (destination) {
            this.router.navigateByUrl(destination);
          } else {
            console.warn(
              'No navigation URL configured:',
              notification.type
            );
          }
        },

        error: (error) => {

          console.error('Mark as read failed:', error);

          if (destination) {
            this.router.navigateByUrl(destination);
          }
        }

      });

    this.subscriptions.add(sub);
  }

  // =========================================
  // CLOSE DROPDOWN
  // =========================================

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event): void {

    const target = event.target as HTMLElement;

    if (!target.closest('.notification-wrapper')) {
      this.showDropdown = false;
    }
  }

  // =========================================
  // CLEANUP
  // =========================================

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
