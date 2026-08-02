export interface Loan {
  id: string;
  customerName: string;
  customerPhone: string;
  loanAmount: number;
  dailyAmount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Closed';
  totalPaid: number;
  balance: number;
  paidDays: number;
  totalDays: number;
  nextDue: string;
  documentImage?: string;
}

export interface Collection {
  id: string;
  loanId: string;
  date: string;
  amount: number;
  paymentMode: 'Cash' | 'UPI';
  collectedBy: string;
}

export interface LoanSummary {
  totalLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  totalOutstanding: number;
}
