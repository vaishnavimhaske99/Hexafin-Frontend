
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
  accuracy: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  private readonly apiUrl = 'https://api.hexafin.cloud/api/locations';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token =
      localStorage.getItem('crm_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      '';

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  updateLocation(
    location: LocationUpdateRequest
  ): Observable<string> {

    return this.http.post(
      `${this.apiUrl}/update`,
      location,
      {
        headers: this.getHeaders(),
        responseType: 'text'
      }
    );
  }

  stopTracking(): Observable<string> {

    return this.http.post(
      `${this.apiUrl}/stop`,
      {},
      {
        headers: this.getHeaders(),
        responseType: 'text'
      }
    );
  }
}
