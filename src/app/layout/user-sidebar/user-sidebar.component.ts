
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-sidebar',
  templateUrl: './user-sidebar.component.html',
  styleUrls: ['./user-sidebar.component.css']
})
export class UserSidebarComponent {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  isActive(path: string): boolean {
    return this.router.url === path ||
      this.router.url.startsWith(path + '/');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
