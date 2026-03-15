"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./events.module.css";
import DocumentTemplate, { DocType } from "@/components/Admin/DocumentTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function EventsPage() {
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

  const handleDeleteEvent = async (event: any) => {
    const id = event?.id;
    if (!id) return;
    if (!confirm(`Delete event "${event?.eventName ?? "Event"}"?`)) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEvents();
        setEditingEvent(null);
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
        {/* DOC Header & Tabs */}
        {/* ...Your existing doc tabs UI... */}
        <div className={styles.docPreview} ref={docRef}>
          <DocumentTemplate type={activeDoc} {...currentDocData} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.eventsPage}>
      {/* Your original Events + Form + Edit Modal UI */}
      {/* ... */}
    </div>
  );
}
export const dynamic = "force-dynamic";

