import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';       // ✅ महत्त्वाचं
import { FormsModule } from '@angular/forms';
import {
  HTTP_INTERCEPTORS,
  HttpClientModule
} from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Pages
import { LoginComponent } from './pages/login/login.component';
import { SignupComponent } from './pages/signup/signup.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { UserDashboardComponent } from './pages/user-dashboard/user-dashboard.component';
import { MyLeadsComponent } from './pages/my-leads/my-leads.component';
import { MyOrganizationComponent } from './pages/my-organization/my-organization.component';
import { ManagerDashboardComponent } from './pages/manager-dashboard/manager-dashboard.component';
import { TeamLeadDashboardComponent } from './pages/team-lead-dashboard/team-lead-dashboard.component';


// Leads
import { LeadsComponent } from './pages/leads/leads.component';
import { AddLeadComponent } from './pages/leads/add-lead/add-lead.component';
import { BulkUploadComponent } from './pages/leads/bulk-upload/bulk-upload.component';
import { LeadProfileComponent } from './pages/leads/lead-profile/lead-profile.component';

// Sales Users
import { SalesUsersComponent } from './pages/sales-users/sales-users.component';
import { SalesUserLeadsComponent } from './pages/sales-user-leads/sales-user-leads.component';

// Customers


// Layouts
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { UserLayoutComponent } from './layout/user-layout/user-layout.component';
import { UserSidebarComponent } from './layout/user-sidebar/user-sidebar.component';
import { ManagerLayoutComponent } from './layout/manager-layout/manager-layout.component';
import { TeamLeadLayoutComponent } from './layout/team-lead-layout/team-lead-layout.component';
import { TeamLeadSidebarComponent } from './layout/team-lead-sidebar/team-lead-sidebar.component';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { CustomersComponent } from './pages/customers/customers.component';
import { CustomerProfileComponent } from './pages/customers/customer-profile/customer-profile.component';
import { ManagerSidebarComponent } from './layout/manager-sidebar/manager-sidebar.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignupComponent,
    DashboardComponent,
    UserProfileComponent,
    UserDashboardComponent,
    MyLeadsComponent,
    MyOrganizationComponent,
    ManagerDashboardComponent,
    TeamLeadDashboardComponent,
  
    SidebarComponent,
    HeaderComponent,
    MainLayoutComponent,
    UserLayoutComponent,
    UserSidebarComponent,
    ManagerLayoutComponent,
    TeamLeadLayoutComponent,
    TeamLeadSidebarComponent,
    CustomersComponent,
    CustomerProfileComponent,
    ManagerSidebarComponent,
    
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    CommonModule,                     // ✅ इथे आहे
    LeadsComponent,
    AddLeadComponent,
    BulkUploadComponent,
    LeadProfileComponent,
    SalesUsersComponent,
    SalesUserLeadsComponent,
 
   
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}