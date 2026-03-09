"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../hr.module.css";

export default function PayrollPage() {
    const [payrolls, setPayrolls] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    });
    const [formData, setFormData] = useState({
        employeeId: "",
        month: "",
        grossPay: "",
        deductions: "0",
        paymentMethod: "CASH",
    });

    useEffect(() => {
        fetchPayrolls();
        fetchEmployees();
    }, [selectedMonth]);

    const fetchPayrolls = async () => {
        try {
            const url = `/api/admin/hr/payroll?month=${selectedMonth}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setPayrolls(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching payroll:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/admin/hr/employees");
            if (res.ok) {
                const data = await res.json();
                setEmployees(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/hr/payroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                fetchPayrolls();
                setShowForm(false);
                setFormData({
                    employeeId: "",
                    month: "",
                    grossPay: "",
                    deductions: "0",
                    paymentMethod: "CASH",
                });
            } else {
                const err = await res.json();
                alert(err.error || "Failed to process payroll");
            }
        } catch (error) {
            alert("Failed to process payroll");
        }
    };

    if (loading) {
        return <div className={styles.container}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin/hr" className={styles.backLink}>← Back to HR</Link>
                <h1>Payroll Processing</h1>
            </header>

            <section className={styles.quickActions}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                    <h2 className={styles.sectionTitle}>Payroll Records</h2>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Month:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                        />
                        <button onClick={() => setShowForm(!showForm)} className={styles.submitBtn}>
                            {showForm ? "Cancel" : "+ Process Payroll"}
                        </button>
                    </div>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}>
                                <label>Employee *</label>
                                <select
                                    value={formData.employeeId}
                                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Employee</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.firstName} {emp.lastName} ({emp.employeeNo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Month *</label>
                                <input
                                    type="month"
                                    value={formData.month}
                                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Gross Pay (UGX) *</label>
                                <input
                                    type="number"
                                    value={formData.grossPay}
                                    onChange={(e) => setFormData({ ...formData, grossPay: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Deductions (UGX)</label>
                                <input
                                    type="number"
                                    value={formData.deductions}
                                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                                    min="0"
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
                        </div>
                        <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#f0f9ff", borderRadius: "0.5rem", fontSize: "0.875rem" }}>
                            <strong>Net Pay:</strong> UGX{" "}
                            {Math.max(0, (parseInt(formData.grossPay || "0") - parseInt(formData.deductions || "0"))).toLocaleString()}
                        </div>
                        <button type="submit" className={styles.submitBtn}>Process Payroll</button>
                    </form>
                )}

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Month</th>
                                <th>Gross Pay</th>
                                <th>Deductions</th>
                                <th>Net Pay</th>
                                <th>Status</th>
                                <th>Processed At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrolls.map((pay) => (
                                <tr key={pay.id}>
                                    <td>{pay.employee?.firstName} {pay.employee?.lastName}</td>
                                    <td>{pay.month}</td>
                                    <td>UGX {pay.grossPay?.toLocaleString() ?? "0"}</td>
                                    <td>UGX {pay.deductions?.toLocaleString() ?? "0"}</td>
                                    <td>UGX {pay.netPay?.toLocaleString() ?? "0"}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${pay.status === "PAID" ? styles.active : ""}`}>
                                            {pay.status}
                                        </span>
                                    </td>
                                    <td>
                                        {pay.processedAt
                                            ? new Date(pay.processedAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })
                                            : "—"}
                                    </td>
                                </tr>
                            ))}
                            {payrolls.length === 0 && (
                                <tr>
                                    <td colSpan={7} className={styles.empty}>No payroll records for this month</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
