"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../production.module.css";

const BASE_PRICE_PER_LITER = 10000;

export default function WastagePage() {
    const [batches, setBatches] = useState<any[]>([]);
    const [wastage, setWastage] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [batchId, setBatchId] = useState("");
    const [quantityLiters, setQuantityLiters] = useState("");
    const [cause, setCause] = useState("");
    const [correctiveAction, setCorrectiveAction] = useState("");

    useEffect(() => {
        fetchBatches();
        fetchWastage();
    }, []);

    const fetchBatches = async () => {
        const res = await fetch("/api/admin/production/batches");
        const data = await res.json();
        if (Array.isArray(data)) setBatches(data);
    };

    const fetchWastage = async () => {
        const res = await fetch("/api/admin/production/wastage");
        const data = await res.json();
        if (Array.isArray(data)) setWastage(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!quantityLiters || !cause) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            // Get current user ID (simplified - in real app, get from session)
            const recordedById = "admin-user-id"; // TODO: Get from auth session

            const res = await fetch("/api/admin/production/wastage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batchId: batchId || null,
                    recordedById,
                    quantityLiters: Number(quantityLiters),
                    cause,
                    correctiveAction: correctiveAction || null,
                }),
            });

            if (res.ok) {
                setBatchId("");
                setQuantityLiters("");
                setCause("");
                setCorrectiveAction("");
                fetchBatches();
                fetchWastage();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to record wastage");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to record wastage");
        } finally {
            setLoading(false);
        }
    };

    const costImpact = Number(quantityLiters) * BASE_PRICE_PER_LITER;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/production" className={styles.backLink}>← Back to Production</Link>
                    <h1>Wastage & Incident Tracking</h1>
                    <p className={styles.purpose}>Record all wastage incidents with cause analysis and corrective actions</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>Record Wastage</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Batch (Optional)</label>
                            <select value={batchId} onChange={(e) => setBatchId(e.target.value)}>
                                <option value="">None - General Wastage</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.batchId} - {b.juiceType}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Quantity (Liters) *</label>
                            <input
                                type="number"
                                step="0.1"
                                value={quantityLiters}
                                onChange={(e) => setQuantityLiters(e.target.value)}
                                placeholder="e.g., 5.5"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Cause *</label>
                            <select value={cause} onChange={(e) => setCause(e.target.value)} required>
                                <option value="">Select cause</option>
                                <option value="Spillage">Spillage</option>
                                <option value="Contamination">Contamination</option>
                                <option value="Equipment_Failure">Equipment Failure</option>
                                <option value="Expiry">Expiry</option>
                                <option value="Quality_Rejection">Quality Rejection</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Corrective Action</label>
                            <textarea
                                value={correctiveAction}
                                onChange={(e) => setCorrectiveAction(e.target.value)}
                                rows={3}
                                placeholder="Describe corrective actions taken..."
                            />
                        </div>

                        {quantityLiters && (
                            <div className={styles.summaryBox}>
                                <div className={styles.summaryRow}>
                                    <span>Cost Impact:</span>
                                    <strong style={{ color: "#ef4444" }}>UGX {costImpact.toLocaleString()}</strong>
                                </div>
                                <small>Based on {quantityLiters}L × UGX {BASE_PRICE_PER_LITER.toLocaleString()}/L</small>
                            </div>
                        )}

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Recording..." : "Record Wastage"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Wastage Records</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Batch ID</th>
                                    <th>Quantity (L)</th>
                                    <th>Cause</th>
                                    <th>Cost Impact</th>
                                    <th>Recorded By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {wastage.map((w) => (
                                    <tr key={w.id}>
                                        <td>{new Date(w.recordedAt).toLocaleDateString()}</td>
                                        <td>{w.batch?.batchId || "—"}</td>
                                        <td>{w.quantityLiters.toFixed(1)}</td>
                                        <td>{w.cause}</td>
                                        <td>UGX {w.costImpact ? w.costImpact.toLocaleString() : "—"}</td>
                                        <td>{w.recordedBy?.name || "—"}</td>
                                    </tr>
                                ))}
                                {wastage.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={styles.empty}>No wastage records yet</td>
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
