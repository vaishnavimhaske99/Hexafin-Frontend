
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Lead, LeadService } from '../../services/lead.service';

@Component({
  selector: 'app-sales-user-leads',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-user-leads.component.html',
  styleUrls: ['./sales-user-leads.component.css']
})
export class SalesUserLeadsComponent implements OnInit {
  leads: Lead[] = [];
  loading = false;
  errorMessage = '';
  userId = 11;

  constructor(
    private leadService: LeadService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('userId'));
    this.loadSalesUserLeads(id || this.userId);
  }

  loadSalesUserLeads(userId: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.leadService.getSalesUserLeads(userId).subscribe({
      next: (response) => {
        this.leads = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Sales User Leads API Error:', error);
        this.errorMessage =
          'Assigned leads load zalele nahit. API ani login token check kara.';
        this.loading = false;
      }
    });
  }
  
}
