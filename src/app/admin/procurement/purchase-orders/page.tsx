"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../production/production.module.css";

export default function PurchaseOrdersPage() {
    const [pos, setPOs] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [supplier_id, setSupplierId] = useState("");
    const [order_date, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
    const [expected_delivery_date, setExpectedDeliveryDate] = useState("");
    const [approved_by, setApprovedBy] = useState("");
    const [items, setItems] = useState<Array<{ item_name: string; quantity_ordered: string; unit_price_ugx: string }>>([]);

    useEffect(() => {
        fetchPOs();
        fetchSuppliers();
    }, []);

    const fetchPOs = async () => {
        const res = await fetch("/api/admin/procurement/purchase-orders");
        const data = await res.json();
        if (Array.isArray(data)) setPOs(data);
    };

    const fetchSuppliers = async () => {
        const res = await fetch("/api/admin/procurement/suppliers");
        const data = await res.json();
        if (Array.isArray(data)) {
            const activeSuppliers = data.filter((s: any) => s.status === "ACTIVE");
            setSuppliers(activeSuppliers);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplier_id || !order_date || !expected_delivery_date || !approved_by || items.length === 0) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/procurement/purchase-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supplier_id,
                    order_date,
                    expected_delivery_date,
                    approved_by,
                    items,
                }),
            });

            if (res.ok) {
                setSupplierId("");
                setOrderDate(new Date().toISOString().split("T")[0]);
                setExpectedDeliveryDate("");
                setApprovedBy("");
                setItems([]);
                fetchPOs();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create purchase order");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create purchase order");
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { item_name: "", quantity_ordered: "", unit_price_ugx: "" }]);
    };

    const updateItem = (index: number, field: string, value: string) => {
        const updated = [...items];
        updated[index] = { ...updated[index], [field]: value };
        setItems(updated);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const total_value = items.reduce((sum, item) => {
        return sum + (Number(item.quantity_ordered) * Number(item.unit_price_ugx));
    }, 0);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/procurement" className={styles.backLink}>← Back to Procurement</Link>
                    <h1>Purchase Orders</h1>
                    <p className={styles.purpose}>Create purchase orders. No PO → no goods receipt.</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>New Purchase Order</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Supplier *</label>
                            <select value={supplier_id} onChange={(e) => setSupplierId(e.target.value)} required>
                                <option value="">Select supplier</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} - {s.supplier_type}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Order Date *</label>
                            <input type="date" value={order_date} onChange={(e) => setOrderDate(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Expected Delivery Date *</label>
                            <input type="date" value={expected_delivery_date} onChange={(e) => setExpectedDeliveryDate(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Approved By *</label>
                            <input type="text" value={approved_by} onChange={(e) => setApprovedBy(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Items *</label>
                            <button type="button" onClick={addItem} className={styles.addBtn}>+ Add Item</button>
                            {items.map((item, idx) => (
                                <div key={idx} className={styles.materialRow}>
                                    <input
                                        placeholder="Item name"
                                        value={item.item_name}
                                        onChange={(e) => updateItem(idx, "item_name", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Qty"
                                        value={item.quantity_ordered}
                                        onChange={(e) => updateItem(idx, "quantity_ordered", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Unit Price (UGX)"
                                        value={item.unit_price_ugx}
                                        onChange={(e) => updateItem(idx, "unit_price_ugx", e.target.value)}
                                        required
                                    />
                                    <button type="button" onClick={() => removeItem(idx)} className={styles.removeBtn}>×</button>
                                </div>
                            ))}
                        </div>

                        {items.length > 0 && (
                            <div className={styles.summaryBox}>
                                <div className={styles.summaryRow}>
                                    <span>Total Value (auto):</span>
                                    <strong>UGX {total_value.toLocaleString()}</strong>
                                </div>
                            </div>
                        )}

                        <button type="submit" className={styles.submitBtn} disabled={loading || items.length === 0}>
                            {loading ? "Creating..." : "Create Purchase Order"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Purchase Orders</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Supplier</th>
                                    <th>Order Date</th>
                                    <th>Total Value</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pos.map((po) => (
                                    <tr key={po.id}>
                                        <td><strong>{po.po_number}</strong></td>
                                        <td>{po.supplier?.name || "—"}</td>
                                        <td>{new Date(po.order_date).toLocaleDateString()}</td>
                                        <td>UGX {po.total_value_ugx.toLocaleString()}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[po.status.toLowerCase()]}`}>
                                                {po.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {pos.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className={styles.empty}>No purchase orders yet</td>
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
