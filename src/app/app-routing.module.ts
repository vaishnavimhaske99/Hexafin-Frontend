import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LeadsComponent } from './pages/leads/leads.component';
import { AddLeadComponent } from './pages/leads/add-lead/add-lead.component';
import { BulkUploadComponent } from './pages/leads/bulk-upload/bulk-upload.component';
import { LeadProfileComponent } from './pages/leads/lead-profile/lead-profile.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { UserLayoutComponent } from './layout/user-layout/user-layout.component';
import { ManagerLayoutComponent } from './layout/manager-layout/manager-layout.component';
import { TeamLeadLayoutComponent } from './layout/team-lead-layout/team-lead-layout.component';

import { ManagerDashboardComponent } from './pages/manager-dashboard/manager-dashboard.component';
import { TeamLeadDashboardComponent } from './pages/team-lead-dashboard/team-lead-dashboard.component';
import { MyLeadsComponent } from './pages/my-leads/my-leads.component';
import { SalesUsersComponent } from './pages/sales-users/sales-users.component';
import { MyOrganizationComponent } from './pages/my-organization/my-organization.component';

import { authGuard } from './guards/auth.guard';
import { canMatchRole } from './guards/role.guard';       // ✅ canMatchRole import
import { CustomersComponent } from './pages/customers/customers.component';
import { CustomerProfileComponent } from './pages/customers/customer-profile/customer-profile.component';

const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Public
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },

  // ✅ 1. ADMIN
  {
    path: '',
    component: MainLayoutComponent,
    canMatch: [canMatchRole(['ADMIN'])],                   // ✅ canActivate नाही
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'my-organization', component: MyOrganizationComponent },
      { path: 'sales-users', component: SalesUsersComponent },
      { path: 'leads', component: LeadsComponent },
      { path: 'leads/add', component: AddLeadComponent },
      { path: 'leads/bulk-upload', component: BulkUploadComponent },
      { path: 'users/:userId/profile', component: UserProfileComponent },
      { path: 'sales-user-dashboard/:userId', component: UserDashboardComponent },
      { path: 'leads/:id', component: LeadProfileComponent },
        { path: 'customers', component: CustomersComponent },
    { path: 'customers/:id', component: CustomerProfileComponent },
    ]
  },

  // ✅ 2. MANAGER
  {
    path: '',
    component: ManagerLayoutComponent,
    canMatch: [canMatchRole(['MANAGER'])],
    children: [
      { path: 'manager-dashboard', component: ManagerDashboardComponent },
      { path: 'my-organization', component: MyOrganizationComponent },
      { path: 'users/:userId/profile', component: UserProfileComponent },
      { path: 'sales-user-dashboard/:userId', component: UserDashboardComponent },
      { path: 'leads', component: LeadsComponent },
      { path: 'leads/:id', component: LeadProfileComponent },
        { path: 'customers', component: CustomersComponent },
    { path: 'customers/:id', component: CustomerProfileComponent },
    ]
  },

  // ✅ 3. TEAM_LEAD
  {
    path: '',
    component: TeamLeadLayoutComponent,
    canMatch: [canMatchRole(['TEAM_LEAD'])],
    children: [
      { path: 'team-lead-dashboard', component: TeamLeadDashboardComponent },
      { path: 'dashboard', redirectTo: 'team-lead-dashboard', pathMatch: 'full' },
      { path: 'my-organization', component: MyOrganizationComponent },
      { path: 'sales-user-dashboard/:userId', component: UserDashboardComponent },
      { path: 'users/:userId/profile', component: UserProfileComponent },
      { path: 'leads', component: LeadsComponent },
                 
    { path: 'leads/:id', component: LeadProfileComponent },   // ✅
    { path: 'customers', component: CustomersComponent },     // ✅
    { path: 'customers/:id', component: CustomerProfileComponent }, // ✅
      { path: 'leads/:id', component: LeadProfileComponent },
        { path: 'customers', component: CustomersComponent },
    { path: 'customers/:id', component: CustomerProfileComponent },
     { path: 'sales-user-leads/:userId', component: MyLeadsComponent },
    ]
  },

  // ✅ 4. SALES
  {
    path: '',
    component: UserLayoutComponent,
    canMatch: [canMatchRole(['SALES'])],
    children: [
      { path: 'user-dashboard', component: UserDashboardComponent },
      { path: 'user-profile', component: UserProfileComponent },
      { path: 'my-leads', component: MyLeadsComponent },
      { path: 'my-leads/:id', component: LeadProfileComponent },
        { path: 'customers', component: CustomersComponent },
    { path: 'customers/:id', component: CustomerProfileComponent },
    
    ]
  },

  // Fallback
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}