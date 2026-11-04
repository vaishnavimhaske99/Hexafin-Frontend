
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  firstName = '';
  lastName = '';
  email = '';
  mobile = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSignup(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.email.trim() ||
      !this.mobile.trim() ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (!/^\d{10}$/.test(this.mobile.trim())) {
      this.errorMessage = 'Mobile number must contain 10 digits.';
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage =
        'Password must contain at least 8 characters.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
next: (response: { message: any; }) => {
  alert(response.message);
  this.router.navigate(['/login']);
}
    this.authService.signup({
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      mobile: this.mobile.trim(),
      password: this.password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage =
          response.message || 'Account created successfully.';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },

      error: (error) => {
        this.isLoading = false;

        if (error.status === 0) {
          this.errorMessage =
            'Cannot connect to server. Please check the backend and CORS settings.';
        } else if (error.status === 400 || error.status === 409) {
          this.errorMessage =
            error.error?.message ||
            'Invalid registration details or account already exists.';
        } else {
          this.errorMessage =
            error.error?.message ||
            'Registration failed. Please try again.';
        }
      }
    });
  }
}
