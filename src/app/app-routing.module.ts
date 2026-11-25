
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

import { CustomersComponent } from './pages/customers/customers.component';
import { CustomerProfileComponent } from './pages/customers/customer-profile/customer-profile.component';
import { TodaysActionsComponent } from './pages/todays-actions/todays-actions.component';

import { authGuard } from './guards/auth.guard';
import { canMatchRole } from './guards/role.guard';
import { AnnouncementsComponent } from './pages/announcements/announcements.component';
import { ChatComponent } from './pages/chat/chat.component';
import { LocationTrackingComponent } from './pages/location-tracking/location-tracking.component';
import { AdminLocationDashboardComponent } from './pages/admin-location-dashboard/admin-location-dashboard.component';

const routes: Routes = [

  // Default Route
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // Public Routes
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'signup',
    component: SignupComponent
  },

  // =====================================
  // ADMIN ROUTES
  // =====================================
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    canMatch: [canMatchRole(['ADMIN'])],

    children: [
      { path: 'announcements', component: AnnouncementsComponent },
    { path: 'location-tracking', component: AdminLocationDashboardComponent },
{ path: 'chat', component: ChatComponent },

      { path: 'dashboard', component: DashboardComponent },

      { path: 'my-organization', component: MyOrganizationComponent },

      { path: 'sales-users', component: SalesUsersComponent },

      // Leads
     // Leads
{ path: 'leads', component: LeadsComponent },
{ path: 'leads/all', component: LeadsComponent },
{ path: 'leads/assigned', component: LeadsComponent },
{ path: 'leads/unassigned', component: LeadsComponent },
{ path: 'leads/products', component: LeadsComponent },
{ path: 'leads/product/:product', component: LeadsComponent },
{ path: 'leads/add', component: AddLeadComponent },
{ path: 'leads/bulk-upload', component: BulkUploadComponent },
{ path: 'leads/:id', component: LeadProfileComponent },

      // User
      { path: 'users/:userId/profile', component: UserProfileComponent },
      { path: 'sales-user-dashboard/:userId', component: UserDashboardComponent },

      // Today's Actions
      { path: 'todays-actions', component: TodaysActionsComponent },

      // Customers
      { path: 'customers', component: CustomersComponent },
      { path: 'customers/:id', component: CustomerProfileComponent }

    ]
  },

  // =====================================
  // MANAGER ROUTES
  // =====================================
  {
    path: '',
    component: ManagerLayoutComponent,
    canActivate: [authGuard],
    canMatch: [canMatchRole(['MANAGER'])],

    children: [

      { path: 'manager-dashboard', component: ManagerDashboardComponent },

      { path: 'my-organization', component: MyOrganizationComponent },

      // Leads
    // Leads
{ path: 'leads', component: LeadsComponent },
{ path: 'leads/all', component: LeadsComponent },
{ path: 'leads/assigned', component: LeadsComponent },
{ path: 'leads/unassigned', component: LeadsComponent },
{ path: 'leads/products', component: LeadsComponent },
{ path: 'leads/product/:product', component: LeadsComponent },
{ path: 'leads/:id', component: LeadProfileComponent },

      // User
      { path: 'users/:userId/profile', component: UserProfileComponent },
      { path: 'sales-user-dashboard/:userId', component: UserDashboardComponent },

      // Customers
      { path: 'customers', component: CustomersComponent },
      { path: 'customers/:id', component: CustomerProfileComponent }

    ]
  },

  // =====================================
  // TEAM LEAD ROUTES
  // =====================================
  {
    path: '',
    component: TeamLeadLayoutComponent,
    canActivate: [authGuard],
    canMatch: [canMatchRole(['TEAM_LEAD'])],

    children: [

      { path: 'team-lead-dashboard', component: TeamLeadDashboardComponent },

      {
        path: 'dashboard',
        redirectTo: 'team-lead-dashboard',
        pathMatch: 'full'
      },

      { path: 'my-organization', component: MyOrganizationComponent },

      // Leads
     // Leads
{ path: 'leads', component: LeadsComponent },
{ path: 'leads/all', component: LeadsComponent },
{ path: 'leads/assigned', component: LeadsComponent },
{ path: 'leads/unassigned', component: LeadsComponent },
{ path: 'leads/products', component: LeadsComponent },
{ path: 'leads/product/:product', component: LeadsComponent },
{ path: 'leads/:id', component: LeadProfileComponent },

      // User
      { path: 'sales-user-dashboard/:userId', component: UserDashboardComponent },
      { path: 'users/:userId/profile', component: UserProfileComponent },

      // Sales Leads
      { path: 'sales-user-leads/:userId', component: MyLeadsComponent },

      // Customers
      { path: 'customers', component: CustomersComponent },
      { path: 'customers/:id', component: CustomerProfileComponent }

    ]
  },

  // =====================================
  // SALES ROUTES
  // =====================================
  {
    path: '',
    component: UserLayoutComponent,
    canActivate: [authGuard],
    canMatch: [canMatchRole(['SALES'])],

    children: [
{ path: 'announcements', component: AnnouncementsComponent },
{ path: 'chat', component: ChatComponent },
{ path: 'location-tracking', component: LocationTrackingComponent },
      { path: 'user-dashboard', component: UserDashboardComponent },

      { path: 'user-profile', component: UserProfileComponent },

      { path: 'my-leads', component: MyLeadsComponent },

      { path: 'my-leads/:id', component: LeadProfileComponent },

      // Customers
      { path: 'customers', component: CustomersComponent },
      { path: 'customers/:id', component: CustomerProfileComponent }

    ]
  },

  // Fallback Route
  {
    path: '**',
    redirectTo: 'login'
  }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
