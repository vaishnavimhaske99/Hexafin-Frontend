import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }

    if (this.isLoading) return;

    this.isLoading = true;

    this.authService.login({
      email: this.email.trim(),
      password: this.password
    })
    .pipe(
      finalize(() => {
        this.isLoading = false;
      })
    )
    .subscribe({
      next: (response: any) => {
        const role = response.role?.trim().toUpperCase();
        console.log('LOGIN SUCCESS RESPONSE:', response);

        // 1. Data Save (फक्त एकदाच)
        localStorage.setItem('token', response.token);
        localStorage.setItem('userId', String(response.userId || response.id));
        localStorage.setItem('userName', `${response.firstName} ${response.lastName || ''}`.trim());
        localStorage.setItem('role', role); // ✅ फक्त 'role' वापर

        // 2. Role नुसार Redirect (फक्त switch मधून)
        switch (role) {
          case 'ADMIN':
            this.router.navigate(['/dashboard']);
            break;
          case 'MANAGER':
            this.router.navigate(['/manager-dashboard']);
            break;
          case 'TEAM_LEAD':
            this.router.navigate(['/team-lead-dashboard']);
            break;
          case 'SALES':
            this.router.navigate(['/user-dashboard']);
            break;
          default:
            this.authService.logout();
            this.errorMessage = 'Role not configured.';
            break;
        }
      },
      error: (error) => {
        console.error('Login failed:', error);
        if (error.status === 401 || error.status === 400) {
          this.errorMessage = 'Invalid email or password.';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to the server.';
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}