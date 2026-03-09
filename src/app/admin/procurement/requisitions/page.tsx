"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../production/production.module.css";

export default function RequisitionsPage() {
    const [requisitions, setRequisitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [requisition_date, setRequisitionDate] = useState(new Date().toISOString().split("T")[0]);
    const [requested_by, setRequestedBy] = useState("");
    const [item_name, setItemName] = useState("");
    const [category, setCategory] = useState("");
    const [quantity_requested, setQuantityRequested] = useState("");
    const [required_date, setRequiredDate] = useState("");
    const [reason, setReason] = useState("");
    const [linked_production_plan_id, setLinkedProductionPlanId] = useState("");

    useEffect(() => {
        fetchRequisitions();
    }, []);

    const fetchRequisitions = async () => {
        const res = await fetch("/api/admin/procurement/requisitions");
        const data = await res.json();
        if (Array.isArray(data)) setRequisitions(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!requisition_date || !requested_by || !item_name || !category || !quantity_requested || !required_date) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/procurement/requisitions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    requisition_date,
                    requested_by,
                    item_name,
                    category,
                    quantity_requested: Number(quantity_requested),
                    required_date,
                    reason,
                    linked_production_plan_id: linked_production_plan_id || null,
                }),
            });

            if (res.ok) {
                setRequisitionDate(new Date().toISOString().split("T")[0]);
                setRequestedBy("");
                setItemName("");
                setCategory("");
                setQuantityRequested("");
                setRequiredDate("");
                setReason("");
                setLinkedProductionPlanId("");
                fetchRequisitions();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create requisition");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create requisition");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, status: string) => {
        try {
            const res = await fetch("/api/admin/procurement/requisitions", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            });

            if (res.ok) {
                fetchRequisitions();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to update requisition");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to update requisition");
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/procurement" className={styles.backLink}>← Back to Procurement</Link>
                    <h1>Purchase Requisitions</h1>
                    <p className={styles.purpose}>Create and approve purchase requisitions. PO cannot be created from unapproved requisition.</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>New Requisition</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Requisition Date *</label>
                            <input type="date" value={requisition_date} onChange={(e) => setRequisitionDate(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Requested By *</label>
                            <input type="text" value={requested_by} onChange={(e) => setRequestedBy(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Item Name *</label>
                            <input type="text" value={item_name} onChange={(e) => setItemName(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Category *</label>
                            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Quantity Requested *</label>
                            <input type="number" step="0.1" value={quantity_requested} onChange={(e) => setQuantityRequested(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Required Date *</label>
                            <input type="date" value={required_date} onChange={(e) => setRequiredDate(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Reason</label>
                            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Linked Production Plan ID</label>
                            <input type="text" value={linked_production_plan_id} onChange={(e) => setLinkedProductionPlanId(e.target.value)} />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Creating..." : "Create Requisition"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Requisitions</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Item</th>
                                    <th>Quantity</th>
                                    <th>Requested By</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requisitions.map((req) => (
                                    <tr key={req.id}>
                                        <td>{new Date(req.requisition_date).toLocaleDateString()}</td>
                                        <td>{req.item_name}</td>
                                        <td>{req.quantity_requested}</td>
                                        <td>{req.requested_by}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[req.status.toLowerCase()]}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td>
                                            {req.status === "PENDING" && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(req.id, "APPROVED")}
                                                        className={styles.actionBtn}
                                                        style={{ marginRight: "0.5rem" }}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(req.id, "REJECTED")}
                                                        className={styles.actionBtn}
                                                        style={{ background: "#ef4444" }}
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {requisitions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={styles.empty}>No requisitions yet</td>
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
