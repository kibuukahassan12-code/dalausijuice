"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../production.module.css";

const PRICE_PER_LITER = 10000;

export default function ProductionPlanningPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [plan_date, setPlanDate] = useState(new Date().toISOString().split("T")[0]);
    const [juice_type, setJuiceType] = useState("");
    const [production_type, setProductionType] = useState("DAILY");
    const [event_id, setEventId] = useState("");
    const [target_liters, setTargetLiters] = useState("");

    useEffect(() => {
        fetchPlans();
        fetchProducts();
        fetchEvents();
    }, []);

    const fetchPlans = async () => {
        const res = await fetch("/api/admin/production/plans");
        const data = await res.json();
        if (Array.isArray(data)) setPlans(data);
    };

    const fetchProducts = async () => {
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
    };

    const fetchEvents = async () => {
        const res = await fetch("/api/admin/production/events");
        const data = await res.json();
        if (Array.isArray(data)) setEvents(data.filter((e: any) => e.production_status === "PLANNED" || !e.production_status));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!juice_type || !target_liters) {
            alert("Please fill all required fields");
            return;
        }

        if (production_type === "EVENT" && !event_id) {
            alert("Event ID is required for EVENT production type");
            return;
        }

        setLoading(true);
        try {
            const created_by = "admin-user-id"; // TODO: Get from auth session

            const res = await fetch("/api/admin/production/plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan_date,
                    juice_type,
                    production_type,
                    event_id: production_type === "EVENT" ? event_id : null,
                    target_liters: Number(target_liters),
                    created_by,
                }),
            });

            if (res.ok) {
                setPlanDate(new Date().toISOString().split("T")[0]);
                setJuiceType("");
                setProductionType("DAILY");
                setEventId("");
                setTargetLiters("");
                fetchPlans();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create plan");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create production plan");
        } finally {
            setLoading(false);
        }
    };

    const expected_revenue = Number(target_liters) * PRICE_PER_LITER;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/production" className={styles.backLink}>← Back to Production</Link>
                    <h1>Daily Production Planning</h1>
                    <p className={styles.purpose}>Plan daily juice production targets based on sales orders and events</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>New Production Plan</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Plan Date *</label>
                            <input type="date" value={plan_date} onChange={(e) => setPlanDate(e.target.value)} required />
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
                            <label>Production Type *</label>
                            <select value={production_type} onChange={(e) => { setProductionType(e.target.value); setEventId(""); }} required>
                                <option value="DAILY">DAILY</option>
                                <option value="EVENT">EVENT</option>
                            </select>
                        </div>

                        {production_type === "EVENT" && (
                            <div className={styles.inputGroup}>
                                <label>Event ID *</label>
                                <select value={event_id} onChange={(e) => setEventId(e.target.value)} required>
                                    <option value="">Select event</option>
                                    {events.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.client_name} - {new Date(e.eventDate).toLocaleDateString()} ({e.ordered_liters}L)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <label>Target Liters *</label>
                            <input
                                type="number"
                                step="0.1"
                                value={target_liters}
                                onChange={(e) => setTargetLiters(e.target.value)}
                                placeholder="e.g., 500"
                                required
                            />
                        </div>

                        <div className={styles.summaryBox}>
                            <div className={styles.summaryRow}>
                                <span>Expected Revenue (auto):</span>
                                <strong>UGX {expected_revenue.toLocaleString()}</strong>
                            </div>
                            <small>Calculated: {target_liters || 0}L × UGX {PRICE_PER_LITER.toLocaleString()}/L</small>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Creating..." : "Create Production Plan"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Production Plans</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Juice Type</th>
                                    <th>Type</th>
                                    <th>Target (L)</th>
                                    <th>Expected Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((plan) => (
                                    <tr key={plan.id}>
                                        <td>{new Date(plan.plan_date).toLocaleDateString()}</td>
                                        <td>{plan.juice_type}</td>
                                        <td>{plan.production_type}</td>
                                        <td>{plan.target_liters.toFixed(1)}</td>
                                        <td>UGX {plan.expected_revenue_ugx.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {plans.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className={styles.empty}>No production plans yet</td>
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
