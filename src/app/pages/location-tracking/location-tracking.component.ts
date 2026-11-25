
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../services/location.service';

@Component({
  selector: 'app-location-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-tracking.component.html',
  styleUrls: ['./location-tracking.component.css']
})
export class LocationTrackingComponent implements OnDestroy {

  isTracking = false;
  isLoading = false;

  latitude: number | null = null;
  longitude: number | null = null;
  accuracy: number | null = null;

  message = '';
  errorMessage = '';

  private watchId: number | null = null;
  private lastSentAt = 0;
  private readonly updateInterval = 30000;

  constructor(private locationService: LocationService) {}

  startTracking(): void {

    this.message = '';
    this.errorMessage = '';

    if (!navigator.geolocation) {
      this.errorMessage = 'Your browser does not support GPS location.';
      return;
    }

    if (!window.isSecureContext) {
      this.errorMessage =
        'Location tracking requires HTTPS or localhost.';
      return;
    }

    this.isLoading = true;

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {

        this.latitude = position.coords.latitude;
        this.longitude = position.coords.longitude;
        this.accuracy = position.coords.accuracy;

        this.isTracking = true;
        this.isLoading = false;

        const now = Date.now();

        if (now - this.lastSentAt >= this.updateInterval) {
          this.sendLocation();
          this.lastSentAt = now;
        }
      },
      (error) => {

        this.isLoading = false;
        this.isTracking = false;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.errorMessage = 'Location permission denied.';
            break;

          case error.POSITION_UNAVAILABLE:
            this.errorMessage = 'Location unavailable.';
            break;

          case error.TIMEOUT:
            this.errorMessage = 'Location request timed out.';
            break;

          default:
            this.errorMessage = 'Unable to get location.';
        }

        this.stopBrowserTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  private sendLocation(): void {

    if (this.latitude === null || this.longitude === null) {
      return;
    }

    this.locationService.updateLocation({
      latitude: this.latitude,
      longitude: this.longitude,
      accuracy: this.accuracy ?? 0
    }).subscribe({
      next: () => {
        this.message = 'Location updated successfully.';
      },
      error: (error) => {
        console.error('Location update error:', error);
        this.errorMessage = 'Location update failed.';
      }
    });
  }

  stopTracking(): void {

    this.stopBrowserTracking();

    this.locationService.stopTracking().subscribe({
      next: () => {
        this.isTracking = false;
        this.isLoading = false;
        this.message = 'Location tracking stopped.';
      },
      error: (error) => {
        console.error('Stop tracking error:', error);
        this.errorMessage = 'Unable to stop tracking on server.';
      }
    });
  }

  private stopBrowserTracking(): void {

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.stopBrowserTracking();
  }
}
