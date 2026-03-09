"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../accounting.module.css";

type ReportData = {
    date?: string;
    sales?: { bottles: number; jerrycans: number; events: number; total: number };
    cashPosition?: { cash: number; bank: number; mobileMoney: number };
    profitEstimate?: number;
    weekStart?: string;
    weekEnd?: string;
    salesTrend?: { date: string; sales: number }[];
    costPerLiterTrend?: { average: number; totalCost: number; totalLiters: number };
    wastageCost?: number;
    supplierSpend?: number;
    profitAndLoss?: {
        revenue: { bottles: number; jerrycans: number; events: number; total: number };
        cogs: { fruit: number; packaging: number; labor: number; utilities: number; total: number };
        grossProfit: number;
        expenses: { wastage: number; operating: number; total: number };
        netProfit: number;
    };
    period?: string;
    periodStatus?: string;
};

export default function AccountingReportsPage() {
    const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [reportType, reportDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            let url = `/api/admin/accounting/reports/${reportType}`;
            if (reportType === "daily") {
                url += `?date=${reportDate}`;
            } else if (reportType === "monthly") {
                const month = reportDate.substring(0, 7);
                url += `?month=${month}`;
            } else if (reportType === "weekly") {
                // Calculate week start from the selected date
                const selectedDate = new Date(reportDate);
                const weekStart = new Date(selectedDate);
                weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
                weekStart.setHours(0, 0, 0, 0);
                url += `?weekStart=${weekStart.toISOString().split("T")[0]}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            } else {
                setReportData(null);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        window.print();
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin/accounting" className={styles.backLink}>← Back to Accounting</Link>
                <h1>Accounting Reports</h1>
                <p className={styles.purpose}>
                    <strong>Purpose:</strong> Generate daily, weekly, and monthly financial reports from ledger entries.
                </p>
            </header>

            <section className={styles.quickActions}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Report Type:</label>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value as "daily" | "weekly" | "monthly")}
                            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        {reportType === "daily" && (
                            <>
                                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Date:</label>
                                <input
                                    type="date"
                                    value={reportDate}
                                    onChange={(e) => setReportDate(e.target.value)}
                                    style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                                />
                            </>
                        )}
                        {reportType === "monthly" && (
                            <>
                                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Month:</label>
                                <input
                                    type="month"
                                    value={reportDate.substring(0, 7)}
                                    onChange={(e) => setReportDate(e.target.value + "-01")}
                                    style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                                />
                            </>
                        )}
                        {reportType === "weekly" && (
                            <>
                                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Date (Week):</label>
                                <input
                                    type="date"
                                    value={reportDate}
                                    onChange={(e) => setReportDate(e.target.value)}
                                    style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                                />
                            </>
                        )}
                    </div>
                    <button onClick={exportToPDF} className={styles.submitBtn}>Export PDF</button>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "2rem" }}>Loading report...</div>
                ) : reportData ? (
                    <div className={styles.viewSection}>
                        {reportType === "daily" && reportData.sales && (
                            <>
                                <h2 className={styles.sectionTitle}>Daily Sales Summary - {reportData.date}</h2>
                                <div className={styles.kpiGrid}>
                                    <div className={styles.kpiCard}>
                                        <div className={styles.kpiIcon}>🥤</div>
                                        <div className={styles.kpiContent}>
                                            <h3 className={styles.kpiLabel}>Bottles</h3>
                                            <p className={styles.kpiValue}>UGX {reportData.sales.bottles.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className={styles.kpiCard}>
                                        <div className={styles.kpiIcon}>🪣</div>
                                        <div className={styles.kpiContent}>
                                            <h3 className={styles.kpiLabel}>Jerrycans</h3>
                                            <p className={styles.kpiValue}>UGX {reportData.sales.jerrycans.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className={styles.kpiCard}>
                                        <div className={styles.kpiIcon}>🎉</div>
                                        <div className={styles.kpiContent}>
                                            <h3 className={styles.kpiLabel}>Events</h3>
                                            <p className={styles.kpiValue}>UGX {reportData.sales.events.toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className={styles.kpiCard}>
                                        <div className={styles.kpiIcon}>💰</div>
                                        <div className={styles.kpiContent}>
                                            <h3 className={styles.kpiLabel}>Total Sales</h3>
                                            <p className={styles.kpiValue}>UGX {reportData.sales.total.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                                {reportData.cashPosition && (
                                    <div style={{ marginTop: "1.5rem" }}>
                                        <h3 className={styles.sectionTitle}>Cash Position</h3>
                                        <div className={styles.kpiGrid}>
                                            <div className={styles.kpiCard}>
                                                <div className={styles.kpiLabel}>Cash</div>
                                                <div className={styles.kpiValue}>UGX {reportData.cashPosition.cash.toLocaleString()}</div>
                                            </div>
                                            <div className={styles.kpiCard}>
                                                <div className={styles.kpiLabel}>Bank</div>
                                                <div className={styles.kpiValue}>UGX {reportData.cashPosition.bank.toLocaleString()}</div>
                                            </div>
                                            <div className={styles.kpiCard}>
                                                <div className={styles.kpiLabel}>Mobile Money</div>
                                                <div className={styles.kpiValue}>UGX {reportData.cashPosition.mobileMoney.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {reportType === "monthly" && reportData.profitAndLoss && (
                            <>
                                <h2 className={styles.sectionTitle}>Monthly Profit & Loss - {reportData.period}</h2>
                                <div className={styles.viewSection}>
                                    <h3 className={styles.sectionTitle}>Revenue</h3>
                                    <div className={styles.tableWrap}>
                                        <table className={styles.table}>
                                            <tbody>
                                                <tr>
                                                    <td>Bottle Sales</td>
                                                    <td>UGX {reportData.profitAndLoss.revenue.bottles.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td>Jerrycan Sales</td>
                                                    <td>UGX {reportData.profitAndLoss.revenue.jerrycans.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td>Event Revenue</td>
                                                    <td>UGX {reportData.profitAndLoss.revenue.events.toLocaleString()}</td>
                                                </tr>
                                                <tr style={{ fontWeight: "bold", borderTop: "2px solid #e2e8f0" }}>
                                                    <td>Total Revenue</td>
                                                    <td>UGX {reportData.profitAndLoss.revenue.total.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <h3 className={styles.sectionTitle} style={{ marginTop: "1.5rem" }}>Cost of Goods Sold</h3>
                                    <div className={styles.tableWrap}>
                                        <table className={styles.table}>
                                            <tbody>
                                                <tr>
                                                    <td>Fruit</td>
                                                    <td>UGX {reportData.profitAndLoss.cogs.fruit.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td>Packaging</td>
                                                    <td>UGX {reportData.profitAndLoss.cogs.packaging.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td>Labor</td>
                                                    <td>UGX {reportData.profitAndLoss.cogs.labor.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td>Utilities</td>
                                                    <td>UGX {reportData.profitAndLoss.cogs.utilities.toLocaleString()}</td>
                                                </tr>
                                                <tr style={{ fontWeight: "bold", borderTop: "2px solid #e2e8f0" }}>
                                                    <td>Total COGS</td>
                                                    <td>UGX {reportData.profitAndLoss.cogs.total.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className={styles.kpiCard} style={{ marginTop: "1.5rem", background: "#f0f9ff" }}>
                                        <div className={styles.kpiLabel}>Gross Profit</div>
                                        <div className={styles.kpiValue}>UGX {reportData.profitAndLoss.grossProfit.toLocaleString()}</div>
                                    </div>

                                    <h3 className={styles.sectionTitle} style={{ marginTop: "1.5rem" }}>Expenses</h3>
                                    <div className={styles.tableWrap}>
                                        <table className={styles.table}>
                                            <tbody>
                                                <tr>
                                                    <td>Wastage</td>
                                                    <td>UGX {reportData.profitAndLoss.expenses.wastage.toLocaleString()}</td>
                                                </tr>
                                                <tr>
                                                    <td>Operating Expenses</td>
                                                    <td>UGX {reportData.profitAndLoss.expenses.operating.toLocaleString()}</td>
                                                </tr>
                                                <tr style={{ fontWeight: "bold", borderTop: "2px solid #e2e8f0" }}>
                                                    <td>Total Expenses</td>
                                                    <td>UGX {reportData.profitAndLoss.expenses.total.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className={styles.kpiCard} style={{ marginTop: "1.5rem", background: reportData.profitAndLoss.netProfit >= 0 ? "#dcfce7" : "#fee2e2" }}>
                                        <div className={styles.kpiLabel}>Net Profit</div>
                                        <div className={styles.kpiValue} style={{ color: reportData.profitAndLoss.netProfit >= 0 ? "#166534" : "#991b1b" }}>
                                            UGX {reportData.profitAndLoss.netProfit.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {reportType === "weekly" && (
                            <>
                                <h2 className={styles.sectionTitle}>Weekly Sales Trend - {reportData.weekStart} to {reportData.weekEnd}</h2>
                                {reportData.salesTrend && reportData.salesTrend.length > 0 ? (
                                    <div className={styles.tableWrap}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Sales (UGX)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.salesTrend.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{item.date}</td>
                                                        <td>UGX {item.sales.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div style={{ padding: "1rem", color: "#64748b" }}>No sales data for this week</div>
                                )}
                                {reportData.costPerLiterTrend && (
                                    <div style={{ marginTop: "1.5rem" }}>
                                        <h3 className={styles.sectionTitle}>Cost Analysis</h3>
                                        <div className={styles.kpiGrid}>
                                            <div className={styles.kpiCard}>
                                                <div className={styles.kpiLabel}>Average Cost per Liter</div>
                                                <div className={styles.kpiValue}>UGX {reportData.costPerLiterTrend.average.toLocaleString()}</div>
                                            </div>
                                            <div className={styles.kpiCard}>
                                                <div className={styles.kpiLabel}>Total COGS</div>
                                                <div className={styles.kpiValue}>UGX {reportData.costPerLiterTrend.totalCost.toLocaleString()}</div>
                                            </div>
                                            <div className={styles.kpiCard}>
                                                <div className={styles.kpiLabel}>Total Liters</div>
                                                <div className={styles.kpiValue}>{reportData.costPerLiterTrend.totalLiters.toLocaleString()} L</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {(reportData.wastageCost !== undefined || reportData.supplierSpend !== undefined) && (
                                    <div style={{ marginTop: "1.5rem" }}>
                                        <div className={styles.kpiGrid}>
                                            {reportData.wastageCost !== undefined && (
                                                <div className={styles.kpiCard}>
                                                    <div className={styles.kpiLabel}>Wastage Cost</div>
                                                    <div className={styles.kpiValue}>UGX {reportData.wastageCost.toLocaleString()}</div>
                                                </div>
                                            )}
                                            {reportData.supplierSpend !== undefined && (
                                                <div className={styles.kpiCard}>
                                                    <div className={styles.kpiLabel}>Supplier Spend</div>
                                                    <div className={styles.kpiValue}>UGX {reportData.supplierSpend.toLocaleString()}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                        No report data available for the selected period.
                    </div>
                )}
            </section>
        </div>
    );
}
