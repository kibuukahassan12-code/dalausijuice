"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../production/production.module.css";
import ExportButton from "@/components/Admin/ExportButton";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid
} from "recharts";

type ProcurementDashboard = {
    openPOs: number;
    openPOsList: any[];
    supplierBalances: { name: string; payable: number; paid: number; balance: number }[];
    costByCategory: Record<string, number>;
    outstandingPayables: number;
    totalPayable: number;
    totalPaid: number;
    statusDistribution: { name: string; value: number }[];
};

export default function ProcurementPage() {
    const [dashboard, setDashboard] = useState<ProcurementDashboard | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/procurement/dashboard");
            if (res.ok) {
                const data = await res.json();
                setDashboard(data);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3e1c33', '#f97316', '#10b981', '#3b82f6', '#ef4444'];

    const formatCurrency = (value: any) => `UGX ${Number(value || 0).toLocaleString()}`;

    return (
        <div className={styles.container} id="procurement-dashboard">
            <header className={styles.header}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1>Procurement Department</h1>
                        <p className={styles.purpose}>
                            <strong>Full Traceability:</strong> Supplier → PO → Goods Receipt → Payment → Accounting. Managing supply chain efficiency.
                        </p>
                    </div>
                    <ExportButton elementId="procurement-dashboard" filename={`Procurement_Report_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </header>

            {/* KPIs Dashboard */}
            <section className={styles.kpiSection}>
                <h2 className={styles.sectionTitle}>Procurement Overview</h2>
                <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>📋</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Open POs</h3>
                            <p className={styles.kpiValue}>{dashboard?.openPOs || 0}</p>
                            <span className={styles.kpiUnit}>active orders</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>💰</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Outstanding</h3>
                            <p className={styles.kpiValue} style={{ color: "#991b1b" }}>
                                {formatCurrency(dashboard?.outstandingPayables)}
                            </p>
                            <span className={styles.kpiUnit}>unpaid balances</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>📊</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Cumulative Spend</h3>
                            <p className={styles.kpiValue}>{formatCurrency(dashboard?.totalPayable)}</p>
                            <span className={styles.kpiUnit}>all time sourcing</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>✅</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Total Paid</h3>
                            <p className={styles.kpiValue} style={{ color: "#166534" }}>{formatCurrency(dashboard?.totalPaid)}</p>
                            <span className={styles.kpiUnit}>settled invoices</span>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                {!loading && dashboard && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "400px" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Top Suppliers by Spend</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboard.supplierBalances} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                                        <Tooltip formatter={formatCurrency} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="payable" fill="#3e1c33" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "400px" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>PO Status Distribution</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dashboard.statusDistribution}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {dashboard.statusDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <h2 className={styles.sectionTitle}>Procurement Operations</h2>
                <div className={styles.actionGrid}>
                    <Link href="/admin/procurement/suppliers" className={styles.actionCard}>
                        <span className={styles.actionIcon}>🏢</span>
                        <h3>Suppliers</h3>
                        <p>Supplier database & pricing</p>
                    </Link>
                    <Link href="/admin/procurement/requisitions" className={styles.actionCard}>
                        <span className={styles.actionIcon}>📝</span>
                        <h3>Requisitions</h3>
                        <p>Internal supply requests</p>
                    </Link>
                    <Link href="/admin/procurement/purchase-orders" className={styles.actionCard}>
                        <span className={styles.actionIcon}>📋</span>
                        <h3>POs</h3>
                        <p>Inbound purchase orders</p>
                    </Link>
                    <Link href="/admin/procurement/goods-receipts" className={styles.actionCard}>
                        <span className={styles.actionIcon}>📦</span>
                        <h3>Receipts</h3>
                        <p>GRN & quality checks</p>
                    </Link>
                    <Link href="/admin/procurement/payments" className={styles.actionCard}>
                        <span className={styles.actionIcon}>💳</span>
                        <h3>Payments</h3>
                        <p>Accounts payable records</p>
                    </Link>
                </div>
            </section>

            {/* List Table */}
            {dashboard?.openPOsList && dashboard.openPOsList.length > 0 && (
                <section className={styles.unitsSection} style={{ marginTop: "2rem" }}>
                    <h2 className={styles.sectionTitle}>Active Purchase Orders</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>PO Number</th>
                                    <th>Supplier</th>
                                    <th>Total Value</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard.openPOsList.map((po: any) => (
                                    <tr key={po.po_number}>
                                        <td><strong>{po.po_number}</strong></td>
                                        <td>{po.supplier}</td>
                                        <td>{formatCurrency(po.total_value)}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles.active}`}
                                                style={{ background: po.status === 'OPEN' ? '#dcfce7' : '#fef9c3', color: po.status === 'OPEN' ? '#166534' : '#854d0e' }}>
                                                {po.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
