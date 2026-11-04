import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-manager-sidebar',
  templateUrl: './manager-sidebar.component.html',
  styleUrls: ['./manager-sidebar.component.css']
})
export class ManagerSidebarComponent {

  userName = '';
  userEmail = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.userName = this.authService.getUserName() || 'Manager';
    this.userEmail = localStorage.getItem('email') || 'manager@crm.com';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}