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

  // Investor Stats
  totalInvestors = 0;
  totalLiveInvestorAmount = 0;
  investorPaidAmount = 0;
  investorPendingAmount = 0;

  // Customer Stats
  totalCustomers = 0;
  totalCustomerLoanAmount = 0;
  totalCollectedAmount = 0;
  totalPendingAmount = 0;

  selectedMonth: string = '';
  isLoading = true;

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.dashboardService.getStats(this.selectedMonth).subscribe({
      next: (stats: DashboardStats) => {
        // Map backend data
        this.totalInvestors = stats.totalInvestors || 0;
        this.totalLiveInvestorAmount = stats.totalLiveInvestorAmount || 0;
        this.totalCustomers = stats.totalCustomers || 0;
        this.totalCustomerLoanAmount = stats.totalCustomerLoanAmount || 0;
        this.totalCollectedAmount = stats.totalCollectedAmount || 0;
        this.totalPendingAmount = stats.totalPendingAmount || 0;

        // Use actual API value for Investor Paid Amount
        this.investorPaidAmount = stats.totalInvestorPaidAmount || 0;
        
        // Pending Amount = Total Live Investment - Investor Paid
        this.investorPendingAmount = this.totalLiveInvestorAmount - this.investorPaidAmount;

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard stats', err);
        this.isLoading = false;
      }
    });
  }
}

