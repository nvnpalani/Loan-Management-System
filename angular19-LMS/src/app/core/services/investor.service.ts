import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Investor {
  id?: number;
  investor_id: string;
  name: string;
  phone: string;
  investment_amount: number;
  profit_percent?: number;
  profit_paid?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvestorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/investors`;

  getInvestors(): Observable<Investor[]> {
    return this.http.get<Investor[]>(this.apiUrl);
  }

  addInvestor(investor: Investor): Observable<{ id: number, message: string }> {
    return this.http.post<{ id: number, message: string }>(this.apiUrl, investor);
  }

  updateInvestor(id: number, investor: Investor): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, investor);
  }

  deleteInvestor(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
