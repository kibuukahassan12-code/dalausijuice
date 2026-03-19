"use client";

import { useState, useRef } from "react";
import styles from "./receipt.module.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface OrderItem {
  product: {
    name: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
  };
  orderDate: string;
  orderType: string;
  transportFee: number;
  subtotal: number;
  totalAmount: number;
  status: string;
  items: OrderItem[];
}

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptModal({ order, isOpen, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !order) return null;

  const formatCurrency = (val: number) => `UGX ${val.toLocaleString()}`;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    setIsGenerating(true);
    
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt-${order.id.slice(-6)}-${formatDate(order.orderDate)}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Order Receipt</h2>
          <div className={styles.actions}>
            <button onClick={handlePrint} className={styles.printBtn}>
              Print
            </button>
            <button 
              onClick={handleDownloadPDF} 
              className={styles.downloadBtn}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Download PDF"}
            </button>
            <button onClick={onClose} className={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>

        <div ref={receiptRef} className={styles.receipt}>
          <div className={styles.receiptHeader}>
            <h1 className={styles.companyName}>Dalausi Juice</h1>
            <p className={styles.companySlogan}>100% Natural Fresh Juice</p>
            <div className={styles.receiptTitle}>OFFICIAL RECEIPT</div>
          </div>

          <div className={styles.receiptInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Receipt No:</span>
              <span className={styles.value}>#{order.id.slice(-6).toUpperCase()}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Date:</span>
              <span className={styles.value}>{formatDate(order.orderDate)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Order Type:</span>
              <span className={styles.value}>{order.orderType}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Status:</span>
              <span className={`${styles.value} ${styles[order.status.toLowerCase().replace(/\s+/g, "_")]}`}>
                {order.status}
              </span>
            </div>
          </div>

          <div className={styles.customerInfo}>
            <h3>Customer Details</h3>
            <p><strong>Name:</strong> {order.customer.name}</p>
            <p><strong>Phone:</strong> {order.customer.phone}</p>
          </div>

          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product.name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unitPrice)}</td>
                  <td>{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.totals}>
            <div className={styles.totalRow}>
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>Transport Fee:</span>
              <span>{formatCurrency(order.transportFee)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>Total Amount:</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className={styles.receiptFooter}>
            <p>Thank you for choosing Dalausi Juice!</p>
            <p className={styles.contact}>For inquiries: 0772456765</p>
            <p className={styles.timestamp}>Generated: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
