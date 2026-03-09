"use client";

import { useState, useEffect } from "react";
import styles from "./expenses.module.css";
import ExportButton from "@/components/Admin/ExportButton";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

type ExpenseDashboard = {
    expenses: any[];
    paymentMethods: any[];
    categoryDistribution: { name: string; value: number }[];
    trend: { date: string; amount: number }[];
    stats: {
        totalMonth: number;
        topCategory: string;
        methodBreakdown: { name: string; total: number }[];
    };
};

export default function ExpensesPage() {
    const [dashboard, setDashboard] = useState<ExpenseDashboard | null>(null);
    const [loading, setLoading] = useState(true);

    // Form State
    const [category, setCategory] = useState("transport");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
    const [paymentMethodId, setPaymentMethodId] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    const categories = ["transport", "labor", "packaging", "utilities", "marketing", "equipment", "other"];
    const COLORS = ['#3e1c33', '#f97316', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/expenses/dashboard");
            if (res.ok) {
                const data = await res.json();
                setDashboard(data);
                if (data.paymentMethods.length > 0 && !paymentMethodId) {
                    setPaymentMethodId(data.paymentMethods[0].id);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const res = await fetch("/api/admin/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category, description, amount, expenseDate, paymentMethodId }),
            });

            if (res.ok) {
                setDescription("");
                setAmount("");
                fetchDashboard();
            }
        } catch (error) {
            alert("Failed to save expense");
        } finally {
            setFormLoading(false);
        }
    };

    const formatCurrency = (val: any) => `UGX ${Number(val || 0).toLocaleString()}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });

    return (
        <div className={styles.container} id="expenses-dashboard">
            <header className={styles.header}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1>Operating Expenses (OpEx)</h1>
                        <p className={styles.purpose}>
                            <strong>Financial Control:</strong> Track all daily expenditures to maintain accurate net profit calculations.
                        </p>
                    </div>
                    <ExportButton elementId="expenses-dashboard" filename={`Expenses_Report_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </header>

            {/* Dashboards */}
            {!loading && dashboard && (
                <section className={styles.kpiSection} style={{ marginBottom: "2rem" }}>
                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>💸</div>
                            <div className={styles.kpiContent}>
                                <h3 className={styles.kpiLabel}>Monthly Total</h3>
                                <p className={styles.kpiValue}>{formatCurrency(dashboard.stats.totalMonth)}</p>
                                <span className={styles.kpiUnit}>All categories</span>
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>🏷️</div>
                            <div className={styles.kpiContent}>
                                <h3 className={styles.kpiLabel}>Highest Spender</h3>
                                <p className={styles.kpiValue} style={{ fontSize: "1.25rem" }}>{dashboard.stats.topCategory.toUpperCase()}</p>
                                <span className={styles.kpiUnit}>Priority cost area</span>
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>💳</div>
                            <div className={styles.kpiContent}>
                                <h3 className={styles.kpiLabel}>Main Method</h3>
                                <p className={styles.kpiValue} style={{ fontSize: "1.25rem" }}>{dashboard.stats.methodBreakdown[0]?.name || "N/A"}</p>
                                <span className={styles.kpiUnit}>Primary payment source</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "350px", background: "white" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Spending by Category</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dashboard.categoryDistribution}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {dashboard.categoryDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={formatCurrency} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "350px", background: "white" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>7-Day Expense Trend</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboard.trend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} />
                                        <Tooltip formatter={formatCurrency} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="amount" fill="#f97316" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>Record New Expense</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Description</label>
                            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Fuel for delivery bike" required />
                        </div>
                        <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}>
                                <label>Amount (UGX)</label>
                                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Date</label>
                                <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} required />
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Payment Method</label>
                            <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
                                {dashboard?.paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                            {formLoading ? "Recording..." : "Save Expense Transaction"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard?.expenses.map((ex) => (
                                    <tr key={ex.id}>
                                        <td>{new Date(ex.expenseDate).toLocaleDateString()}</td>
                                        <td><span className={styles.catTag}>{ex.category}</span></td>
                                        <td>{ex.description}</td>
                                        <td className={styles.amount}>{formatCurrency(ex.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
