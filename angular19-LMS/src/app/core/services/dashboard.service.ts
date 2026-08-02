import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  totalLiveInvestorAmount: number;
  totalCustomers: number;
  totalCustomerLoanAmount: number;
  totalCollectedAmount: number;
  totalPendingAmount: number;
  dailyCollections?: { date: string; amount: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);

  getStats(month?: string): Observable<DashboardStats> {
    let url = `${environment.apiUrl}/dashboard/stats`;
    if (month) {
      url += `?month=${month}`;
    }
    return this.http.get<DashboardStats>(url);
  }
}
