
import { Component, OnInit } from '@angular/core';
import {
  CommunicationService,
  Announcement,
  AnnouncementRequest
} from '../../services/communication.service';

@Component({
  selector: 'app-announcements',
  templateUrl: './announcements.component.html',
  styleUrls: ['./announcements.component.css']
})
export class AnnouncementsComponent implements OnInit {

  announcements: Announcement[] = [];

  isAdmin = false;
  title = '';
  message = '';

  loading = false;
  creating = false;
  errorMessage = '';
  successMessage = '';

  constructor(private communicationService: CommunicationService) {}

 ngOnInit(): void {
  const role = localStorage.getItem('crm_role');

  this.isAdmin = role?.toUpperCase() === 'ADMIN';

  console.log('Announcement User Role:', role);
  console.log('Is Admin:', this.isAdmin);

  this.loadAnnouncements();
}

  loadAnnouncements(): void {
    this.loading = true;
    this.errorMessage = '';

    this.communicationService.getMyAnnouncements().subscribe({
      next: (response) => {
        this.announcements = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        this.errorMessage = 'Unable to load announcements.';
        this.loading = false;
      }
    });
  }

  createAnnouncement(): void {
    if (!this.title.trim() || !this.message.trim() || this.creating) {
      return;
    }

    const request: AnnouncementRequest = {
      title: this.title.trim(),
      message: this.message.trim()
    };

    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.communicationService.createAnnouncement(request).subscribe({
      next: () => {
        this.title = '';
        this.message = '';
        this.creating = false;
        this.successMessage = 'Announcement broadcast successfully!';
        this.loadAnnouncements();
      },
      error: (error) => {
        console.error('Error creating announcement:', error);
        this.errorMessage = 'Unable to create announcement.';
        this.creating = false;
      }
    });
  }

  markAsRead(announcement: Announcement): void {
    if (announcement.read) {
      return;
    }

    this.communicationService.markAnnouncementAsRead(announcement.id).subscribe({
      next: () => {
        announcement.read = true;
        announcement.readAt = new Date().toISOString();
      },
      error: (error) => {
        console.error('Error marking announcement as read:', error);
      }
    });
  }
}
