"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../production/production.module.css";

export default function GoodsReceiptsPage() {
    const [grns, setGRNs] = useState<any[]>([]);
    const [pos, setPOs] = useState<any[]>([]);
    const [selectedPO, setSelectedPO] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [po_id, setPOId] = useState("");
    const [received_date, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
    const [received_by, setReceivedBy] = useState("");
    const [remarks, setRemarks] = useState("");
    const [items, setItems] = useState<Array<{ item_name: string; quantity_received: string; accepted: boolean }>>([]);

    useEffect(() => {
        fetchGRNs();
        fetchPOs();
    }, []);

    const fetchGRNs = async () => {
        const res = await fetch("/api/admin/procurement/goods-receipts");
        const data = await res.json();
        if (Array.isArray(data)) setGRNs(data);
    };

    const fetchPOs = async () => {
        const res = await fetch("/api/admin/procurement/purchase-orders");
        const data = await res.json();
        if (Array.isArray(data)) {
            const openPOs = data.filter((po: any) => po.status === "OPEN" || po.status === "PARTIAL");
            setPOs(openPOs);
        }
    };

    useEffect(() => {
        if (po_id) {
            const po = pos.find(p => p.id === po_id);
            setSelectedPO(po);
            if (po) {
                // Initialize items from PO
                setItems(po.items.map((item: any) => ({
                    item_name: item.item_name,
                    quantity_received: "",
                    accepted: true,
                })));
            }
        } else {
            setSelectedPO(null);
            setItems([]);
        }
    }, [po_id, pos]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!po_id || !received_date || !received_by || items.length === 0) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/procurement/goods-receipts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    po_id,
                    received_date,
                    received_by,
                    items: items.filter(i => i.quantity_received),
                    remarks,
                }),
            });

            if (res.ok) {
                setPOId("");
                setReceivedDate(new Date().toISOString().split("T")[0]);
                setReceivedBy("");
                setRemarks("");
                setItems([]);
                fetchGRNs();
                fetchPOs();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create goods receipt");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create goods receipt");
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (index: number, field: string, value: string | boolean) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/procurement" className={styles.backLink}>← Back to Procurement</Link>
                    <h1>Goods Receipts (GRN)</h1>
                    <p className={styles.purpose}>Record goods receipts. No GRN → no inventory update.</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>New Goods Receipt</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>PO Number *</label>
                            <select value={po_id} onChange={(e) => setPOId(e.target.value)} required>
                                <option value="">Select PO</option>
                                {pos.map((po) => (
                                    <option key={po.id} value={po.id}>
                                        {po.po_number} - {po.supplier?.name} (UGX {po.total_value_ugx.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedPO && (
                            <div style={{ padding: "1rem", background: "#f8fafc", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                                <strong>PO Details:</strong>
                                <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.5rem" }}>
                                    {selectedPO.items.map((item: any, idx: number) => (
                                        <li key={idx}>
                                            {item.item_name}: {item.quantity_ordered} ordered @ UGX {item.unit_price_ugx.toLocaleString()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label>Received Date *</label>
                            <input type="date" value={received_date} onChange={(e) => setReceivedDate(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Received By *</label>
                            <input type="text" value={received_by} onChange={(e) => setReceivedBy(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Items Received *</label>
                            {items.map((item, idx) => (
                                <div key={idx} style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "0.5rem" }}>
                                    <div style={{ fontWeight: "600", marginBottom: "0.5rem" }}>{item.item_name}</div>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Quantity received"
                                        value={item.quantity_received}
                                        onChange={(e) => updateItem(idx, "quantity_received", e.target.value)}
                                        style={{ width: "100%", marginBottom: "0.5rem" }}
                                    />
                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <input
                                            type="checkbox"
                                            checked={item.accepted}
                                            onChange={(e) => updateItem(idx, "accepted", e.target.checked)}
                                        />
                                        Accepted
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                                placeholder="Additional notes..."
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading || !po_id || items.length === 0}>
                            {loading ? "Recording..." : "Record Goods Receipt"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Goods Receipts</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Received Date</th>
                                    <th>Received By</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grns.map((grn) => (
                                    <tr key={grn.id}>
                                        <td><strong>{grn.purchase_order?.po_number || "—"}</strong></td>
                                        <td>{new Date(grn.received_date).toLocaleDateString()}</td>
                                        <td>{grn.received_by}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[grn.status.toLowerCase()]}`}>
                                                {grn.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {grns.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className={styles.empty}>No goods receipts yet</td>
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
