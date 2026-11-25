
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface UserLocation {
  userId: number;
  userName: string;
  role: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  tracking: boolean;
  recordedAt: string;
}

@Component({
  selector: 'app-admin-location-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-location-dashboard.component.html',
  styleUrls: ['./admin-location-dashboard.component.css']
})
export class AdminLocationDashboardComponent implements OnInit, OnDestroy {

  locations: UserLocation[] = [];
  filteredLocations: UserLocation[] = [];

  selectedRole = 'ALL';
  loading = false;
  errorMessage = '';

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

private readonly apiUrl = 'https://api.hexafin.cloud/api/locations/all';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadLocations();

    // Refresh every 30 seconds
    this.refreshTimer = setInterval(() => {
      this.loadLocations();
    }, 30000);
  }

  loadLocations(): void {
    this.loading = true;
    this.errorMessage = '';

    const token =
      localStorage.getItem('crm_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') || '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<UserLocation[]>(this.apiUrl, { headers }).subscribe({
      next: (data) => {
        this.locations = data || [];
        this.applyRoleFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Location loading error:', error);
        this.errorMessage = 'Unable to load user locations.';
        this.loading = false;
      }
    });
  }

  applyRoleFilter(): void {
    if (this.selectedRole === 'ALL') {
      this.filteredLocations = this.locations;
    } else {
      this.filteredLocations = this.locations.filter(
        location => location.role === this.selectedRole
      );
    }
  }

  onRoleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedRole = select.value;
    this.applyRoleFilter();
  }

  get activeCount(): number {
    return this.locations.filter(location => location.tracking).length;
  }

  get stoppedCount(): number {
    return this.locations.filter(location => !location.tracking).length;
  }

  openMap(latitude: number, longitude: number): void {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  }

  ngOnDestroy(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
    }
  }
}
