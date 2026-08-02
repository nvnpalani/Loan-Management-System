import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  // Summary Stats
  totalLiveInvestorAmount = 0;
  totalCustomers = 0;
  totalCustomerLoanAmount = 0;
  totalCollectedAmount = 0;
  totalPendingAmount = 0;

  selectedMonth: string = '';

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.dashboardService.getStats(this.selectedMonth).subscribe({
      next: (stats: DashboardStats) => {
        this.totalLiveInvestorAmount = stats.totalLiveInvestorAmount;
        this.totalCustomers = stats.totalCustomers;
        this.totalCustomerLoanAmount = stats.totalCustomerLoanAmount;
        this.totalCollectedAmount = stats.totalCollectedAmount;
        this.totalPendingAmount = stats.totalPendingAmount;
      },
      error: (err) => {
        console.error('Failed to load dashboard stats', err);
      }
    });
  }
}

