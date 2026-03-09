"use client";

import { useState, useEffect } from "react";
import styles from "./reports.module.css";
import ExportButton from "@/components/Admin/ExportButton";

export default function ReportsPage() {
    const [financeData, setFinanceData] = useState<any>(null);
    const [mdSnapshot, setMdSnapshot] = useState<any>(null);
    const [activeView, setActiveView] = useState<"finance" | "snapshot">("snapshot");
    const [startDate, setStartDate] = useState(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);

    const fetchFinance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/finance?startDate=${startDate}&endDate=${endDate}`);
            const data = await res.json();
            setFinanceData(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSnapshot = async () => {
        try {
            const res = await fetch("/api/admin/reports/md-snapshot");
            const data = await res.json();
            setMdSnapshot(data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchFinance();
        fetchSnapshot();
    }, [startDate, endDate]);

    const exportToCSV = () => {
        if (!financeData) return;

        const rows = [
            ["Category", "Amount (UGX)"],
            ["Gross Revenue", financeData.grossRevenue],
            ["Total Procurement", financeData.totalProcurement],
            ["Total Expenses", financeData.totalExpenses],
            ["Net Revenue", financeData.netRevenue],
            ["Outstanding Balance", financeData.outstanding],
            ["", ""],
            ["Report Period", `${startDate} to ${endDate}`]
        ];

        const csvContent = "data:text/csv;charset=utf-8,"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Dalausi_Financial_Report_${startDate}_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const setPreset = (period: 'today' | 'week' | 'month' | 'year') => {
        const end = new Date();
        let start = new Date();

        if (period === 'today') {
            start.setHours(0, 0, 0, 0);
        } else if (period === 'week') {
            start.setDate(end.getDate() - 7);
        } else if (period === 'month') {
            start.setMonth(end.getMonth() - 1);
        } else if (period === 'year') {
            start.setFullYear(end.getFullYear() - 1);
        }

        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Executive Reports</h1>
                <div className={styles.viewToggle}>
                    <button
                        className={activeView === "snapshot" ? styles.activeTab : ""}
                        onClick={() => setActiveView("snapshot")}
                    >
                        MD Snapshot
                    </button>
                    <button
                        className={activeView === "finance" ? styles.activeTab : ""}
                        onClick={() => setActiveView("finance")}
                    >
                        Financial Report
                    </button>
                </div>
            </header>

            {activeView === "snapshot" && mdSnapshot && (
                <div className={styles.snapshotView} id="md-snapshot">
                    <div className={styles.snapshotHeader}>
                        <div>
                            <h2>Managing Director Performance Snapshot</h2>
                            <p className={styles.timestamp}>Generated: {new Date(mdSnapshot.generatedAt).toLocaleString()}</p>
                        </div>
                        <ExportButton elementId="md-snapshot" filename={`MD_Snapshot_${new Date().toISOString().split('T')[0]}`} />
                    </div>

                    {/* Executive Summary */}
                    <div className={styles.executiveSummary}>
                        <h3>Executive Summary</h3>
                        <p>{mdSnapshot.executiveSummary}</p>
                    </div>

                    {/* Strategic Insights */}
                    {mdSnapshot.insights.length > 0 && (
                        <div className={styles.insightsSection}>
                            <h3>Strategic Insights ({mdSnapshot.insights.length})</h3>
                            <div className={styles.insightsList}>
                                {mdSnapshot.insights.map((insight: string, i: number) => (
                                    <div key={i} className={styles.insightCard}>
                                        {insight}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* KPI Grid */}
                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>💰</div>
                            <div className={styles.kpiContent}>
                                <h4>Monthly Revenue</h4>
                                <p className={styles.kpiValue}>UGX {mdSnapshot.revenue.month.toLocaleString()}</p>
                                <span className={styles.kpiTrend}>
                                    {mdSnapshot.revenue.trend === "UP" ? "↗" : "↘"} Today: UGX {mdSnapshot.revenue.today.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>📊</div>
                            <div className={styles.kpiContent}>
                                <h4>Profit Margin</h4>
                                <p className={styles.kpiValue}>{mdSnapshot.financial.profitMargin}%</p>
                                <span className={`${styles.healthBadge} ${styles[mdSnapshot.financial.healthStatus.toLowerCase()]}`}>
                                    {mdSnapshot.financial.healthStatus}
                                </span>
                            </div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>🏭</div>
                            <div className={styles.kpiContent}>
                                <h4>Weekly Production</h4>
                                <p className={styles.kpiValue}>{mdSnapshot.production.weekOutput}L</p>
                                <span className={styles.kpiSubtext}>Wastage: {mdSnapshot.production.wastageRate}%</span>
                            </div>
                        </div>

                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>👥</div>
                            <div className={styles.kpiContent}>
                                <h4>VIP Customers</h4>
                                <p className={styles.kpiValue}>{mdSnapshot.customers.vipCount}</p>
                                <span className={styles.kpiSubtext}>Total: {mdSnapshot.customers.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Operational Alerts */}
                    <div className={styles.alertsSection}>
                        <h3>Operational Alerts</h3>
                        <div className={styles.alertsGrid}>
                            {mdSnapshot.alerts.critical.length > 0 && (
                                <div className={styles.alertBox}>
                                    <h4>🔴 Critical Stock ({mdSnapshot.alerts.critical.length})</h4>
                                    <ul>
                                        {mdSnapshot.alerts.critical.slice(0, 5).map((alert: any, i: number) => (
                                            <li key={i}>
                                                {alert.item}: {alert.current} (threshold: {alert.threshold})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {mdSnapshot.alerts.staleOrders.length > 0 && (
                                <div className={styles.alertBox}>
                                    <h4>🟠 Stale Orders ({mdSnapshot.alerts.staleOrders.length})</h4>
                                    <ul>
                                        {mdSnapshot.alerts.staleOrders.slice(0, 5).map((alert: any, i: number) => (
                                            <li key={i}>
                                                {alert.customer}: UGX {alert.amount.toLocaleString()} ({alert.hoursPending}h pending)
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {mdSnapshot.alerts.upcomingEvents.length > 0 && (
                                <div className={styles.alertBox}>
                                    <h4>📅 Upcoming Events ({mdSnapshot.alerts.upcomingEvents.length})</h4>
                                    <ul>
                                        {mdSnapshot.alerts.upcomingEvents.slice(0, 5).map((alert: any, i: number) => (
                                            <li key={i}>
                                                {alert.eventName} - {alert.client} ({new Date(alert.date).toLocaleDateString()})
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeView === "finance" && (
                <>
                    <div className={styles.controls}>
                        <div className={styles.presets}>
                            <button onClick={() => setPreset('today')}>Today</button>
                            <button onClick={() => setPreset('week')}>Last 7 Days</button>
                            <button onClick={() => setPreset('month')}>Last Month</button>
                        </div>
                        <div className={styles.datePicker}>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <span>to</span>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                        <button onClick={exportToCSV} className={styles.exportBtn}>Export CSV</button>
                    </div>

                    {loading ? (
                        <div className={styles.loading}>Loading report data...</div>
                    ) : financeData ? (
                        <div className={styles.reportGrid}>
                            <div className={`${styles.card} ${styles.revenue}`}>
                                <h3>Gross Revenue</h3>
                                <p className={styles.value}>UGX {financeData.grossRevenue.toLocaleString()}</p>
                                <div className={styles.footer}>Orders + Events</div>
                            </div>

                            <div className={`${styles.card} ${styles.expense}`}>
                                <h3>Operating Costs</h3>
                                <p className={styles.value}>UGX {(financeData.totalProcurement + financeData.totalExpenses).toLocaleString()}</p>
                                <div className={styles.breakdown}>
                                    <span>Procurement: UGX {financeData.totalProcurement.toLocaleString()}</span>
                                    <span>Expenses: UGX {financeData.totalExpenses.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className={`${styles.card} ${styles.profit}`}>
                                <h3>Net Revenue / Profit</h3>
                                <p className={styles.value}>UGX {financeData.netRevenue.toLocaleString()}</p>
                                <div className={styles.progress}>
                                    Margin: {((financeData.netRevenue / (financeData.grossRevenue || 1)) * 100).toFixed(1)}%
                                </div>
                            </div>

                            <div className={`${styles.card} ${styles.outstanding}`}>
                                <h3>Outstanding Balances</h3>
                                <p className={styles.value}>UGX {financeData.outstanding.toLocaleString()}</p>
                                <p className={styles.note}>Unpaid amounts from partial payments</p>
                            </div>
                        </div>
                    ) : null}

                    <div className={styles.analysisSection}>
                        <h2>Analysis: Cashflow vs Profit</h2>
                        <div className={styles.analysisBox}>
                            <p>During this period, for every UGX 1,000 earned, your estimated production and operational cost was
                                <strong> UGX {financeData ? Math.round(((financeData.totalProcurement + financeData.totalExpenses) / (financeData.grossRevenue || 1)) * 1000) : '...'}</strong>.
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
