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

    // Form State
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState(new Date().toISOString().split("T")[0]);
    const [location, setLocation] = useState("");
    const [setupFee, setSetupFee] = useState("0");
    const [serviceFee, setServiceFee] = useState("0");
    const [transportFee, setTransportFee] = useState("0");
    const [selectedItems, setSelectedItems] = useState<{ productId: string, quantity: number, unitPrice: number, name?: string }[]>([]);
    const [paymentMethodId, setPaymentMethodId] = useState("");
    const [amountPaid, setAmountPaid] = useState("");
    const [loading, setLoading] = useState(false);

    // Document Preview State
    const [showDocs, setShowDocs] = useState(false);
    const [activeDoc, setActiveDoc] = useState<DocType>("QUOTATION");
    const [currentDocData, setCurrentDocData] = useState<any>(null);
    const [currentEvent, setCurrentEvent] = useState<any>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [editLoading, setEditLoading] = useState(false);
    const docRef = useRef<HTMLDivElement>(null);

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
            // keep existing events on error
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/admin/products");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setProducts(data);
        } catch {
            // keep existing products
        }
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
        } catch {
            // keep existing payment methods
        }
    };

    const addItem = () => {
        if (Array.isArray(products) && products.length > 0) {
            const first = products[0];
            setSelectedItems([...selectedItems, {
                productId: first?.id ?? "",
                quantity: 1,
                unitPrice: Number(first?.unitPrice) || 0,
                name: first?.name ?? "Item"
            }]);
        }
    };

    const updateItem = (index: number, field: string, value: any) => {
        const nextItems = [...(selectedItems ?? [])];
        if (index < 0 || index >= nextItems.length) return;
        if (field === "productId") {
            const product = (products ?? []).find(p => p?.id === value);
            nextItems[index].productId = value ?? "";
            nextItems[index].unitPrice = Number(product?.unitPrice) ?? 0;
            nextItems[index].name = product?.name ?? "Item";
        } else {
            (nextItems[index] as any)[field] = field === "quantity" ? (Number(value) || 0) : value;
        }
        setSelectedItems(nextItems);
    };

    const removeItem = (index: number) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const itemsSubtotal = (selectedItems ?? []).reduce(
        (acc, item) => acc + ((Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0)),
        0
    );
    const setupNum = Number(setupFee) || 0;
    const serviceNum = Number(serviceFee) || 0;
    const transportNum = Number(transportFee) || 0;
    const subtotal = itemsSubtotal + setupNum + serviceNum;
    const totalAmount = subtotal + transportNum;
    const balanceDue = totalAmount - (Number(amountPaid) || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            alert("Please add at least one juice selection");
            return;
        }
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
            amountPaid: amountPaid || "0"
        };

        try {
            const res = await fetch("/api/admin/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(eventData),
            });

            if (res.ok) {
                const result = await res.json();
                // API returns full event with customer, items, paymentLinks (same shape as GET)
                if (result && typeof result.id === "string") {
                    setCurrentEvent(result);
                    setCurrentDocData(prepareEventDocData(result));
                    setShowDocs(true);
                }
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

    const handleEditEvent = (event: any) => {
        setEditingEvent(event);
    };

    const handleDeleteEvent = async (event: any) => {
        const id = event?.id;
        if (!id) return;
        if (!confirm(`Delete event "${event?.eventName ?? "Event"}"? This will reverse all accounting entries and remove the event.`)) return;
        try {
            const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchEvents();
                setEditingEvent(null);
            } else {
                const err = await res.json();
                alert(err.error ?? "Failed to delete event");
            }
        } catch (e) {
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
            })).filter((i: any) => i.productId && i.quantity > 0);
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
            if (res.ok) {
                const updated = await res.json();
                fetchEvents();
                setEditingEvent(null);
            } else {
                const err = await res.json();
                alert(err.error ?? "Failed to update event");
            }
        } catch (e) {
            alert("Failed to update event");
        } finally {
            setEditLoading(false);
        }
    };

    const updateEditingField = (field: string, value: any) => {
        setEditingEvent((prev: any) => prev ? { ...prev, [field]: value } : null);
    };

    const updateEditingItem = (index: number, field: string, value: any) => {
        setEditingEvent((prev: any) => {
            if (!prev?.items) return prev;
            const items = [...prev.items];
            if (index < 0 || index >= items.length) return prev;
            const item = items[index];
            if (field === "productId") {
                const product = (products ?? []).find((p: any) => p?.id === value);
                items[index] = { ...item, productId: value, product: product ?? item.product, unitPrice: product?.unitPrice ?? item.unitPrice };
            } else {
                items[index] = { ...item, [field]: field === "quantity" ? (Number(value) || 0) : value };
            }
            return { ...prev, items };
        });
    };

    const prepareEventDocData = (event: any) => {
        const customer = event?.customer ?? {};
        const eventItems = Array.isArray(event?.items) ? event.items : [];
        const paymentLinks = Array.isArray(event?.paymentLinks) ? event.paymentLinks : [];
        const totalPaid = paymentLinks.reduce(
            (acc: number, link: any) => acc + (link?.payment?.amountPaid ?? 0),
            0
        );
        const payments = paymentLinks
            .map((link: any) => {
                if (!link?.payment) return null;
                const p = link.payment;
                return {
                    id: p.id,
                    amountPaid: p.amountPaid ?? 0,
                    paymentDate: typeof p.paymentDate === "string" ? p.paymentDate : new Date(p.paymentDate ?? 0).toISOString(),
                    paymentMethod: p.paymentMethod ?? { name: "Payment" },
                    reference: p.reference
                };
            })
            .filter((p: any) => p != null);
        const itemsSubtotal = eventItems.reduce((acc: number, item: any) => acc + (item?.totalPrice ?? 0), 0);
        const setup = Number(event?.setupFee) || 0;
        const service = Number(event?.serviceFee) || 0;
        const subtotal = itemsSubtotal + setup + service;
        const totalAmount = Number(event?.totalAmount) ?? 0;
        const createdAt = event?.createdAt ? new Date(event.createdAt) : new Date();
        const eventDateVal = event?.eventDate ? new Date(event.eventDate) : new Date();

        return {
            docNumber: `EV-${String(event?.id ?? "").slice(-4).toUpperCase()}-${createdAt.getFullYear()}`,
            date: eventDateVal.toLocaleDateString(),
            clientName: customer.name ?? "",
            clientPhone: customer.phone ?? "",
            eventName: event?.eventName ?? "",
            eventDate: eventDateVal.toLocaleDateString(),
            location: event?.location ?? "",
            items: eventItems.map((item: any) => ({
                description: item?.product?.name ?? "Juice",
                quantity: item?.quantity ?? 0,
                unitPrice: item?.unitPrice ?? 0,
                totalPrice: item?.totalPrice ?? 0
            })),
            setupFee: setup,
            serviceFee: service,
            transportFee: Number(event?.transportFee) || 0,
            subtotal,
            totalAmount,
            amountPaid: totalPaid,
            balanceDue: totalAmount - totalPaid,
            payments,
            status: event?.status ?? "Upcoming"
        };
    };

    const handleDownloadDocument = async (event: any, docType: DocType) => {
        let tempContainer: HTMLDivElement | null = null;
        let root: any = null;

        try {
            const docData = prepareEventDocData(event);
            
            // Check if receipt is requested but no payments exist
            if (docType === "RECEIPT" && (!docData.payments || docData.payments.length === 0)) {
                alert("No payments found for this event. Receipt cannot be generated.");
                return;
            }

            // Create a temporary hidden container for the document
            tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.top = "0";
            tempContainer.style.width = "800px";
            tempContainer.style.backgroundColor = "#ffffff";
            tempContainer.style.padding = "40px";
            tempContainer.id = "temp-doc-container";
            document.body.appendChild(tempContainer);

            // Render the document in the hidden container
            const ReactDOM = await import("react-dom/client");
            root = ReactDOM.createRoot(tempContainer);
            
            root.render(
                React.createElement(DocumentTemplate, {
                    type: docType,
                    ...docData,
                    exportMode: true,
                })
            );

            // Wait for React to render and images (e.g. company logo) to load
            await new Promise<void>(resolve => {
                requestAnimationFrame(() => {
                    setTimeout(async () => {
                        const images = tempContainer!.querySelectorAll("img");
                        if (images.length > 0) {
                            await Promise.all(
                                Array.from(images).map((img: HTMLImageElement) =>
                                    img.complete ? Promise.resolve() : new Promise<void>(r => {
                                        img.onload = () => r();
                                        img.onerror = () => r();
                                        setTimeout(r, 4000);
                                    })
                                )
                            );
                        }
                        resolve();
                    }, 800);
                });
            });

            const docElement = tempContainer.querySelector('[id="printable-document"]') || tempContainer;
            
            if (!docElement) {
                throw new Error("Document element not found");
            }

            const canvas = await html2canvas(docElement as HTMLElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: false,
                imageTimeout: 5000,
            });

            const imgData = canvas.toDataURL("image/png", 1.0);
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

            const fileName = `${docType}_${docData.docNumber}_${new Date().getTime()}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again or contact support.");
        } finally {
            // Clean up - unmount React component and remove container
            if (root) {
                try {
                    root.unmount();
                } catch (e) {
                    // Ignore unmount errors
                }
            }
            if (tempContainer && document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        }
    };

    const handleDownloadPDF = async () => {
        if (!docRef.current) return;

        try {
            const canvas = await html2canvas(docRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

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

            const fileName = `${activeDoc}_${currentDocData?.docNumber || "DOC"}_${new Date().getTime()}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // Fallback to print if PDF generation fails
            window.print();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (showDocs && currentDocData && currentEvent) {
        const hasPayments = currentDocData.payments && currentDocData.payments.length > 0;
        
        return (
            <div className={styles.docsContainer}>
                <div className={styles.docsHeader}>
                    <button onClick={handleReset} className={styles.backBtn}>← Back to Events</button>
                    <div className={styles.docTabs}>
                        <button
                            className={`${styles.tabBtn} ${activeDoc === "QUOTATION" ? styles.activeTab : ""}`}
                            onClick={() => setActiveDoc("QUOTATION")}
                        >
                            Quotation
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeDoc === "INVOICE" ? styles.activeTab : ""}`}
                            onClick={() => setActiveDoc("INVOICE")}
                        >
                            Invoice
                        </button>
                        {hasPayments && (
                            <button
                                className={`${styles.tabBtn} ${activeDoc === "RECEIPT" ? styles.activeTab : ""}`}
                                onClick={() => setActiveDoc("RECEIPT")}
                            >
                                Receipt{(currentDocData?.payments?.length ?? 0) > 1 ? "s" : ""}
                            </button>
                        )}
                    </div>
                    <div className={styles.headerActions}>
                        <button onClick={handlePrint} className={styles.printBtn}>Print</button>
                        <button onClick={handleDownloadPDF} className={styles.downloadBtn}>Download PDF</button>
                    </div>
                </div>

                {/* Event Details Section */}
                <div className={styles.eventDetailsSection}>
                    <h2>Event Details</h2>
                    <div className={styles.eventDetailsGrid}>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Event Name:</span>
                            <span className={styles.detailValue}>{currentEvent?.eventName ?? "—"}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Event Date:</span>
                            <span className={styles.detailValue}>{currentEvent?.eventDate ? new Date(currentEvent.eventDate).toLocaleDateString() : "—"}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Location:</span>
                            <span className={styles.detailValue}>{currentEvent?.location ?? "—"}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Client Name:</span>
                            <span className={styles.detailValue}>{currentEvent?.customer?.name ?? "—"}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Client Phone:</span>
                            <span className={styles.detailValue}>{currentEvent?.customer?.phone ?? "—"}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Status:</span>
                            <span className={`${styles.detailValue} ${styles.statusBadge} ${styles[String(currentEvent?.status ?? "").toLowerCase()]}`}>
                                {currentEvent?.status ?? "—"}
                            </span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Total Amount:</span>
                            <span className={styles.detailValue}>UGX {(currentEvent?.totalAmount ?? 0).toLocaleString()}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Amount Paid:</span>
                            <span className={styles.detailValue}>UGX {(currentDocData?.amountPaid ?? 0).toLocaleString()}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Balance Due:</span>
                            <span className={styles.detailValue}>UGX {(currentDocData?.balanceDue ?? 0).toLocaleString()}</span>
                        </div>
                    </div>
                    {hasPayments && Array.isArray(currentDocData.payments) && (
                        <div className={styles.paymentsList}>
                            <h3>Payment History</h3>
                            {currentDocData.payments.map((payment: any, index: number) => (
                                <div key={payment?.id ?? index} className={styles.paymentItem}>
                                    <div>
                                        <strong>Payment {index + 1}</strong>
                                        <span className={styles.paymentDate}>
                                            {payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "—"}
                                        </span>
                                    </div>
                                    <div>
                                        <span>Amount: UGX {(payment?.amountPaid ?? 0).toLocaleString()}</span>
                                        <span className={styles.paymentMethod}>
                                            {payment?.paymentMethod?.name ?? "N/A"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.docPreview} ref={docRef}>
                    <DocumentTemplate
                        type={activeDoc}
                        {...currentDocData}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.eventsPage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Events Management</h1>
                <p className={styles.pageSubtitle}>Record and track custom juice catering services</p>
            </header>

            {/* Upcoming Events — primary content first */}
            <section className={styles.listSection}>
                <div className={styles.sectionTitleBar}>
                    <h2 className={styles.sectionTitle}>Upcoming Events</h2>
                    <p className={styles.listSectionDesc}>View details or download quotation, invoice, or receipt for each event.</p>
                </div>
                <div className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        {(events ?? []).length === 0 ? (
                            <div className={styles.emptyState}>
                                <p className={styles.emptyStateText}>No events yet.</p>
                                <p className={styles.emptyStateHint}>Create your first event using the form below.</p>
                            </div>
                        ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Event & Location</th>
                                    <th>Client</th>
                                    <th className={styles.numCol}>Total</th>
                                    <th>Status</th>
                                    <th className={styles.viewCol}>View</th>
                                    <th>Documents</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(events ?? []).map((event) => (
                                    <tr key={event?.id ?? ""}>
                                        <td>{event?.eventDate ? new Date(event.eventDate).toLocaleDateString() : "—"}</td>
                                        <td>
                                            <div className={styles.eventName}>{event?.eventName ?? "—"}</div>
                                            <div className={styles.eventLoc}>{event?.location ?? "—"}</div>
                                        </td>
                                        <td>{event?.customer?.name ?? "—"}</td>
                                        <td className={styles.numCol}>UGX {(event?.totalAmount ?? 0).toLocaleString()}</td>
                                        <td>
                                            <span className={`${styles.status} ${styles[String(event?.status ?? "").toLowerCase()]}`}>
                                                {event?.status ?? "—"}
                                            </span>
                                        </td>
                                        <td className={styles.viewCol}>
                                            <button
                                                type="button"
                                                className={styles.viewBtn}
                                                onClick={() => handleViewEvent(event)}
                                                title="View all event details"
                                            >
                                                View
                                            </button>
                                        </td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    type="button"
                                                    className={styles.docBtn}
                                                    onClick={() => handleDownloadDocument(event, "QUOTATION")}
                                                    title="Download Quotation PDF"
                                                >
                                                    Quotation
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.docBtn}
                                                    onClick={() => handleDownloadDocument(event, "INVOICE")}
                                                    title="Download Invoice PDF"
                                                >
                                                    Invoice
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.docBtn}
                                                    onClick={() => handleDownloadDocument(event, "RECEIPT")}
                                                    title={event?.paymentLinks?.length ? "Download Receipt PDF" : "No payments — Receipt unavailable"}
                                                >
                                                    Receipt
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button
                                                    type="button"
                                                    className={styles.editBtn}
                                                    onClick={() => handleEditEvent(event)}
                                                    title="Edit event"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.deleteBtn}
                                                    onClick={() => handleDeleteEvent(event)}
                                                    title="Delete event"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                    </div>
                </div>
            </section>

            {/* New Event Record — form below */}
            <section className={styles.formSection}>
                <h2 className={styles.sectionTitle}>New Event Record</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formBlock}>
                            <h3 className={styles.formBlockTitle}>Event details</h3>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Event name</label>
                                    <input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Mukasa Wedding" required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Client name</label>
                                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Client phone</label>
                                    <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Event date</label>
                                    <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
                                </div>
                                <div className={styles.inputGroupFull}>
                                    <label>Location / venue</label>
                                    <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Serena Hotel, Kampala" required />
                                </div>
                            </div>
                        </div>

                        <div className={styles.itemsSection}>
                            <div className={styles.sectionHeader}>
                                <h3 className={styles.formBlockTitle}>Catering items</h3>
                                <button type="button" onClick={addItem} className={styles.addBtn}>+ Add item</button>
                            </div>

                            {(selectedItems ?? []).map((item, index) => (
                                <div key={item?.productId ?? index} className={styles.itemRow}>
                                    <select
                                        value={item?.productId ?? ""}
                                        onChange={(e) => updateItem(index, "productId", e.target.value)}
                                    >
                                        <option value="" disabled>Select Flavor</option>
                                        {(products ?? []).map((p, pIdx) => (
                                            <option key={p?.id ?? `p-${pIdx}`} value={p?.id ?? ""}>{p?.name ?? "—"}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={item?.quantity ?? ""}
                                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value, 10) || 0)}
                                        min={1}
                                        placeholder="Liters"
                                    />
                                    <div className={styles.itemPrice}>
                                        UGX {((Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0)).toLocaleString()}
                                    </div>
                                    <button type="button" onClick={() => removeItem(index)} className={styles.removeBtn}>×</button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.feeSection}>
                            <h3 className={styles.formBlockTitle}>Additional fees</h3>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Setup Fee (UGX)</label>
                                    <input type="number" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Service Fee (UGX)</label>
                                    <input type="number" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Transport (UGX)</label>
                                    <input type="number" value={transportFee} onChange={(e) => setTransportFee(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className={styles.summaryBox}>
                            <h3 className={styles.summaryTitle}>Summary</h3>
                            <div className={styles.summaryRow}>
                                <span>Items subtotal</span>
                                <span>UGX {(Number(itemsSubtotal) || 0).toLocaleString()}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Fees (setup, service, transport)</span>
                                <span>UGX {(setupNum + serviceNum + transportNum).toLocaleString()}</span>
                            </div>
                            <div className={`${styles.summaryRow} ${styles.total}`}>
                                <span>Grand total</span>
                                <span>UGX {(Number(totalAmount) || 0).toLocaleString()}</span>
                            </div>
                        </div>

                        <div className={styles.paymentSection}>
                            <h3 className={styles.formBlockTitle}>Payment (deposit or full)</h3>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Payment Method</label>
                                    <select value={paymentMethodId ?? ""} onChange={(e) => setPaymentMethodId(e.target.value)}>
                                        {(paymentMethods ?? []).map(pm => (
                                            <option key={pm?.id ?? ""} value={pm?.id ?? ""}>{pm?.name ?? "—"}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Amount Paid (UGX)</label>
                                    <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="0" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Recording…" : "Book event & generate documents"}
                        </button>
                    </form>
                </section>

            {/* Edit Event Modal */}
            {editingEvent && (
                <div className={styles.modalOverlay} onClick={() => setEditingEvent(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Edit Event</h2>
                            <button type="button" className={styles.closeBtn} onClick={() => setEditingEvent(null)}>×</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className={styles.form}>
                            <div className={styles.formBlock}>
                                <h3 className={styles.formBlockTitle}>Event details</h3>
                                <div className={styles.inputGrid}>
                                    <div className={styles.inputGroup}>
                                        <label>Event name</label>
                                        <input value={editingEvent.eventName ?? ""} onChange={(e) => updateEditingField("eventName", e.target.value)} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Event date</label>
                                        <input type="date" value={editingEvent.eventDate ? new Date(editingEvent.eventDate).toISOString().split("T")[0] : ""} onChange={(e) => updateEditingField("eventDate", e.target.value)} required />
                                    </div>
                                    <div className={styles.inputGroupFull}>
                                        <label>Location / venue</label>
                                        <input value={editingEvent.location ?? ""} onChange={(e) => updateEditingField("location", e.target.value)} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Setup Fee (UGX)</label>
                                        <input type="number" value={editingEvent.setupFee ?? 0} onChange={(e) => updateEditingField("setupFee", e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Service Fee (UGX)</label>
                                        <input type="number" value={editingEvent.serviceFee ?? 0} onChange={(e) => updateEditingField("serviceFee", e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Transport (UGX)</label>
                                        <input type="number" value={editingEvent.transportFee ?? 0} onChange={(e) => updateEditingField("transportFee", e.target.value)} />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Status</label>
                                        <select value={editingEvent.status ?? "Upcoming"} onChange={(e) => updateEditingField("status", e.target.value)}>
                                            <option value="Upcoming">Upcoming</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.itemsSection}>
                                <h3 className={styles.formBlockTitle}>Catering items</h3>
                                {(editingEvent.items ?? []).map((item: any, index: number) => (
                                    <div key={item?.id ?? index} className={styles.itemRow}>
                                        <select
                                            value={item?.productId ?? item?.product?.id ?? ""}
                                            onChange={(e) => updateEditingItem(index, "productId", e.target.value)}
                                        >
                                            <option value="" disabled>Select Flavor</option>
                                            {(products ?? []).map((p: any, pIdx: number) => (
                                                <option key={p?.id ?? `p-${pIdx}`} value={p?.id ?? ""}>{p?.name ?? "—"}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={item?.quantity ?? ""}
                                            onChange={(e) => updateEditingItem(index, "quantity", parseInt(e.target.value, 10) || 0)}
                                            min={1}
                                        />
                                        <div className={styles.itemPrice}>
                                            UGX {((Number(item?.quantity) || 0) * (Number(item?.unitPrice ?? item?.product?.unitPrice) || 0)).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setEditingEvent(null)}>Cancel</button>
                                <button type="submit" className={styles.submitBtn} disabled={editLoading}>
                                    {editLoading ? "Saving…" : "Save changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
