import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Loan, Collection, LoanSummary } from '../../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private http = inject(HttpClient);

  // State
  private loans = signal<Loan[]>([]);
  private collections = signal<Collection[]>([]);

  constructor() {
    this.fetchLoans();
    this.fetchCollections();
  }

  fetchLoans() {
    this.http.get<any[]>(`${environment.apiUrl}/customers`).subscribe({
      next: (data) => {
        const mappedLoans: Loan[] = data.map(c => ({
          id: c.customer_id,
          customerName: c.name,
          customerPhone: c.phone,
          loanAmount: c.loan_amount,
          dailyAmount: (c.loan_amount / parseInt(c.duration || '100')) || 0,
          startDate: c.start_date || c.created_at,
          endDate: '',
          status: c.pending_amount > 0 ? 'Active' : 'Closed',
          totalPaid: c.collected_amount,
          balance: c.pending_amount,
          paidDays: c.collected_amount / ((c.loan_amount / parseInt(c.duration || '100')) || 1),
          totalDays: parseInt(c.duration || '100'),
          nextDue: c.start_date
        }));
        this.loans.set(mappedLoans);
      },
      error: (err) => console.error('Error fetching customers/loans', err)
    });
  }

  fetchCollections() {
    this.http.get<any[]>(`${environment.apiUrl}/collections`).subscribe({
      next: (data) => {
        const cols: Collection[] = data.map(c => ({
          id: c.collection_id,
          loanId: c.customer_id,
          date: c.collection_date,
          amount: c.amount,
          paymentMode: c.payment_mode || 'Cash',
          collectedBy: 'Admin'
        }));
        this.collections.set(cols);
      },
      error: (err) => console.error('Error fetching collections', err)
    });
  }

  // Exposed Signals
  readonly allLoans = this.loans.asReadonly();
  readonly allCollections = this.collections.asReadonly();
  
  readonly summary = computed<LoanSummary>(() => {
    const currentLoans = this.loans();
    let totalDisbursed = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let activeLoans = 0;

    currentLoans.forEach(loan => {
      if(loan.status === 'Active') {
        activeLoans++;
      }
      totalDisbursed += loan.loanAmount;
      totalCollected += loan.totalPaid;
      totalOutstanding += loan.balance;
    });

    return {
      totalLoans: activeLoans,
      totalDisbursed,
      totalCollected,
      totalOutstanding
    };
  });

  // Selected Loan
  public selectedLoanId = signal<string | null>(null);

  readonly selectedLoan = computed(() => {
    const id = this.selectedLoanId();
    if (!id) return null;
    return this.loans().find(l => l.id === id) || null;
  });

  readonly selectedLoanCollections = computed(() => {
    const id = this.selectedLoanId();
    if (!id) return [];
    return this.collections().filter(c => c.loanId === id);
  });

  // Actions
  selectLoan(id: string) {
    this.selectedLoanId.set(id);
  }

  clearSelection() {
    this.selectedLoanId.set(null);
  }

  closeLoan(id: string) {
    this.http.put(`${environment.apiUrl}/customers/${id}`, { pending_amount: 0 }).subscribe({
      next: () => {
        this.fetchLoans(); // Refresh from backend
      }
    });
  }

  updateLoanDocument(id: string, documentImage: string) {
    // Need to handle file upload or base64 based on backend capability
    // For now, updating local state until backend API supports document URL updates
    this.loans.update(loans => 
      loans.map(loan => loan.id === id ? { ...loan, documentImage } : loan)
    );
  }

  addLoan(loanData: any) {
    const newId = 'LN' + Date.now().toString().slice(-4);
    const backendData = {
      customer_id: newId,
      name: loanData.customerName,
      phone: loanData.customerPhone,
      area: loanData.area || 'General',
      address: loanData.address || '',
      start_date: loanData.startDate,
      duration: loanData.totalDays?.toString() || '100',
      loan_amount: loanData.loanAmount,
      collected_amount: 0,
      pending_amount: loanData.loanAmount,
      interest: 0
    };

    this.http.post(`${environment.apiUrl}/customers`, backendData).subscribe({
      next: () => {
        this.fetchLoans();
      },
      error: (err) => console.error('Error adding loan', err)
    });
  }

  addCollection(collectionData: Omit<Collection, 'id'>) {
    const newId = 'C' + Date.now().toString().slice(-4);
    const backendData = {
      collection_id: newId,
      customer_id: collectionData.loanId,
      collection_date: collectionData.date,
      amount: collectionData.amount,
      payment_mode: collectionData.paymentMode
    };

    this.http.post(`${environment.apiUrl}/collections`, backendData).subscribe({
      next: () => {
        this.fetchCollections();
        this.fetchLoans(); // To update pending amounts
      },
      error: (err) => console.error('Error adding collection', err)
    });
  }
}
