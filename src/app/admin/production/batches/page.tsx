"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../production.module.css";

export default function BatchProcessingPage() {
    const [batches, setBatches] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [plan_id, setPlanId] = useState("");
    const [juice_type, setJuiceType] = useState("");
    const [start_time, setStartTime] = useState(new Date().toISOString().slice(0, 16));
    const [staff_on_duty, setStaffOnDuty] = useState<string[]>([]);
    const [raw_materials_used, setRawMaterialsUsed] = useState<Array<{ material_name: string; quantity_used: string; unit: string; cost_ugx: string }>>([]);
    const [equipment_used, setEquipmentUsed] = useState("");

    useEffect(() => {
        fetchBatches();
        fetchPlans();
        fetchProducts();
    }, []);

    const fetchBatches = async () => {
        const res = await fetch("/api/admin/production/batches");
        const data = await res.json();
        if (Array.isArray(data)) setBatches(data);
    };

    const fetchPlans = async () => {
        const res = await fetch("/api/admin/production/plans");
        const data = await res.json();
        if (Array.isArray(data)) setPlans(data.filter((p: any) => !p.batches || p.batches.length === 0));
    };

    const fetchProducts = async () => {
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
    };

    const handleStartBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!juice_type || !start_time || raw_materials_used.length === 0) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/production/batches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan_id: plan_id || null,
                    juice_type,
                    start_time,
                    raw_materials_used,
                }),
            });

            if (res.ok) {
                setPlanId("");
                setJuiceType("");
                setStartTime(new Date().toISOString().slice(0, 16));
                setStaffOnDuty([]);
                setRawMaterialsUsed([]);
                setEquipmentUsed("");
                fetchBatches();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to start batch");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to start batch");
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteBatch = async (batchId: string) => {
        const output_liters = prompt("Enter output liters:");
        const wastage_liters = prompt("Enter wastage liters (if any):");

        if (!output_liters) {
            alert("Output liters is required");
            return;
        }

        try {
            const res = await fetch(`/api/admin/production/batches/${batchId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    end_time: new Date().toISOString(),
                    output_liters: Number(output_liters),
                    wastage_liters: Number(wastage_liters) || 0,
                }),
            });

            if (res.ok) {
                fetchBatches();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to complete batch");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to complete batch");
        }
    };

    const addRawMaterial = () => {
        setRawMaterialsUsed([...raw_materials_used, { material_name: "", quantity_used: "", unit: "kg", cost_ugx: "" }]);
    };

    const updateRawMaterial = (index: number, field: string, value: string) => {
        const updated = [...raw_materials_used];
        updated[index] = { ...updated[index], [field]: value };
        setRawMaterialsUsed(updated);
    };

    const removeRawMaterial = (index: number) => {
        setRawMaterialsUsed(raw_materials_used.filter((_, i) => i !== index));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/production" className={styles.backLink}>← Back to Production</Link>
                    <h1>Batch & Processing Management</h1>
                    <p className={styles.purpose}>Start production batches, track processing, and complete runs</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>Start New Batch</h2>
                    <form onSubmit={handleStartBatch} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Production Plan (Optional)</label>
                            <select value={plan_id} onChange={(e) => setPlanId(e.target.value)}>
                                <option value="">None - Manual Batch</option>
                                {plans.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.juice_type} - {new Date(p.plan_date).toLocaleDateString()} ({p.target_liters}L)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Juice Type *</label>
                            <select value={juice_type} onChange={(e) => setJuiceType(e.target.value)} required>
                                <option value="">Select juice type</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Start Time *</label>
                            <input
                                type="datetime-local"
                                value={start_time}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Staff on Duty (multi-select)</label>
                            <input
                                type="text"
                                value={staff_on_duty.join(", ")}
                                onChange={(e) => setStaffOnDuty(e.target.value.split(",").map(s => s.trim()).filter(s => s))}
                                placeholder="staff-1, staff-2"
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Raw Materials Used *</label>
                            <button type="button" onClick={addRawMaterial} className={styles.addBtn}>+ Add Material</button>
                            {raw_materials_used.map((rm, idx) => (
                                <div key={idx} className={styles.materialRow}>
                                    <input
                                        placeholder="Material name"
                                        value={rm.material_name}
                                        onChange={(e) => updateRawMaterial(idx, "material_name", e.target.value)}
                                        required
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="Qty"
                                        value={rm.quantity_used}
                                        onChange={(e) => updateRawMaterial(idx, "quantity_used", e.target.value)}
                                        required
                                    />
                                    <select
                                        value={rm.unit}
                                        onChange={(e) => updateRawMaterial(idx, "unit", e.target.value)}
                                    >
                                        <option value="kg">kg</option>
                                        <option value="liters">liters</option>
                                        <option value="pieces">pieces</option>
                                    </select>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Cost (UGX)"
                                        value={rm.cost_ugx}
                                        onChange={(e) => updateRawMaterial(idx, "cost_ugx", e.target.value)}
                                        required
                                    />
                                    <button type="button" onClick={() => removeRawMaterial(idx)} className={styles.removeBtn}>×</button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Equipment Used</label>
                            <textarea
                                value={equipment_used}
                                onChange={(e) => setEquipmentUsed(e.target.value)}
                                rows={2}
                                placeholder="List equipment used..."
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading || raw_materials_used.length === 0}>
                            {loading ? "Starting..." : "Start Batch"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Active & Recent Batches</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Batch Code</th>
                                    <th>Juice Type</th>
                                    <th>Status</th>
                                    <th>Output (L)</th>
                                    <th>Value (UGX)</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((batch) => (
                                    <tr key={batch.id}>
                                        <td><strong>{batch.batch_code}</strong></td>
                                        <td>{batch.juice_type}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[batch.status.toLowerCase().replace("_", "")]}`}>
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td>{batch.output_liters.toFixed(1)}</td>
                                        <td>{batch.batch_value_ugx ? `UGX ${batch.batch_value_ugx.toLocaleString()}` : "—"}</td>
                                        <td>
                                            {batch.status === "PROCESSING" && (
                                                <button
                                                    onClick={() => handleCompleteBatch(batch.id)}
                                                    className={styles.actionBtn}
                                                >
                                                    Complete
                                                </button>
                                            )}
                                            {batch.status === "QC_PENDING" && (
                                                <Link href={`/admin/production/qc?batchId=${batch.id}`} className={styles.actionBtn}>
                                                    QC Check
                                                </Link>
                                            )}
                                            {batch.status === "APPROVED" && (
                                                <Link href={`/admin/production/packaging?batchId=${batch.id}`} className={styles.actionBtn}>
                                                    Package
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {batches.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className={styles.empty}>No batches yet</td>
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
