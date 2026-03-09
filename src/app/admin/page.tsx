"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./dashboard.module.css";
import ExportButton from "@/components/Admin/ExportButton";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Legend, BarChart, Bar
} from "recharts";

type DashboardData = {
    weeklyTrend: any[];
    upcomingEvents: any[];
    stats: {
        monthlyRevenue: number;
        monthlyProfit: number;
        inventoryValue: number;
        lowStockAlerts: number;
        activeEmployees: number;
    };
};

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [aiData, setAiData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchDashboard(), fetchAiInsights()]);
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/dashboard");
            if (res.ok) setData(await res.json());
        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAiInsights = async () => {
        try {
            const res = await fetch("/api/admin/dashboard/ai-insights");
            if (res.ok) setAiData(await res.json());
        } catch (e) { }
    };

    const formatCurrency = (val: any) => `UGX ${Number(val || 0).toLocaleString()}`;
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'short' });
    };

    if (loading) return <div className={styles.dashboard}>Loading Commander's View...</div>;

    return (
        <div className={styles.dashboard} id="admin-main-dashboard">
            <header className={styles.header}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ color: "var(--color-plum)", fontSize: "1.75rem", margin: 0 }}>Executive Overview</h1>
                        <p style={{ color: "#64748b", margin: "0.25rem 0 0 0" }}>Dalausi Juice Operating System — Commander's Perspective</p>
                    </div>
                    <ExportButton elementId="admin-main-dashboard" filename={`Executive_Report_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </header>

            {/* NEW: Dalausi AI Strategic Advisor */}
            {aiData && (
                <section className={styles.aiAdvisor}>
                    <div className={styles.aiHeader}>
                        <div className={styles.aiTitle}>
                            <div className={styles.aiPulse}></div>
                            <h2 style={{ fontSize: "1rem", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>Dalausi AI Strategic Co-Pilot</h2>
                        </div>
                        <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>OS Version 2.4.0 (Enhanced Intelligence)</span>
                    </div>
                    <p style={{ fontSize: "1.25rem", margin: "0 0 1.5rem 0", fontWeight: 600, color: "var(--color-orange)" }}>
                        "{aiData.greeting}, I have analyzed the pulse of our operations."
                    </p>
                    <div className={styles.aiInsightsList}>
                        {aiData.insights.map((insight: string, idx: number) => (
                            <div key={idx} className={styles.aiInsight}>
                                ⚡ {insight}
                            </div>
                        ))}
                    </div>
                    <Link href={aiData.actionPath} className={styles.aiActionBtn}>
                        {aiData.primaryAction} →
                    </Link>
                </section>
            )}

            {/* Top KPIs */}
            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} ${styles.plum}`}>
                    <h3>Monthly Revenue</h3>
                    <p className={styles.statValue}>{formatCurrency(data?.stats.monthlyRevenue)}</p>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Gross income this month</span>
                </div>
                <div className={`${styles.statCard} ${styles.green}`}>
                    <h3>Monthly Profit</h3>
                    <p className={styles.statValue} style={{ color: "#166534" }}>{formatCurrency(data?.stats.monthlyProfit)}</p>
                    <span style={{ fontSize: "0.75rem", color: "#166534" }}>Net position (Rev - Ops)</span>
                </div>
                <div className={`${styles.statCard} ${styles.orange}`}>
                    <h3>Inventory Value</h3>
                    <p className={styles.statValue}>{formatCurrency(data?.stats.inventoryValue)}</p>
                    <span style={{ fontSize: "0.75rem", color: (data?.stats.lowStockAlerts || 0) > 0 ? "#ef4444" : "#64748b" }}>
                        {data?.stats.lowStockAlerts} items need reorder
                    </span>
                </div>
            </div>

            {/* Main Trend Chart */}
            <section className={styles.financeOverview} style={{ padding: "1.75rem" }}>
                <h2 className={styles.sectionTitle}>7-Day Financial & Operational Pulse</h2>
                <div style={{ height: "400px", width: "100%", marginTop: "1rem" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data?.weeklyTrend || []}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3e1c33" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#3e1c33" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: '#64748b' }}
                                tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`}
                            />
                            <Tooltip formatter={(val) => formatCurrency(val)} />
                            <Legend verticalAlign="top" height={36} />
                            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3e1c33" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <div className={styles.contentGrid}>
                {/* Upcoming Events */}
                <div className={styles.tableSection}>
                    <div className={styles.sectionHeader}>
                        <h2>Upcoming Events ({data?.upcomingEvents.length})</h2>
                        <Link href="/admin/events" className={styles.viewAll}>View Full Calendar</Link>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Event</th>
                                <th>Client</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.upcomingEvents.map((event) => (
                                <tr key={event.id}>
                                    <td>{new Date(event.date).toLocaleDateString()}</td>
                                    <td><strong>{event.name}</strong></td>
                                    <td>{event.client}</td>
                                </tr>
                            ))}
                            {data?.upcomingEvents.length === 0 && (
                                <tr>
                                    <td colSpan={3} className={styles.empty}>No upcoming events scheduled</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Quick Dashboard Units */}
                <div className={styles.summaryGrid}>
                    <div className={styles.summaryCard}>
                        <h4>Workforce Status</h4>
                        <div className={styles.activityItem}>
                            <span>Active Staff</span>
                            <strong>{data?.stats.activeEmployees}</strong>
                        </div>
                        <div className={styles.activityItem}>
                            <span>Production Pulse (7d)</span>
                            <strong>{data?.weeklyTrend.reduce((s, d) => s + d.production, 0).toFixed(1)}L</strong>
                        </div>
                        <Link href="/admin/hr" style={{ display: "block", marginTop: "1rem", fontSize: "0.8125rem", color: "var(--color-plum)", fontWeight: "600" }}>
                            Manage HR →
                        </Link>
                    </div>

                    <div className={styles.alertCard}>
                        <h4>Quick Navigation</h4>
                        <div className={styles.links}>
                            <Link href="/admin/orders">🥤 New Daily Order</Link>
                            <Link href="/admin/production">🏭 Start Production Batch</Link>
                            <Link href="/admin/inventory">📦 Reorder Supplies</Link>
                            <Link href="/admin/accounting">💰 Financial Reports</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
