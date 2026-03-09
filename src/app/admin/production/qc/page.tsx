"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../production.module.css";

function QualityControlContent() {
    const searchParams = useSearchParams();
    const batchIdParam = searchParams.get("batchId");

    const [batches, setBatches] = useState<any[]>([]);
    const [qcChecks, setQcChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [batch_id, setBatchId] = useState(batchIdParam || "");
    const [temperature_ok, setTemperatureOk] = useState(false);
    const [hygiene_ok, setHygieneOk] = useState(false);
    const [taste_ok, setTasteOk] = useState(false);
    const [status, setStatus] = useState("APPROVED");
    const [remarks, setRemarks] = useState("");

    useEffect(() => {
        fetchBatches();
        fetchQCChecks();
    }, []);

    const fetchBatches = async () => {
        const res = await fetch("/api/admin/production/batches");
        const data = await res.json();
        if (Array.isArray(data)) {
            const pendingBatches = data.filter((b: any) => b.status === "QC_PENDING");
            setBatches(pendingBatches);
        }
    };

    const fetchQCChecks = async () => {
        const res = await fetch("/api/admin/production/qc");
        const data = await res.json();
        if (Array.isArray(data)) setQcChecks(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batch_id || !status) {
            alert("Please select a batch and set QC status");
            return;
        }

        if (status === "APPROVED" && (!temperature_ok || !hygiene_ok || !taste_ok)) {
            alert("All checks must pass for approval");
            return;
        }

        setLoading(true);
        try {
            const checked_by = "admin-user-id"; // TODO: Get from auth session

            const res = await fetch("/api/admin/production/qc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batch_id,
                    checked_by,
                    temperature_ok,
                    hygiene_ok,
                    taste_ok,
                    status,
                    remarks,
                }),
            });

            if (res.ok) {
                setBatchId("");
                setTemperatureOk(false);
                setHygieneOk(false);
                setTasteOk(false);
                setStatus("APPROVED");
                setRemarks("");
                fetchBatches();
                fetchQCChecks();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to submit QC check");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to submit QC check");
        } finally {
            setLoading(false);
        }
    };

    const selectedBatch = batches.find(b => b.id === batch_id);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/production" className={styles.backLink}>← Back to Production</Link>
                    <h1>Quality Control</h1>
                    <p className={styles.purpose}>Approve or reject batches based on quality standards. Batches must be approved before packaging.</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>QC Check</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Batch ID *</label>
                            <select value={batch_id} onChange={(e) => setBatchId(e.target.value)} required>
                                <option value="">Select batch</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.batch_code} - {b.juice_type} ({b.output_liters}L)
                                    </option>
                                ))}
                            </select>
                            {selectedBatch && (
                                <small style={{ color: "#64748b", marginTop: "0.25rem" }}>
                                    Started: {new Date(selectedBatch.start_time).toLocaleString()}
                                </small>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={temperature_ok}
                                    onChange={(e) => setTemperatureOk(e.target.checked)}
                                />
                                Temperature OK
                            </label>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={hygiene_ok}
                                    onChange={(e) => setHygieneOk(e.target.checked)}
                                />
                                Hygiene OK
                            </label>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={taste_ok}
                                    onChange={(e) => setTasteOk(e.target.checked)}
                                />
                                Taste OK
                            </label>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Status *</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} required>
                                <option value="APPROVED">APPROVED</option>
                                <option value="REJECTED">REJECTED</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={3}
                                placeholder="Additional notes or observations..."
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Submitting..." : "Submit QC Check"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>QC History</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Batch Code</th>
                                    <th>Juice Type</th>
                                    <th>Status</th>
                                    <th>Checked By</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {qcChecks.map((qc) => (
                                    <tr key={qc.id}>
                                        <td><strong>{qc.batch?.batch_code || "—"}</strong></td>
                                        <td>{qc.batch?.juice_type || "—"}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[qc.status.toLowerCase()]}`}>
                                                {qc.status}
                                            </span>
                                        </td>
                                        <td>{qc.checked_by}</td>
                                        <td>{new Date(qc.checked_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {qcChecks.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className={styles.empty}>No QC checks yet</td>
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

export default function QualityControlPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QualityControlContent />
        </Suspense>
    );
}
