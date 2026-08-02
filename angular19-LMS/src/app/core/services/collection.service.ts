import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CollectionRecord {
  id?: number;
  customer_id: string;
  amount: number;
  date: string;
  status: string;
  employee_id?: string;
  customer_name?: string;
  phone?: string;
  area?: string;
  loan_amount?: number;
}

export interface CollectionSummary {
  totalCollection: number;
  totalCollectedAmount: number;
  totalPendingAmount: number;
  paidCustomers: number;
  unpaidCustomers: number;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/collections';

  getCollections(): Observable<CollectionRecord[]> {
    return this.http.get<CollectionRecord[]>(this.apiUrl);
  }

  getFilteredCollections(area?: string): Observable<CollectionRecord[]> {
    let params = new HttpParams();
    if (area) {
      params = params.set('area', area);
    }
    return this.http.get<CollectionRecord[]>(`${this.apiUrl}/filter`, { params });
  }

  getSummary(area?: string): Observable<CollectionSummary> {
    let params = new HttpParams();
    if (area) {
      params = params.set('area', area);
    }
    return this.http.get<CollectionSummary>(`${this.apiUrl}/summary`, { params });
  }

  addCollection(collection: Partial<CollectionRecord>): Observable<any> {
    return this.http.post(this.apiUrl, collection);
  }

  markUnpaid(collection: Partial<CollectionRecord>): Observable<any> {
    return this.http.post(`${this.apiUrl}/unpaid`, collection);
  }
}
