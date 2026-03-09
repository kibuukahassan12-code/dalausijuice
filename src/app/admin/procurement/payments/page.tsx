"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../production/production.module.css";

export default function SupplierPaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [pos, setPOs] = useState<any[]>([]);
    const [selectedPO, setSelectedPO] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [supplier_id, setSupplierId] = useState("");
    const [po_id, setPOId] = useState("");
    const [payment_date, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
    const [amount_ugx, setAmountUgx] = useState("");
    const [payment_method, setPaymentMethod] = useState("CASH");
    const [reference_number, setReferenceNumber] = useState("");

    useEffect(() => {
        fetchPayments();
        fetchSuppliers();
        fetchPOs();
    }, []);

    const fetchPayments = async () => {
        const res = await fetch("/api/admin/procurement/payments");
        const data = await res.json();
        if (Array.isArray(data)) setPayments(data);
    };

    const fetchSuppliers = async () => {
        const res = await fetch("/api/admin/procurement/suppliers");
        const data = await res.json();
        if (Array.isArray(data)) setSuppliers(data);
    };

    const fetchPOs = async () => {
        const res = await fetch("/api/admin/procurement/purchase-orders");
        const data = await res.json();
        if (Array.isArray(data)) {
            // Only show POs with accepted GRNs
            const posWithGRNs = data.filter((po: any) => 
                po.goods_receipts && po.goods_receipts.some((grn: any) => grn.status === "ACCEPTED" || grn.status === "PARTIAL")
            );
            setPOs(posWithGRNs);
        }
    };

    useEffect(() => {
        if (po_id) {
            const po = pos.find(p => p.id === po_id);
            setSelectedPO(po);
            if (po) {
                setSupplierId(po.supplier_id);
            }
        } else {
            setSelectedPO(null);
        }
    }, [po_id, pos]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplier_id || !po_id || !payment_date || !amount_ugx || !payment_method) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/procurement/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supplier_id,
                    po_id,
                    payment_date,
                    amount_ugx: Number(amount_ugx),
                    payment_method,
                    reference_number,
                }),
            });

            if (res.ok) {
                setSupplierId("");
                setPOId("");
                setPaymentDate(new Date().toISOString().split("T")[0]);
                setAmountUgx("");
                setPaymentMethod("CASH");
                setReferenceNumber("");
                fetchPayments();
                fetchPOs();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to record payment");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to record payment");
        } finally {
            setLoading(false);
        }
    };

    // Calculate remaining payable for selected PO
    const remainingPayable = selectedPO ? (() => {
        const acceptedValue = selectedPO.goods_receipts?.reduce((sum: number, grn: any) => {
            return sum + grn.items.filter((i: any) => i.accepted).reduce((s: number, item: any) => {
                const poItem = selectedPO.items.find((pi: any) => pi.item_name === item.item_name);
                return s + (poItem ? item.quantity_received * poItem.unit_price_ugx : 0);
            }, 0);
        }, 0) || 0;

        const paid = selectedPO.supplier_payments?.reduce((sum: number, p: any) => sum + p.amount_ugx, 0) || 0;
        return acceptedValue - paid;
    })() : 0;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/procurement" className={styles.backLink}>← Back to Procurement</Link>
                    <h1>Supplier Payments</h1>
                    <p className={styles.purpose}>Record supplier payments. Payment cannot exceed GRN value.</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>New Payment</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>PO Reference *</label>
                            <select value={po_id} onChange={(e) => setPOId(e.target.value)} required>
                                <option value="">Select PO</option>
                                {pos.map((po) => (
                                    <option key={po.id} value={po.id}>
                                        {po.po_number} - {po.supplier?.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedPO && (
                            <div className={styles.summaryBox}>
                                <div className={styles.summaryRow}>
                                    <span>Remaining Payable:</span>
                                    <strong>UGX {remainingPayable.toLocaleString()}</strong>
                                </div>
                                <small>Maximum payment allowed</small>
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label>Supplier *</label>
                            <select value={supplier_id} onChange={(e) => setSupplierId(e.target.value)} required disabled={!!po_id}>
                                <option value="">Select supplier</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Payment Date *</label>
                            <input type="date" value={payment_date} onChange={(e) => setPaymentDate(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Amount (UGX) *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={amount_ugx}
                                onChange={(e) => setAmountUgx(e.target.value)}
                                required
                                max={remainingPayable}
                            />
                            {selectedPO && Number(amount_ugx) > remainingPayable && (
                                <small style={{ color: "#ef4444" }}>Amount exceeds remaining payable</small>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Payment Method *</label>
                            <select value={payment_method} onChange={(e) => setPaymentMethod(e.target.value)} required>
                                <option value="CASH">CASH</option>
                                <option value="BANK">BANK</option>
                                <option value="MOBILE_MONEY">MOBILE_MONEY</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Reference Number</label>
                            <input type="text" value={reference_number} onChange={(e) => setReferenceNumber(e.target.value)} />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading || (selectedPO && Number(amount_ugx) > remainingPayable)}>
                            {loading ? "Recording..." : "Record Payment"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Payment History</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Supplier</th>
                                    <th>Amount</th>
                                    <th>Method</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td><strong>{payment.purchase_order?.po_number || "—"}</strong></td>
                                        <td>{payment.supplier?.name || "—"}</td>
                                        <td>UGX {payment.amount_ugx.toLocaleString()}</td>
                                        <td>{payment.payment_method}</td>
                                        <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[payment.status.toLowerCase()]}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {payments.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={styles.empty}>No payments yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
