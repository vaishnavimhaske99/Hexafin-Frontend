
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface SalesUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  status: string;
  role?: string | {
    name?: string;
    roleName?: string;
  };
  roleName?: string;
}

@Component({
  selector: 'app-sales-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-users.component.html',
  styleUrls: ['./sales-users.component.css']
})
export class SalesUsersComponent implements OnInit {

  salesUsers: SalesUser[] = [];
  isLoading = false;
  errorMessage = '';
  searchText = '';
  selectedStatus = 'ALL';

  private readonly usersUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient,
     private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSalesUsers();
  }

  loadSalesUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<SalesUser[]>(this.usersUrl).subscribe({
      next: (users) => {
        this.salesUsers = (users || []).filter(
          user => this.getRoleName(user) === 'SALES'
        );
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Sales Users API error:', error);
        this.salesUsers = [];
        this.errorMessage =
          'Sales Users load झाले नाहीत. Users API तपासा.';
        this.isLoading = false;
      }
    });
  }

  getRoleName(user: SalesUser): string {
    const role = user.role;

    const name =
      typeof role === 'string'
        ? role
        : role?.name ||
          role?.roleName ||
          user.roleName ||
          '';

    return name.toUpperCase();
  }

  openSalesUserDashboard(userId: number): void {
  this.router.navigate(['/sales-user-dashboard', userId]);
}
  get filteredSalesUsers(): SalesUser[] {
    const search = this.searchText.trim().toLowerCase();

    return this.salesUsers.filter(user => {
      const matchesSearch =
        !search ||
        `${user.firstName || ''} ${user.lastName || ''}`
          .toLowerCase().includes(search) ||
        (user.email || '').toLowerCase().includes(search) ||
        (user.mobile || '').includes(search) ||
        String(user.id).includes(search);

      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        (user.status || '').toUpperCase() === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }
}
