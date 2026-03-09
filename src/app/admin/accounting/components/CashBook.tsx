import { useState, useEffect } from "react";
import styles from "../accounting.module.css";

export default function CashBook() {
    const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [cashBookData, setCashBookData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCashBook();
    }, [period, date]);

    const fetchCashBook = async () => {
        setLoading(true);
        try {
            const url = `/api/admin/accounting/cashbook?period=${period}&date=${date}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCashBookData(data);
            }
        } catch (error) {
            console.error("Error fetching cash book:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <section className={styles.viewSection}>
                <div style={{ textAlign: "center", padding: "2rem" }}>Loading cash book...</div>
            </section>
        );
    }

    return (
        <section className={styles.viewSection}>
            <h2 className={styles.sectionTitle}>Cash Book</h2>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Period:</label>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as "daily" | "weekly" | "monthly")}
                    style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
                {period === "daily" && (
                    <>
                        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Date:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                        />
                    </>
                )}
                {period === "monthly" && (
                    <>
                        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Month:</label>
                        <input
                            type="month"
                            value={date.substring(0, 7)}
                            onChange={(e) => setDate(e.target.value + "-01")}
                            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                        />
                    </>
                )}
                {period === "weekly" && (
                    <>
                        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Date (Week):</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                        />
                    </>
                )}
            </div>

            {cashBookData ? (
                <>
                    <div className={styles.kpiGrid} style={{ marginBottom: "2rem" }}>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>Total Income</div>
                            <div className={styles.kpiValue} style={{ color: "#166534" }}>
                                UGX {cashBookData.summary.totalIncome.toLocaleString()}
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>Total Expenses</div>
                            <div className={styles.kpiValue} style={{ color: "#991b1b" }}>
                                UGX {cashBookData.summary.totalExpenses.toLocaleString()}
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiLabel}>Net Cash Flow</div>
                            <div className={styles.kpiValue} style={{ color: cashBookData.summary.netCashFlow >= 0 ? "#166534" : "#991b1b" }}>
                                UGX {cashBookData.summary.netCashFlow.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: "2rem" }}>
                        <h3 className={styles.sectionTitle}>Cash Balances</h3>
                        <div className={styles.kpiGrid}>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiLabel}>Cash</div>
                                <div className={styles.kpiValue}>UGX {cashBookData.cashBalances.cash.closing.toLocaleString()}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiLabel}>Bank</div>
                                <div className={styles.kpiValue}>UGX {cashBookData.cashBalances.bank.closing.toLocaleString()}</div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiLabel}>Mobile Money</div>
                                <div className={styles.kpiValue}>UGX {cashBookData.cashBalances.mobileMoney.closing.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className={styles.sectionTitle}>Transactions by Date</h3>
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Incomes</th>
                                        <th>Expenses</th>
                                        <th>Net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashBookData.transactionsByDate.map((day: any, idx: number) => (
                                        <tr key={idx}>
                                            <td>{new Date(day.date).toLocaleDateString()}</td>
                                            <td style={{ color: "#166534" }}>UGX {day.totalIncome.toLocaleString()}</td>
                                            <td style={{ color: "#991b1b" }}>UGX {day.totalExpenses.toLocaleString()}</td>
                                            <td style={{ fontWeight: "bold", color: (day.totalIncome - day.totalExpenses) >= 0 ? "#166534" : "#991b1b" }}>
                                                UGX {(day.totalIncome - day.totalExpenses).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {cashBookData.transactionsByDate.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className={styles.empty}>No transactions for this period</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>No cash book data available</div>
            )}
        </section>
    );
}
