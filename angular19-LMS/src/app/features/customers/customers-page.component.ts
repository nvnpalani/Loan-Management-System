import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../core/services/customer.service';

@Component({
  selector: 'app-customers-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers-page.component.html',
  styleUrl: './customers-page.component.css'
})
export class CustomersPageComponent implements OnInit {
  private customerService = inject(CustomerService);

  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  
  // Filters
  searchTerm: string = '';
  selectedArea: string = '';
  availableAreas: string[] = [];

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  Math = Math;

  // Modal State
  showModal = false;
  isEditMode = false;
  currentCustomer: Customer = this.getEmptyCustomer();

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.customerService.getCustomers().subscribe(data => {
      this.customers = data;
      // Extract unique areas for the filter dropdown
      this.availableAreas = [...new Set(data.map(c => c.area).filter(a => a))];
      this.applyFilters();
    });
  }

  applyFilters() {
    let result = this.customers;

    if (this.selectedArea) {
      result = result.filter(c => c.area === this.selectedArea);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c => 
        (c.name && c.name.toLowerCase().includes(term)) || 
        (c.customer_id && c.customer_id.toLowerCase().includes(term)) ||
        (c.phone && c.phone.includes(term))
      );
    }

    this.filteredCustomers = result;
    this.currentPage = 1; // reset to first page on filter
  }

  get paginatedCustomers() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredCustomers.slice(startIndex, startIndex + this.pageSize);
  }

  get totalPages() {
    return Math.ceil(this.filteredCustomers.length / this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  getEmptyCustomer(): Customer {
    return {
      customer_id: '',
      name: '',
      area: '',
      phone: '',
      address: '',
      work: '',
      start_date: new Date().toISOString().split('T')[0],
      duration: 100,
      loan_amount: 0,
      collected_amount: 0,
      pending_amount: 0
    };
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentCustomer = this.getEmptyCustomer();
    this.showModal = true;
  }

  openEditModal(customer: Customer) {
    this.isEditMode = true;
    this.currentCustomer = { ...customer };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  saveCustomer() {
    if (this.isEditMode && (this.currentCustomer.id || this.currentCustomer.customer_id)) {
      const idToUpdate = this.currentCustomer.id || this.currentCustomer.customer_id;
      this.customerService.updateCustomer(idToUpdate, this.currentCustomer).subscribe(() => {
        this.loadCustomers();
        this.closeModal();
      });
    } else {
      this.customerService.addCustomer(this.currentCustomer).subscribe(() => {
        this.loadCustomers();
        this.closeModal();
      });
    }
  }

  deleteCustomer(customer: Customer) {
    if (confirm(`Are you sure you want to delete customer ${customer.name}?`)) {
      const idToDelete = customer.id || customer.customer_id;
      this.customerService.deleteCustomer(idToDelete).subscribe(() => {
        this.loadCustomers();
      });
    }
  }

  isUploading = false;

  showDetailsModal = false;
  selectedCustomer: Customer | null = null;
  customerHistory: any[] = [];
  viewingImage: string | null = null;

  onDocumentSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isUploading = true;
      this.customerService.uploadImage(file).subscribe({
        next: (res) => {
          if (res.urls && res.urls.length > 0) {
            this.currentCustomer.document = res.urls[0];
          }
          this.isUploading = false;
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.isUploading = false;
        }
      });
    }
  }



  viewDetails(customer: Customer) {
    this.selectedCustomer = customer;
    this.showDetailsModal = true;
    this.customerHistory = [];
    if (customer.customer_id) {
      this.customerService.getCustomerHistory(customer.customer_id).subscribe(history => {
        this.customerHistory = history;
      });
    }
  }

  closeDetailsModal() {
    this.showDetailsModal = false;
    this.selectedCustomer = null;
    this.customerHistory = [];
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
