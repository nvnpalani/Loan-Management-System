import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollectionService, CollectionRecord } from '../../core/services/collection.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports-page.component.html',
  styleUrl: './reports-page.component.css'
})
export class ReportsPageComponent implements OnInit {
  private collectionService = inject(CollectionService);

  allCollections: any[] = [];
  filteredData: any[] = [];
  
  // Filter states
  reportType: 'Daily' | 'Monthly' | 'Yearly' = 'Daily';
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedMonth: string = new Date().toISOString().slice(0, 7); // YYYY-MM
  selectedYear: string = new Date().getFullYear().toString();
  
  ngOnInit() {
    this.collectionService.getCollections().subscribe(data => {
      this.allCollections = data;
      this.applyFilters();
    });
  }

  onReportTypeChange(type: 'Daily' | 'Monthly' | 'Yearly') {
    this.reportType = type;
    this.applyFilters();
  }

  applyFilters() {
    let data = this.allCollections;
    
    if (this.reportType === 'Daily') {
      data = data.filter(c => c.collection_date.startsWith(this.selectedDate));
    } else if (this.reportType === 'Monthly') {
      data = data.filter(c => c.collection_date.startsWith(this.selectedMonth));
    } else if (this.reportType === 'Yearly') {
      data = data.filter(c => c.collection_date.startsWith(this.selectedYear));
    }

    this.filteredData = data;
  }

  get totalAmount() {
    return this.filteredData.filter(c => c.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
  }

  get totalTransactions() {
    return this.filteredData.length;
  }

  get paidTransactions() {
    return this.filteredData.filter(c => c.status === 'Paid').length;
  }

  get unpaidTransactions() {
    return this.filteredData.filter(c => c.status === 'Unpaid').length;
  }

  exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`LMS ${this.reportType} Report`, 14, 22);
    
    let subtitle = '';
    if (this.reportType === 'Daily') subtitle = `Date: ${this.selectedDate}`;
    if (this.reportType === 'Monthly') subtitle = `Month: ${this.selectedMonth}`;
    if (this.reportType === 'Yearly') subtitle = `Year: ${this.selectedYear}`;
    
    doc.setFontSize(11);
    doc.text(subtitle, 14, 30);
    doc.text(`Total Amount: Rs. ${this.totalAmount}`, 14, 36);
    
    const tableData = this.filteredData.map((c, i) => [
      i + 1,
      c.collection_date,
      c.customer_id,
      c.customer_name || 'Unknown',
      c.status,
      c.status === 'Paid' ? c.amount : 0
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['S.No', 'Date', 'Customer ID', 'Customer Name', 'Status', 'Amount']],
      body: tableData,
    });

    doc.save(`LMS_Report_${this.reportType}_${new Date().getTime()}.pdf`);
  }

  exportExcel() {
    const worksheetData = this.filteredData.map((c, i) => ({
      'S.No': i + 1,
      'Date': c.collection_date,
      'Customer ID': c.customer_id,
      'Customer Name': c.customer_name || 'Unknown',
      'Status': c.status,
      'Amount': c.status === 'Paid' ? c.amount : 0
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `LMS_Report_${this.reportType}_${new Date().getTime()}.xlsx`);
  }
}
