"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./events.module.css";
import DocumentTemplate, { DocType } from "@/components/Admin/DocumentTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface EventItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  name?: string;
}

interface Event {
  id: string;
  eventName: string;
  eventDate: string;
  location: string;
  status: "Upcoming" | "In Progress" | "Completed" | "Cancelled";
  totalAmount: number;
  customer?: {
    name: string;
    phone?: string;
  };
  items?: any[];
  paymentLinks?: any[];
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusClass = () => {
    switch (status?.toLowerCase()) {
      case "upcoming": return styles.statusUpcoming;
      case "in progress": return styles.statusInProgress;
      case "completed": return styles.statusCompleted;
      case "cancelled": return styles.statusCancelled;
      default: return styles.statusUpcoming;
    }
  };

  return (
    <span className={`${styles.statusBadge} ${getStatusClass()}`}>
      {status || "Upcoming"}
    </span>
  );
}

// Button Components
function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  onClick, 
  disabled = false,
  type = "button",
  className = ""
}: { 
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${styles.btn} ${styles[`btn${variant.charAt(0).toUpperCase() + variant.slice(1)}`]} ${styles[`btn${size.charAt(0).toUpperCase() + size.slice(1)}`]} ${className}`}
    >
      {children}
    </button>
  );
}

// Loading Spinner
function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  return <span className={`${styles.spinner} ${styles[`spinner${size.charAt(0).toUpperCase() + size.slice(1)}`]}`} />;
}

// Modal Component
function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer
}: { 
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>{children}</div>
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
}

// Card Component
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>;
}

function EventsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [setupFee, setSetupFee] = useState("0");
  const [serviceFee, setServiceFee] = useState("0");
  const [transportFee, setTransportFee] = useState("0");
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number; unitPrice: number; name?: string }[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [loading, setLoading] = useState(false);

  // Document preview
  const [showDocs, setShowDocs] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocType>("QUOTATION");
  const [currentDocData, setCurrentDocData] = useState<any>(null);
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const docRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchEvents();
    fetchProducts();
    fetchPaymentMethods();
  }, []);

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && events.length > 0) {
      const ev = events.find((e: any) => e?.id === editId);
      if (ev) setEditingEvent(ev);
    }
  }, [searchParams, events]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/events");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setEvents(data);
    } catch {
      // keep existing events
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setProducts(data);
    } catch {}
  };

  const fetchPaymentMethods = async () => {
    try {
      const res = await fetch("/api/admin/payment-methods");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setPaymentMethods(data);
        const firstId = data[0]?.id;
        if (firstId) setPaymentMethodId(firstId);
      }
    } catch {}
  };

  // Form item handlers
  const addItem = () => {
    if (products.length === 0) return;
    const first = products[0];
    setSelectedItems([...selectedItems, { productId: first.id, quantity: 1, unitPrice: Number(first.unitPrice) || 0, name: first.name ?? "Item" }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const nextItems = [...selectedItems];
    if (index < 0 || index >= nextItems.length) return;

    if (field === "productId") {
      const product = products.find(p => p.id === value);
      nextItems[index].productId = value;
      nextItems[index].unitPrice = Number(product?.unitPrice) || 0;
      nextItems[index].name = product?.name || "Item";
    } else {
      (nextItems[index] as any)[field] = field === "quantity" ? Number(value) || 0 : value;
    }
    setSelectedItems(nextItems);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  // Totals
  const itemsSubtotal = selectedItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const setupNum = Number(setupFee) || 0;
  const serviceNum = Number(serviceFee) || 0;
  const transportNum = Number(transportFee) || 0;
  const subtotal = itemsSubtotal + setupNum + serviceNum;
  const totalAmount = subtotal + transportNum;
  const balanceDue = totalAmount - (Number(amountPaid) || 0);

  // Submit new event
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return alert("Please add at least one juice selection");
    setLoading(true);

    const eventData = {
      customerName,
      customerPhone,
      eventName,
      eventDate,
      location,
      setupFee,
      serviceFee,
      transportFee,
      items: selectedItems,
      paymentMethodId,
      amountPaid: amountPaid || "0",
    };

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        const result = await res.json();
        setCurrentEvent(result);
        setCurrentDocData(prepareEventDocData(result));
        setShowDocs(true);
        fetchEvents();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCustomerName("");
    setCustomerPhone("");
    setEventName("");
    setLocation("");
    setSetupFee("0");
    setServiceFee("0");
    setTransportFee("0");
    setSelectedItems([]);
    setAmountPaid("");
    setShowDocs(false);
    setCurrentDocData(null);
    setCurrentEvent(null);
  };

  const handleViewEvent = (event: any) => {
    const id = event?.id;
    if (!id) return;
    router.push(`/admin/events/${id}`);
  };

  // Editing
  const handleEditEvent = (event: any) => setEditingEvent(event);

  const handleDeleteClick = (event: any) => {
    setEventToDelete(event);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete?.id) return;
    
    try {
      const res = await fetch(`/api/admin/events/${eventToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEvents();
        setEditingEvent(null);
        setIsDeleteModalOpen(false);
        setEventToDelete(null);
      } else {
        const err = await res.json();
        alert(err.error ?? "Failed to delete event");
      }
    } catch {
      alert("Failed to delete event");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent?.id) return;
    setEditLoading(true);
    try {
      const items = (editingEvent?.items ?? []).map((i: any) => ({
        productId: i.productId ?? i.product?.id ?? "",
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice ?? i.product?.unitPrice) || 0,
      })).filter(i => i.productId && i.quantity > 0);

      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: editingEvent.eventName,
          eventDate: editingEvent.eventDate ? new Date(editingEvent.eventDate).toISOString().split("T")[0] : undefined,
          location: editingEvent.location,
          setupFee: editingEvent.setupFee ?? 0,
          serviceFee: editingEvent.serviceFee ?? 0,
          transportFee: editingEvent.transportFee ?? 0,
          status: editingEvent.status,
          items: items.length > 0 ? items : undefined,
        }),
      });

      if (res.ok) fetchEvents();
      setEditingEvent(null);
    } catch {
      alert("Failed to update event");
    } finally {
      setEditLoading(false);
    }
  };

  const updateEditingField = (field: string, value: any) => {
    setEditingEvent(prev => prev ? { ...prev, [field]: value } : null);
  };

  const updateEditingItem = (index: number, field: string, value: any) => {
    setEditingEvent(prev => {
      if (!prev?.items) return prev;
      const items = [...prev.items];
      const item = items[index];
      if (!item) return prev;
      if (field === "productId") {
        const product = products.find(p => p.id === value);
        items[index] = { ...item, productId: value, product, unitPrice: product?.unitPrice ?? item.unitPrice };
      } else {
        items[index] = { ...item, [field]: field === "quantity" ? Number(value) || 0 : value };
      }
      return { ...prev, items };
    });
  };

  // Document helpers
  const prepareEventDocData = (event: any) => {
    const customer = event.customer ?? {};
    const eventItems = Array.isArray(event.items) ? event.items : [];
    const paymentLinks = Array.isArray(event.paymentLinks) ? event.paymentLinks : [];
    const totalPaid = paymentLinks.reduce((acc, link) => acc + (link?.payment?.amountPaid ?? 0), 0);

    const payments = paymentLinks.map(link => {
      const p = link?.payment;
      if (!p) return null;
      return {
        id: p.id,
        amountPaid: p.amountPaid ?? 0,
        paymentDate: new Date(p.paymentDate ?? 0).toISOString(),
        paymentMethod: p.paymentMethod ?? { name: "Payment" },
        reference: p.reference,
      };
    }).filter(p => p != null);

    const itemsSubtotal = eventItems.reduce((acc, item) => acc + (item.totalPrice ?? 0), 0);
    const setup = Number(event.setupFee) || 0;
    const service = Number(event.serviceFee) || 0;
    const subtotal = itemsSubtotal + setup + service;
    const totalAmount = Number(event.totalAmount) || subtotal;
    const eventDateVal = event.eventDate ? new Date(event.eventDate) : new Date();
    const createdAt = event.createdAt ? new Date(event.createdAt) : new Date();

    return {
      docNumber: `EV-${String(event.id ?? "").slice(-4).toUpperCase()}-${createdAt.getFullYear()}`,
      date: eventDateVal.toLocaleDateString(),
      clientName: customer.name ?? "",
      clientPhone: customer.phone ?? "",
      eventName: event.eventName ?? "",
      eventDate: eventDateVal.toLocaleDateString(),
      location: event.location ?? "",
      items: eventItems.map((item: any) => ({
        description: item.product?.name ?? "Juice",
        quantity: item.quantity ?? 0,
        unitPrice: item.unitPrice ?? 0,
        totalPrice: item.totalPrice ?? 0,
      })),
      setupFee: setup,
      serviceFee: service,
      transportFee: Number(event.transportFee) || 0,
      subtotal,
      totalAmount,
      amountPaid: totalPaid,
      balanceDue: totalAmount - totalPaid,
      payments,
      status: event.status ?? "Upcoming",
    };
  };

  const handleDownloadDocument = async (event: any, docType: DocType) => {
    let tempContainer: HTMLDivElement | null = null;
    let root: any = null;

    try {
      const docData = prepareEventDocData(event);
      if (docType === "RECEIPT" && (!docData.payments || docData.payments.length === 0)) {
        alert("No payments found for this event. Receipt cannot be generated.");
        return;
      }

      tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.top = "0";
      tempContainer.style.width = "800px";
      tempContainer.style.backgroundColor = "#ffffff";
      tempContainer.style.padding = "40px";
      tempContainer.id = "temp-doc-container";
      document.body.appendChild(tempContainer);

      const ReactDOM = await import("react-dom/client");
      root = (ReactDOM as any).createRoot(tempContainer);

      root.render(
        React.createElement(DocumentTemplate, { type: docType, ...docData, exportMode: true })
      );

      await new Promise<void>(resolve => {
        requestAnimationFrame(() => setTimeout(resolve, 800));
      });

      const docElement = tempContainer.querySelector('[id="printable-document"]') || tempContainer;
      const canvas = await html2canvas(docElement as HTMLElement, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${docType}_${docData.docNumber}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF.");
    } finally {
      if (root) try { root.unmount(); } catch {}
      if (tempContainer && document.body.contains(tempContainer)) document.body.removeChild(tempContainer);
    }
  };

  const handleDownloadPDF = async () => {
    if (!docRef.current) return;
    try {
      const canvas = await html2canvas(docRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${activeDoc}_${currentDocData?.docNumber || "DOC"}_${new Date().getTime()}.pdf`);
    } catch {
      window.print();
    }
  };

  const handlePrint = () => window.print();

  // Render
  if (showDocs && currentDocData && currentEvent) {
    const hasPayments = currentDocData.payments && currentDocData.payments.length > 0;
    return (
      <div className={styles.docsContainer}>
        <div className={styles.docsHeader}>
          <div className={styles.docTabs}>
            <button 
              onClick={() => setActiveDoc("QUOTATION")} 
              className={`${styles.tabBtn} ${activeDoc === "QUOTATION" ? styles.activeTab : ""}`}
            >
              Quotation
            </button>
            <button 
              onClick={() => setActiveDoc("INVOICE")} 
              className={`${styles.tabBtn} ${activeDoc === "INVOICE" ? styles.activeTab : ""}`}
            >
              Invoice
            </button>
            {hasPayments && (
              <button 
                onClick={() => setActiveDoc("RECEIPT")} 
                className={`${styles.tabBtn} ${activeDoc === "RECEIPT" ? styles.activeTab : ""}`}
              >
                Receipt
              </button>
            )}
          </div>
          <div className={styles.headerActions}>
            <button onClick={handlePrint} className={styles.printBtn}>
              Print
            </button>
            <button onClick={handleDownloadPDF} className={styles.downloadBtn}>
              Download PDF
            </button>
            <button onClick={() => setShowDocs(false)} className={styles.backBtn}>
              Back to Events
            </button>
          </div>
        </div>
        <div className={styles.docPreview} ref={docRef}>
          <DocumentTemplate type={activeDoc} {...currentDocData} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.eventsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Event Management</h1>
        <p className={styles.pageSubtitle}>Manage event bookings, quotations, and invoices</p>
      </div>

      {/* Events List */}
      <Card className={styles.listSection}>
        <div className={styles.sectionTitleBar}>
          <h2 className={styles.sectionTitle}>All Events</h2>
          <p className={styles.listSectionDesc}>View and manage all your event bookings</p>
        </div>
        <div className={styles.tableCard}>
          {events.length === 0 ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyStateText}>No events found</p>
              <p className={styles.emptyStateHint}>Create your first event using the form below</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th className={styles.numCol}>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev: any) => (
                    <tr key={ev.id}>
                      <td className={styles.eventName}>{ev.eventName}</td>
                      <td>{ev.customer?.name}</td>
                      <td>{new Date(ev.eventDate).toLocaleDateString()}</td>
                      <td className={styles.eventLoc}>{ev.location}</td>
                      <td className={styles.numCol}>UGX {Number(ev.totalAmount).toLocaleString()}</td>
                      <td><StatusBadge status={ev.status} /></td>
                      <td>
                        <div className={styles.rowActions}>
                          <Button variant="primary" size="sm" onClick={() => handleViewEvent(ev)}>View</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditEvent(ev)}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteClick(ev)}>Delete</Button>
                          <Button variant="secondary" size="sm" onClick={() => handleDownloadDocument(ev, "QUOTATION")}>Quote</Button>
                          <Button variant="secondary" size="sm" onClick={() => handleDownloadDocument(ev, "RECEIPT")}>Receipt</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Create Event Form */}
      {!editingEvent && (
        <Card className={styles.formSection}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.sectionTitle}>Create New Event</h2>
            <div className={styles.formBlock}>
              <h3 className={styles.formBlockTitle}>Customer Information</h3>
              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label>Customer Name</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="Enter customer name" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Customer Phone</label>
                  <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required placeholder="Enter phone number" />
                </div>
              </div>
            </div>

            <div className={styles.formBlock}>
              <h3 className={styles.formBlockTitle}>Event Details</h3>
              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label>Event Name</label>
                  <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} required placeholder="Enter event name" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Event Date</label>
                  <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
                </div>
                <div className={styles.inputGroupFull}>
                  <label>Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} required placeholder="Enter event location" />
                </div>
              </div>
            </div>

            <div className={styles.itemsSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.formBlockTitle}>Juice Selections</h3>
                <Button variant="secondary" size="sm" onClick={addItem}>+ Add Juice</Button>
              </div>
              {selectedItems.map((item, idx) => (
                <div key={idx} className={styles.itemRow}>
                  <select value={item.productId} onChange={e => updateItem(idx, "productId", e.target.value)}>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} (UGX {p.unitPrice})</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} />
                  <span className={styles.itemPrice}>UGX {(item.quantity * item.unitPrice).toLocaleString()}</span>
                  <button type="button" onClick={() => removeItem(idx)} className={styles.removeBtn}>×</button>
                </div>
              ))}
            </div>

            <div className={styles.feeSection}>
              <h3 className={styles.formBlockTitle}>Additional Fees</h3>
              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label>Setup Fee (UGX)</label>
                  <input type="number" value={setupFee} onChange={e => setSetupFee(e.target.value)} placeholder="0" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Service Fee (UGX)</label>
                  <input type="number" value={serviceFee} onChange={e => setServiceFee(e.target.value)} placeholder="0" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Transport Fee (UGX)</label>
                  <input type="number" value={transportFee} onChange={e => setTransportFee(e.target.value)} placeholder="0" />
                </div>
              </div>
            </div>

            <div className={styles.summaryBox}>
              <h3 className={styles.summaryTitle}>Order Summary</h3>
              <div className={styles.summaryRow}>
                <span>Items Subtotal</span>
                <span>UGX {itemsSubtotal.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Setup Fee</span>
                <span>UGX {setupNum.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Service Fee</span>
                <span>UGX {serviceNum.toLocaleString()}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Transport Fee</span>
                <span>UGX {transportNum.toLocaleString()}</span>
              </div>
              <div className={styles.total}>
                <span>Total Amount</span>
                <span>UGX {totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.paymentSection}>
              <h3 className={styles.formBlockTitle}>Payment Information</h3>
              <div className={styles.inputGrid}>
                <div className={styles.inputGroup}>
                  <label>Payment Method</label>
                  <select value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)}>
                    {paymentMethods.map((pm: any) => (
                      <option key={pm.id} value={pm.id}>{pm.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label>Amount Paid (UGX)</label>
                  <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="0" />
                </div>
              </div>
              <p className={styles.balanceDue}>Balance Due: UGX {balanceDue.toLocaleString()}</p>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={handleReset}>Reset</Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? <><LoadingSpinner size="sm" /> Creating...</> : "Create Event"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Edit Event Modal */}
      <Modal 
        isOpen={!!editingEvent} 
        onClose={() => setEditingEvent(null)}
        title="Edit Event"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit} disabled={editLoading}>
              {editLoading ? <><LoadingSpinner size="sm" /> Saving...</> : "Save Changes"}
            </Button>
          </>
        }
      >
        {editingEvent && (
          <form onSubmit={handleEditSubmit} className={styles.form}>
            <div className={styles.inputGrid}>
              <div className={styles.inputGroup}>
                <label>Event Name</label>
                <input type="text" value={editingEvent.eventName} onChange={e => updateEditingField("eventName", e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Event Date</label>
                <input type="date" value={editingEvent.eventDate?.split("T")[0]} onChange={e => updateEditingField("eventDate", e.target.value)} required />
              </div>
              <div className={styles.inputGroup}>
                <label>Location</label>
                <input type="text" value={editingEvent.location} onChange={e => updateEditingField("location", e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label>Status</label>
                <select value={editingEvent.status} onChange={e => updateEditingField("status", e.target.value)}>
                  <option value="Upcoming">Upcoming</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label>Setup Fee</label>
                <input type="number" value={editingEvent.setupFee} onChange={e => updateEditingField("setupFee", Number(e.target.value))} />
              </div>
              <div className={styles.inputGroup}>
                <label>Service Fee</label>
                <input type="number" value={editingEvent.serviceFee} onChange={e => updateEditingField("serviceFee", Number(e.target.value))} />
              </div>
              <div className={styles.inputGroup}>
                <label>Transport Fee</label>
                <input type="number" value={editingEvent.transportFee} onChange={e => updateEditingField("transportFee", Number(e.target.value))} />
              </div>
            </div>

            <div className={styles.itemsSection} style={{ marginTop: "1.5rem" }}>
              <h4 className={styles.formBlockTitle}>Items</h4>
              {(editingEvent.items || []).map((item: any, idx: number) => (
                <div key={idx} className={styles.itemRow}>
                  <select value={item.productId || item.product?.id} onChange={e => updateEditingItem(idx, "productId", e.target.value)}>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input type="number" min="1" value={item.quantity} onChange={e => updateEditingItem(idx, "quantity", e.target.value)} />
                </div>
              ))}
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Event
            </Button>
          </>
        }
      >
        <p>Are you sure you want to delete <strong>{eventToDelete?.eventName}</strong>?</p>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          This action cannot be undone. All associated data will be permanently removed.
        </p>
      </Modal>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading...</div>}>
      <EventsPageContent />
    </Suspense>
  );
}
