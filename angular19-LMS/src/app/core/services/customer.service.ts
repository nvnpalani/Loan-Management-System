import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Customer {
  id?: number;
  customer_id: string;
  name: string;
  area: string;
  phone: string;
  address: string;
  work?: string;
  photo?: string;
  document?: string;
  start_date: string;
  duration: number;
  loan_amount: number;
  collected_amount?: number;
  pending_amount?: number;
  status?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/customers';

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  addCustomer(customer: Customer): Observable<{ id: number, message: string }> {
    return this.http.post<{ id: number, message: string }>(this.apiUrl, customer);
  }

  updateCustomer(id: number | string, customer: Customer): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, customer);
  }

  deleteCustomer(id: number | string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  uploadImage(file: File): Observable<{ message: string, urls: string[] }> {
    const formData = new FormData();
    formData.append('documents', file);
    return this.http.post<{ message: string, urls: string[] }>('http://localhost:3000/upload', formData);
  }

  getCustomerHistory(customerId: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:3000/collections/history/${customerId}`);
  }
}
