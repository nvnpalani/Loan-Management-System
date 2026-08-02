import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-agent-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.css'
})
export class AgentDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  areas: string[] = [];
  selectedArea: string = '';
  
  summary = {
    totalExpected: 0,
    completedAmount: 0,
    pendingAmount: 0
  };

  customers: any[] = [];
  
  // Amounts being typed into the collection inputs keyed by customer_id
  collectionInputs: { [key: string]: number } = {};
  submitting: { [key: string]: boolean } = {};

  ngOnInit() {
    this.loadAreas();
  }

  loadAreas() {
    this.http.get<string[]>(`${environment.apiUrl}/agent/areas`).subscribe({
      next: (areas) => {
        this.areas = areas;
      },
      error: (err) => console.error('Failed to load areas', err)
    });
  }

  onAreaChange() {
    if (!this.selectedArea) {
      this.summary = { totalExpected: 0, completedAmount: 0, pendingAmount: 0 };
      this.customers = [];
      return;
    }

    this.loadSummary();
    this.loadCustomers();
  }

  loadSummary() {
    this.http.get<any>(`${environment.apiUrl}/agent/collection-summary?area=${encodeURIComponent(this.selectedArea)}`)
      .subscribe({
        next: (data) => this.summary = data,
        error: (err) => console.error('Failed to load summary', err)
      });
  }

  loadCustomers() {
    this.http.get<any[]>(`${environment.apiUrl}/agent/customers?area=${encodeURIComponent(this.selectedArea)}`)
      .subscribe({
        next: (data) => {
          this.customers = data;
          this.collectionInputs = {};
          // Pre-fill input with daily collection amount (loan_amount / duration)
          data.forEach(c => {
             if (c.status !== 'Collected') {
                 const duration = parseInt(c.duration) || 100;
                 const dailyAmount = Math.round(c.loan_amount / duration);
                 this.collectionInputs[c.customer_id] = dailyAmount;
             }
          });
        },
        error: (err) => console.error('Failed to load customers', err)
      });
  }

  submitCollection(customer: any) {
    const amount = this.collectionInputs[customer.customer_id];
    if (!amount || amount <= 0) return;

    this.submitting[customer.customer_id] = true;

    const payload = {
      customer_id: customer.customer_id,
      amount: amount,
      collection_date: new Date().toISOString().split('T')[0],
      status: 'Paid',
      payment_mode: 'Cash',
      remarks: 'Collected by field agent'
    };

    this.http.post(`${environment.apiUrl}/collections`, payload).subscribe({
      next: () => {
        this.submitting[customer.customer_id] = false;
        // Reload data to reflect changes
        this.loadSummary();
        this.loadCustomers();
      },
      error: (err) => {
        console.error('Failed to submit collection', err);
        this.submitting[customer.customer_id] = false;
        alert('Error submitting collection.');
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
