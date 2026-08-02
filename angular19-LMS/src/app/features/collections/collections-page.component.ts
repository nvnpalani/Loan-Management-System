import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionService } from '../../core/services/collection.service';

@Component({
  selector: 'app-collections-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './collections-page.component.html',
  styleUrl: './collections-page.component.css'
})
export class CollectionsPageComponent implements OnInit {
  private collectionService = inject(CollectionService);

  customers: any[] = [];
  availableAreas: string[] = [];
  selectedArea: string = '';

  // Summary Stats
  todayTotalCollection = 0;
  todayCollectedAmount = 0;
  todayPendingAmount = 0;

  ngOnInit() {
    this.loadCollections();
  }

  loadCollections() {
    this.collectionService.getFilteredCollections(this.selectedArea || undefined).subscribe(data => {
      this.customers = data;
      this.calculateSummary();
      
      if (this.availableAreas.length === 0) {
        this.availableAreas = [...new Set(data.map(c => c.area).filter((a): a is string => Boolean(a)))];
      }
    });
  }

  calculateSummary() {
    this.todayTotalCollection = 0;
    this.todayCollectedAmount = 0;

    for (const c of this.customers) {
      // Calculate daily amount
      const totalLoanWithInterest = c.loan_amount + (c.loan_amount * c.interest / 100);
      const dailyAmount = c.duration ? Math.ceil(totalLoanWithInterest / c.duration) : 0;
      
      if (c.pending_amount > 0) {
        this.todayTotalCollection += dailyAmount;
        if (c.today_status === 'Paid') {
          this.todayCollectedAmount += dailyAmount;
        }
      }
    }
    
    this.todayPendingAmount = this.todayTotalCollection - this.todayCollectedAmount;
  }

  onAreaChange() {
    this.loadCollections();
  }

  pay(customer: any) {
    const totalLoanWithInterest = customer.loan_amount + (customer.loan_amount * customer.interest / 100);
    const dailyAmount = customer.duration ? Math.ceil(totalLoanWithInterest / customer.duration) : 0;
    
    if (dailyAmount > customer.pending_amount) {
      alert('Daily amount exceeds pending balance!');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const payload = {
      customer_id: customer.customer_id,
      amount: dailyAmount,
      collection_date: today,
      status: 'Paid',
      remarks: 'Daily Collection'
    };

    this.collectionService.addCollection(payload).subscribe({
      next: () => {
        this.loadCollections();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to add collection');
      }
    });
  }

  markUnpaid(customer: any) {
    const today = new Date().toISOString().split('T')[0];
    const payload = {
      customer_id: customer.customer_id,
      collection_date: today,
      remarks: 'Customer not available/did not pay'
    };

    this.collectionService.markUnpaid(payload).subscribe({
      next: () => {
        this.loadCollections();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to mark as unpaid');
      }
    });
  }
}

