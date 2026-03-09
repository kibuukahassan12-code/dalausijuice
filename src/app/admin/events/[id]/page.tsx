"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "../events.module.css";
import DocumentTemplate, { DocType } from "@/components/Admin/DocumentTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeDoc, setActiveDoc] = useState<DocType>("QUOTATION");
    const [docData, setDocData] = useState<any>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: "",
        paymentMethodId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        reference: ""
    });
    const docRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (eventId) {
            fetchEvent();
            fetchPaymentMethods();
        }
    }, [eventId]);

    const fetchPaymentMethods = async () => {
        try {
            const res = await fetch("/api/admin/payment-methods");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setPaymentMethods(data);
                if (data.length > 0 && !paymentForm.paymentMethodId) {
                    setPaymentForm(prev => ({ ...prev, paymentMethodId: data[0].id }));
                }
            }
        } catch (error) {
            console.error("Error fetching payment methods:", error);
        }
    };

    const fetchEvent = async () => {
        try {
            const res = await fetch(`/api/admin/events/${eventId}`);
            const eventData = await res.json();
            if (res.ok && eventData && typeof eventData.id === "string") {
                setEvent(eventData);
                prepareDocData(eventData);
            } else {
                setEvent(null);
                setDocData(null);
            }
        } catch (error) {
            console.error("Error fetching event:", error);
            setEvent(null);
            setDocData(null);
        } finally {
            setLoading(false);
        }
    };

    const prepareDocData = (eventData: any) => {
        const customer = eventData?.customer ?? {};
        const eventItems = Array.isArray(eventData?.items) ? eventData.items : [];
        const paymentLinks = Array.isArray(eventData?.paymentLinks) ? eventData.paymentLinks : [];
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
        const setup = Number(eventData?.setupFee) || 0;
        const service = Number(eventData?.serviceFee) || 0;
        const subtotal = itemsSubtotal + setup + service;
        const totalAmount = Number(eventData?.totalAmount) ?? 0;
        const createdAt = eventData?.createdAt ? new Date(eventData.createdAt) : new Date();
        const eventDateVal = eventData?.eventDate ? new Date(eventData.eventDate) : new Date();

        setDocData({
            docNumber: `EV-${String(eventData?.id ?? "").slice(-4).toUpperCase()}-${createdAt.getFullYear()}`,
            date: eventDateVal.toLocaleDateString(),
            clientName: customer.name ?? "",
            clientPhone: customer.phone ?? "",
            eventName: eventData?.eventName ?? "",
            eventDate: eventDateVal.toLocaleDateString(),
            location: eventData?.location ?? "",
            items: eventItems.map((item: any) => ({
                description: item?.product?.name ?? "Juice",
                quantity: item?.quantity ?? 0,
                unitPrice: item?.unitPrice ?? 0,
                totalPrice: item?.totalPrice ?? 0
            })),
            setupFee: setup,
            serviceFee: service,
            transportFee: Number(eventData?.transportFee) || 0,
            subtotal,
            totalAmount,
            amountPaid: totalPaid,
            balanceDue: totalAmount - totalPaid,
            payments,
            status: eventData?.status ?? "Upcoming"
        });
    };

    const handleDownloadPDF = async (docType: DocType) => {
        if (!docData) return;
        if (docType === "RECEIPT" && (!docData.payments || docData.payments.length === 0)) {
            alert("No payments found for this event. Receipt cannot be generated.");
            return;
        }

        let tempContainer: HTMLDivElement | null = null;
        let root: { unmount: () => void } | null = null;
        const ReactDOM = await import("react-dom/client");

        try {
            tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.top = "0";
            tempContainer.style.width = "800px";
            tempContainer.style.backgroundColor = "#ffffff";
            tempContainer.style.padding = "40px";
            tempContainer.id = "temp-doc-container";
            document.body.appendChild(tempContainer);

            root = ReactDOM.createRoot(tempContainer);
            root.render(
                React.createElement(DocumentTemplate, { type: docType, ...docData, exportMode: true })
            );

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
            if (!docElement) throw new Error("Document element not found");

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
            let imgHeight = (canvas.height * imgWidth) / canvas.width;
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

            const fileName = `${docType}_${docData.docNumber ?? "DOC"}_${Date.now()}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            if (root) try { root.unmount(); } catch { /* ignore */ }
            if (tempContainer?.parentNode) tempContainer.parentNode.removeChild(tempContainer);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDelete = async () => {
        if (!event?.id) return;
        if (!confirm(`Delete event "${event?.eventName ?? "Event"}"? This will reverse all accounting entries and remove the event.`)) return;
        try {
            const res = await fetch(`/api/admin/events/${event.id}`, { method: "DELETE" });
            if (res.ok) {
                router.push("/admin/events");
            } else {
                const err = await res.json();
                alert(err.error ?? "Failed to delete event");
            }
        } catch (e) {
            alert("Failed to delete event");
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventId || !paymentForm.amount || !paymentForm.paymentMethodId) return;

        setSubmittingPayment(true);
        try {
            const res = await fetch(`/api/admin/events/${eventId}/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentForm),
            });

            if (res.ok) {
                setShowPaymentModal(false);
                setPaymentForm({
                    amount: "",
                    paymentMethodId: paymentMethods[0]?.id || "",
                    paymentDate: new Date().toISOString().split("T")[0],
                    reference: ""
                });
                await fetchEvent();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to record payment");
            }
        } catch (error) {
            alert("An error occurred while recording the payment");
        } finally {
            setSubmittingPayment(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: "center", padding: "4rem" }}>
                    <p>Loading event details...</p>
                </div>
            </div>
        );
    }

    if (!event || !docData) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: "center", padding: "4rem" }}>
                    <p>Event not found</p>
                    <button onClick={() => router.push("/admin/events")} className={styles.backBtn}>
                        ← Back to Events
                    </button>
                </div>
            </div>
        );
    }

    const hasPayments = docData.payments && docData.payments.length > 0;

    return (
        <div className={styles.docsContainer}>
            <div className={styles.docsHeader}>
                <button onClick={() => router.push("/admin/events")} className={styles.backBtn}>
                    ← Back to Events
                </button>
                <div style={{ display: "flex", gap: "0.75rem", marginLeft: "auto" }}>
                    <button
                        onClick={() => setShowPaymentModal(true)}
                        className={styles.submitBtn}
                        style={{ background: "var(--color-orange)", marginTop: 0 }}
                    >
                        Record Payment
                    </button>
                    <button
                        onClick={() => router.push(`/admin/events?edit=${event.id}`)}
                        className={styles.editBtn}
                    >
                        Edit
                    </button>
                    <button
                        onClick={handleDelete}
                        className={styles.deleteBtn}
                    >
                        Delete
                    </button>
                </div>
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
                            Receipt{(docData?.payments?.length ?? 0) > 1 ? "s" : ""}
                        </button>
                    )}
                </div>
                <div className={styles.headerActions}>
                    <button onClick={handlePrint} className={styles.printBtn}>Print</button>
                    <button
                        onClick={() => handleDownloadPDF(activeDoc)}
                        className={styles.downloadBtn}
                    >
                        Download {activeDoc} PDF
                    </button>
                </div>
            </div>

            {/* Event Details Section */}
            <div className={styles.eventDetailsSection}>
                <h2>Event Details</h2>
                <div className={styles.eventDetailsGrid}>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Event Name:</span>
                        <span className={styles.detailValue}>{event?.eventName ?? "—"}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Event Date:</span>
                        <span className={styles.detailValue}>{event?.eventDate ? new Date(event.eventDate).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Location:</span>
                        <span className={styles.detailValue}>{event?.location ?? "—"}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Client Name:</span>
                        <span className={styles.detailValue}>{event?.customer?.name ?? "—"}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Client Phone:</span>
                        <span className={styles.detailValue}>{event?.customer?.phone ?? "—"}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Status:</span>
                        <span className={`${styles.detailValue} ${styles.statusBadge} ${styles[String(event?.status ?? "").toLowerCase()]}`}>
                            {event?.status ?? "—"}
                        </span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Total Amount:</span>
                        <span className={styles.detailValue}>UGX {(event?.totalAmount ?? 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Amount Paid:</span>
                        <span className={styles.detailValue}>UGX {(docData?.amountPaid ?? 0).toLocaleString()}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Balance Due:</span>
                        <span className={styles.detailValue}>UGX {(docData?.balanceDue ?? 0).toLocaleString()}</span>
                    </div>
                </div>

                {/* Items List */}
                <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "2px solid #f1f5f9" }}>
                    <h3 style={{ color: "var(--color-plum)", marginBottom: "1rem" }}>Event Items</h3>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(event?.items ?? []).map((item: any, index: number) => (
                                <tr key={item?.id ?? index}>
                                    <td>{item?.product?.name ?? "Juice"}</td>
                                    <td>{item?.quantity ?? 0}</td>
                                    <td>UGX {(item?.unitPrice ?? 0).toLocaleString()}</td>
                                    <td>UGX {(item?.totalPrice ?? 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {hasPayments && (
                    <div className={styles.paymentsList}>
                        <h3>Payment History</h3>
                        {(docData?.payments ?? []).map((payment: any, index: number) => (
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

            {/* Document Preview */}
            <div className={styles.docPreview} ref={docRef}>
                <DocumentTemplate
                    type={activeDoc}
                    {...docData}
                />
            </div>

            {/* Download All Documents Section */}
            <div className={styles.eventDetailsSection}>
                <h2>Download All Documents</h2>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                        onClick={() => handleDownloadPDF("QUOTATION")}
                        className={styles.downloadBtn}
                    >
                        Download Quotation PDF
                    </button>
                    <button
                        onClick={() => handleDownloadPDF("INVOICE")}
                        className={styles.downloadBtn}
                    >
                        Download Invoice PDF
                    </button>
                    {hasPayments && (
                        <button
                            onClick={() => handleDownloadPDF("RECEIPT")}
                            className={styles.downloadBtn}
                        >
                            Download Receipt PDF
                        </button>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Record Payment</h2>
                            <button onClick={() => setShowPaymentModal(false)} className={styles.closeBtn}>×</button>
                        </div>
                        <form onSubmit={handleRecordPayment} className={styles.form}>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <label>Amount (UGX) *</label>
                                    <input
                                        type="number"
                                        value={paymentForm.amount}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                                        required
                                        min="1"
                                        max={docData.balanceDue}
                                        placeholder={`Max: ${docData.balanceDue.toLocaleString()}`}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Payment Method *</label>
                                    <select
                                        value={paymentForm.paymentMethodId}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethodId: e.target.value })}
                                        required
                                    >
                                        {paymentMethods.map((pm) => (
                                            <option key={pm.id} value={pm.id}>{pm.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Payment Date *</label>
                                    <input
                                        type="date"
                                        value={paymentForm.paymentDate}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Reference (Optional)</label>
                                    <input
                                        type="text"
                                        value={paymentForm.reference}
                                        onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                        placeholder="e.g. Check #, Mobile Money ID"
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" onClick={() => setShowPaymentModal(false)} className={styles.cancelBtn}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={submittingPayment}>
                                    {submittingPayment ? "Recording..." : "Save Payment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
