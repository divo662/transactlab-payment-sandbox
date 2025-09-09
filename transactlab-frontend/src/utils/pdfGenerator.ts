import jsPDF from 'jspdf';

export interface InvoiceData {
  invoiceId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  description: string;
  dueDate: string;
  createdAt: string;
  status: string;
  paidAt?: string;
  paidAmount?: number;
}

export const generateInvoicePDF = (invoice: InvoiceData): void => {
  const doc = new jsPDF();
  
  // Set up colors
  const primaryColor = '#0a164d';
  const secondaryColor = '#f8f9fa';
  const textColor = '#333333';
  const lightGray = '#e9ecef';
  
  // Add logo area (placeholder for now)
  doc.setFillColor(primaryColor);
  doc.rect(20, 20, 170, 30, 'F');
  
  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TransactLab', 25, 40);
  
  // Invoice title
  doc.setTextColor(primaryColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 20, 70);
  
  // Invoice details section
  doc.setFillColor(secondaryColor);
  doc.rect(20, 80, 170, 40, 'F');
  
  // Invoice ID and Date
  doc.setTextColor(textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice ID: ${invoice.invoiceId}`, 25, 95);
  doc.text(`Date: ${formatDateForPDF(invoice.createdAt)}`, 25, 105);
  doc.text(`Due Date: ${formatDateForPDF(invoice.dueDate)}`, 25, 115);
  
  // Status
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 120, 95);
  
  // Customer information
  doc.setTextColor(primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 140);
  
  doc.setTextColor(textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.customerName || 'N/A', 20, 155);
  doc.text(invoice.customerEmail, 20, 165);
  
  // Amount section
  doc.setFillColor(lightGray);
  doc.rect(120, 130, 70, 40, 'F');
  
  doc.setTextColor(primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Due', 125, 145);
  
  doc.setTextColor(textColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatAmountForPDF(invoice.amount, invoice.currency)}`, 125, 160);
  
  // Description section
  doc.setTextColor(primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Description:', 20, 185);
  
  doc.setTextColor(textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  // Split description into multiple lines if too long
  const descriptionLines = doc.splitTextToSize(invoice.description, 150);
  doc.text(descriptionLines, 20, 200);
  
  // Payment information (if paid)
  if (invoice.status === 'paid' && invoice.paidAt) {
    doc.setFillColor('#d4edda');
    doc.rect(20, 220, 170, 25, 'F');
    
    doc.setTextColor('#155724');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIVED', 25, 235);
    
    doc.setTextColor('#155724');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paid on: ${formatDateForPDF(invoice.paidAt)}`, 25, 240);
    doc.text(`Amount: ${formatAmountForPDF(invoice.paidAmount || invoice.amount, invoice.currency)}`, 120, 240);
  }
  
  // Footer
  doc.setDrawColor(lightGray);
  doc.line(20, 260, 190, 260);
  
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', 20, 275);
  doc.text('This is a sandbox invoice for testing purposes.', 20, 285);
  
  // Save the PDF
  const fileName = `invoice-${invoice.invoiceId}-${invoice.customerEmail}.pdf`;
  doc.save(fileName);
};

// Receipt PDF generation
export interface TransactionReceiptData {
  transactionId: string;
  sessionId?: string;
  customerEmail: string;
  customerName?: string;
  amount: number;
  currency: string;
  description?: string;
  createdAt: string;
  status: string;
  paymentMethod?: string;
}

export const generateReceiptPDF = (tx: TransactionReceiptData): void => {
  const doc = new jsPDF();

  const primaryColor = '#0a164d';
  const textColor = '#333333';
  const lightGray = '#e9ecef';

  // Header bar
  doc.setFillColor(primaryColor);
  doc.rect(20, 20, 170, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TransactLab', 25, 40);

  // Title
  doc.setTextColor(primaryColor);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', 20, 70);

  // Meta box
  doc.setFillColor('#f8f9fa');
  doc.rect(20, 80, 170, 40, 'F');
  doc.setTextColor(textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Transaction ID: ${tx.transactionId}`, 25, 95);
  if (tx.sessionId) doc.text(`Session ID: ${tx.sessionId}`, 25, 103);
  doc.text(`Date: ${formatDateForPDF(tx.createdAt)}`, 120, 95);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${tx.status.toUpperCase()}`, 120, 105);

  // Bill to
  doc.setTextColor(primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To:', 20, 140);
  doc.setTextColor(textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  if (tx.customerName) doc.text(tx.customerName, 20, 155);
  doc.text(tx.customerEmail, 20, 165);

  // Amount box
  doc.setFillColor(lightGray);
  doc.rect(120, 130, 70, 40, 'F');
  doc.setTextColor(primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount', 125, 145);
  doc.setTextColor(textColor);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatAmountForPDF(tx.amount, tx.currency)}`, 125, 160);

  // Description
  if (tx.description) {
    doc.setTextColor(primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Description:', 20, 185);
    doc.setTextColor(textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(tx.description, 150);
    doc.text(lines, 20, 200);
  }

  // Payment method
  if (tx.paymentMethod) {
    doc.setTextColor(textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${tx.paymentMethod}`, 20, 230);
  }

  // Footer
  doc.setDrawColor(lightGray);
  doc.line(20, 260, 190, 260);
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a sandbox receipt for testing purposes.', 20, 275);

  const fileName = `receipt-${tx.transactionId}-${tx.customerEmail}.pdf`;
  doc.save(fileName);
};

const formatDateForPDF = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatAmountForPDF = (amount: number, currency: string): string => {
  const formattedAmount = (amount / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const currencySymbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'NGN': '₦'
  };
  
  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${formattedAmount}`;
};
