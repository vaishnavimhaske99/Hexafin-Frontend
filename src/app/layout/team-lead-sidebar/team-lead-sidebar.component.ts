import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-team-lead-sidebar',
  templateUrl: './team-lead-sidebar.component.html',
  styleUrls: ['./team-lead-sidebar.component.css']
})
export class TeamLeadSidebarComponent {

  constructor(private router: Router) {}

  logout(): void {
    // ✅ LocalStorage Clear कर
    localStorage.clear();
    // ✅ Login Page वर पाठव
    this.router.navigate(['/login']);
  }
}