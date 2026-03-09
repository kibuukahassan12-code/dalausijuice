"use client";

import { useState, useEffect } from "react";
import styles from "./revenue.module.css";

export default function RevenuePage() {
    const [revenues, setRevenues] = useState<any[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchRevenues = async () => {
        const res = await fetch("/api/admin/revenue");
        const data = await res.json();
        setRevenues(data);
    };

    useEffect(() => {
        fetchRevenues();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/admin/revenue", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, amount, description }),
            });

            if (res.ok) {
                setAmount("");
                setDescription("");
                fetchRevenues();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <section className={styles.formSection}>
                <h2>Record Daily Revenue</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Date</label>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Amount (UGX)</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500000" required />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Description (Optional)</label>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Daily shop sales" />
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? "Saving..." : "Save Record"}
                    </button>
                </form>
            </section>

            <section className={styles.listSection}>
                <h2>Revenue History</h2>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenues.map((rev) => (
                                <tr key={rev.id}>
                                    <td>{new Date(rev.date).toLocaleDateString()}</td>
                                    <td className={styles.amount}>UGX {rev.amount.toLocaleString()}</td>
                                    <td>{rev.description || "-"}</td>
                                </tr>
                            ))}
                            {revenues.length === 0 && (
                                <tr>
                                    <td colSpan={3} className={styles.empty}>No records found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
