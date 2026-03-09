import { useState, useEffect } from "react";
import styles from "../accounting.module.css";

export default function ExpenseRecording() {
    const [formData, setFormData] = useState({
        category: "transport",
        description: "",
        amount: "",
        expenseDate: new Date().toISOString().split("T")[0],
        paymentMethodId: "",
    });
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetch("/api/admin/payment-methods")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setPaymentMethods(data);
                    if (data.length > 0) {
                        const cash = data.find((pm: any) => pm.code === "CASH");
                        if (cash) setFormData((prev) => ({ ...prev, paymentMethodId: cash.id }));
                    }
                }
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            const res = await fetch("/api/admin/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setSuccess(true);
                setFormData({
                    category: "transport",
                    description: "",
                    amount: "",
                    expenseDate: new Date().toISOString().split("T")[0],
                    paymentMethodId: paymentMethods.find((pm: any) => pm.code === "CASH")?.id || "",
                });
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const err = await res.json();
                alert(err.error || "Failed to record expense");
            }
        } catch (error) {
            alert("Failed to record expense");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className={styles.viewSection}>
            <h2 className={styles.sectionTitle}>Record Expense</h2>
            <p className={styles.sectionSubtitle}>Record all company expenses (bills, labor, utilities, etc.)</p>
            {success && <div style={{ padding: "1rem", background: "#dcfce7", color: "#166534", borderRadius: "0.5rem", marginBottom: "1rem" }}>Expense recorded successfully!</div>}
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGrid}>
                    <div className={styles.inputGroup}>
                        <label>Category *</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        >
                            <option value="transport">Transport</option>
                            <option value="labor">Labor</option>
                            <option value="packaging">Packaging</option>
                            <option value="utilities">Utilities</option>
                            <option value="marketing">Marketing</option>
                            <option value="equipment">Equipment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Description *</label>
                        <input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            placeholder="e.g., Fuel for delivery van"
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
                        <label>Date *</label>
                        <input
                            type="date"
                            value={formData.expenseDate}
                            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Payment Method *</label>
                        <select
                            value={formData.paymentMethodId}
                            onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                            required
                        >
                            <option value="">Select Payment Method</option>
                            {paymentMethods.map((pm) => (
                                <option key={pm.id} value={pm.id}>{pm.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? "Recording..." : "Record Expense"}
                </button>
            </form>
        </section>
    );
}
