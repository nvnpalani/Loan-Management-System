import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvestorService, Investor } from '../../core/services/investor.service';

@Component({
  selector: 'app-investor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './investor.component.html',
  styleUrl: './investor.component.css'
})
export class InvestorComponent implements OnInit {
  private investorService = inject(InvestorService);

  investors: Investor[] = [];
  
  // Summary Stats
  totalInvestorAmount = 0;
  backupAmount = 0;
  liveInvestmentAmount = 0;

  // Modal State
  showModal = false;
  isEditMode = false;
  currentInvestor: Investor = this.getEmptyInvestor();

  ngOnInit() {
    this.loadInvestors();
  }

  loadInvestors() {
    this.investorService.getInvestors().subscribe(data => {
      this.investors = data;
      this.calculateSummaries();
    });
  }

  calculateSummaries() {
    this.totalInvestorAmount = this.investors.reduce((sum, inv) => sum + (Number(inv.investment_amount) || 0), 0);
    this.backupAmount = this.totalInvestorAmount * 0.10; // 10%
    this.liveInvestmentAmount = this.totalInvestorAmount - this.backupAmount;
  }

  getEmptyInvestor(): Investor {
    return {
      investor_id: '',
      name: '',
      phone: '',
      investment_amount: 0,
      profit_percent: 0,
      profit_paid: 0,
      status: 'Active'
    };
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentInvestor = this.getEmptyInvestor();
    this.showModal = true;
  }

  openEditModal(investor: Investor) {
    this.isEditMode = true;
    this.currentInvestor = { ...investor };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveInvestor() {
    if (this.isEditMode && this.currentInvestor.id) {
      this.investorService.updateInvestor(this.currentInvestor.id, this.currentInvestor).subscribe(() => {
        this.loadInvestors();
        this.closeModal();
      });
    } else {
      this.investorService.addInvestor(this.currentInvestor).subscribe(() => {
        this.loadInvestors();
        this.closeModal();
      });
    }
  }

  deleteInvestor(id: number) {
    if (confirm('Are you sure you want to delete this investor?')) {
      this.investorService.deleteInvestor(id).subscribe(() => {
        this.loadInvestors();
      });
    }
  }

  // Allow only numbers and restrict length
  numberOnly(event: KeyboardEvent, maxLength?: number, currentValue?: string): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Prevent non-numeric characters
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    // Prevent typing more than maxLength
    if (maxLength && currentValue && currentValue.toString().length >= maxLength) {
      return false;
    }
    return true;
  }
}
