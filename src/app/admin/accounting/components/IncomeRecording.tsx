import { useState } from "react";
import styles from "../accounting.module.css";

export default function IncomeRecording() {
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        paymentMethod: "CASH",
        date: new Date().toISOString().split("T")[0],
        category: "OTHER",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/accounting/income", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setSuccess(true);
                setFormData({
                    description: "",
                    amount: "",
                    paymentMethod: "CASH",
                    date: new Date().toISOString().split("T")[0],
                    category: "OTHER",
                });
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to record income");
            }
        } catch (error) {
            alert("Failed to record income");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className={styles.viewSection}>
            <h2 className={styles.sectionTitle}>Record Income</h2>
            <p className={styles.sectionSubtitle}>Record all company income (sales, services, miscellaneous)</p>
            {success && <div style={{ padding: "1rem", background: "#dcfce7", color: "#166534", borderRadius: "0.5rem", marginBottom: "1rem" }}>Income recorded successfully!</div>}
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGrid}>
                    <div className={styles.inputGroup}>
                        <label>Description *</label>
                        <input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            placeholder="e.g., Consulting fee, Rental income"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Amount (UGX) *</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Payment Method *</label>
                        <select
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                            required
                        >
                            <option value="CASH">Cash</option>
                            <option value="BANK">Bank Transfer</option>
                            <option value="MTN">MTN Mobile Money</option>
                            <option value="AIRTEL">Airtel Money</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Date *</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="OTHER">Other Income</option>
                            <option value="EVENT">Event Income</option>
                            <option value="SALES">Sales Income</option>
                            <option value="SERVICES">Services Income</option>
                        </select>
                    </div>
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? "Recording..." : "Record Income"}
                </button>
            </form>
        </section>
    );
}
