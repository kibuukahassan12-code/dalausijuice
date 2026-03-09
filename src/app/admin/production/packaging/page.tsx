"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../production.module.css";

const PRICE_PER_LITER = 10000;

function PackagingContent() {
    const searchParams = useSearchParams();
    const batchIdParam = searchParams.get("batchId");

    const [batches, setBatches] = useState<any[]>([]);
    const [packaging, setPackaging] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [batch_id, setBatchId] = useState(batchIdParam || "");
    const [package_type, setPackageType] = useState("BOTTLE");
    const [package_size_liters, setPackageSizeLiters] = useState("1");
    const [quantity, setQuantity] = useState("");

    useEffect(() => {
        fetchBatches();
        fetchPackaging();
    }, []);

    const fetchBatches = async () => {
        const res = await fetch("/api/admin/production/batches");
        const data = await res.json();
        if (Array.isArray(data)) {
            const approvedBatches = data.filter((b: any) => b.status === "APPROVED");
            setBatches(approvedBatches);
        }
    };

    const fetchPackaging = async () => {
        const res = await fetch("/api/admin/production/packaging");
        const data = await res.json();
        if (Array.isArray(data)) setPackaging(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batch_id || !quantity) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/production/packaging", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    batch_id,
                    package_type,
                    package_size_liters: Number(package_size_liters),
                    quantity: Number(quantity),
                }),
            });

            if (res.ok) {
                setQuantity("");
                fetchBatches();
                fetchPackaging();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create packaging record");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create packaging record");
        } finally {
            setLoading(false);
        }
    };

    const selectedBatch = batches.find(b => b.id === batch_id);
    const sizeLiters = parseFloat(package_size_liters);
    const total_liters = sizeLiters * Number(quantity || 0);
    const total_value_ugx = total_liters * PRICE_PER_LITER;

    // Calculate already packaged
    const alreadyPackaged = selectedBatch
        ? packaging
            .filter(p => p.batch_id === selectedBatch.id)
            .reduce((sum, p) => sum + p.total_liters, 0)
        : 0;

    const availableLiters = selectedBatch ? selectedBatch.output_liters - alreadyPackaged : 0;

    // Event production: disable BOTTLE option
    const isEventProduction = selectedBatch?.plan?.production_type === "EVENT";

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/production" className={styles.backLink}>← Back to Production</Link>
                    <h1>Packaging & Finished Goods</h1>
                    <p className={styles.purpose}>Package approved batches into finished goods. Only QC-approved batches can be packaged.</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>Package Batch</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Batch ID *</label>
                            <select value={batch_id} onChange={(e) => setBatchId(e.target.value)} required>
                                <option value="">Select batch</option>
                                {batches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.batch_code} - {b.juice_type} ({b.output_liters}L output)
                                    </option>
                                ))}
                            </select>
                            {selectedBatch && (
                                <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "#64748b" }}>
                                    <div>Available: {availableLiters.toFixed(1)}L</div>
                                    <div>Already packaged: {alreadyPackaged.toFixed(1)}L</div>
                                    {isEventProduction && (
                                        <div style={{ color: "#ef4444", fontWeight: "600" }}>⚠️ Event production - JERRYCAN only</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Package Type *</label>
                            <select
                                value={package_type}
                                onChange={(e) => setPackageType(e.target.value)}
                                required
                                disabled={isEventProduction}
                            >
                                <option value="BOTTLE">BOTTLE</option>
                                <option value="JERRYCAN">JERRYCAN</option>
                            </select>
                            {isEventProduction && package_type === "BOTTLE" && (
                                <small style={{ color: "#ef4444" }}>Event production must use JERRYCAN</small>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Package Size (Liters) *</label>
                            <select value={package_size_liters} onChange={(e) => setPackageSizeLiters(e.target.value)} required>
                                {package_type === "BOTTLE" ? (
                                    <>
                                        <option value="1">1L</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="10">10L</option>
                                        <option value="15">15L</option>
                                        <option value="20">20L</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Quantity *</label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="Number of packages"
                                required
                                min="1"
                            />
                        </div>

                        {quantity && (
                            <div className={styles.summaryBox}>
                                <div className={styles.summaryRow}>
                                    <span>Total Liters (auto):</span>
                                    <strong>{total_liters.toFixed(1)}L</strong>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Total Value (auto):</span>
                                    <strong>UGX {total_value_ugx.toLocaleString()}</strong>
                                </div>
                                {selectedBatch && total_liters > availableLiters && (
                                    <small style={{ color: "#ef4444" }}>
                                        Warning: Exceeds available liters ({availableLiters.toFixed(1)}L)
                                    </small>
                                )}
                            </div>
                        )}

                        <button type="submit" className={styles.submitBtn} disabled={loading || (selectedBatch && total_liters > availableLiters)}>
                            {loading ? "Packaging..." : "Record Packaging"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Packaging Records</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Batch Code</th>
                                    <th>Package Type</th>
                                    <th>Size (L)</th>
                                    <th>Quantity</th>
                                    <th>Total Liters</th>
                                    <th>Total Value</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {packaging.map((p) => (
                                    <tr key={p.id}>
                                        <td><strong>{p.batch?.batch_code || "—"}</strong></td>
                                        <td>{p.package_type}</td>
                                        <td>{p.package_size_liters}</td>
                                        <td>{p.quantity}</td>
                                        <td>{p.total_liters.toFixed(1)}L</td>
                                        <td>UGX {p.total_value_ugx.toLocaleString()}</td>
                                        <td>{new Date(p.packaged_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {packaging.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className={styles.empty}>No packaging records yet</td>
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

export default function PackagingPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PackagingContent />
        </Suspense>
    );
}
