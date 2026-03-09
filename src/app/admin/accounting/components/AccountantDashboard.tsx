import styles from "../accounting.module.css";
import { DashboardData } from "../types";
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

export default function AccountantDashboard({ d }: { d: DashboardData }) {
    const acc = d.accountantView;
    const cash = acc?.dailyCashPosition || { cash: 0, bank: 0, mobileMoney: 0 };

    const cashData = [
        { name: 'Cash', value: cash.cash },
        { name: 'Bank', value: cash.bank },
        { name: 'Mobile Money', value: cash.mobileMoney },
    ];

    const COLORS = ['#f97316', '#3b82f6', '#10b981'];

    const summaryData = [
        { name: 'Payables', value: acc?.openPayables || 0, color: '#991b1b' },
        { name: 'Receivables', value: acc?.receivablesAging?.total || 0, color: '#166534' },
    ];

    const formatCurrency = (value: any) => {
        return `UGX ${Number(value || 0).toLocaleString()}`;
    };

    return (
        <section className={styles.viewSection} id="accountant-dashboard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Accountant Control Panel</h2>
                <ExportButton elementId="accountant-dashboard" filename={`Accountant_Report_${new Date().toISOString().split('T')[0]}`} />
            </div>

            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>🧾</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Open Payables</h3>
                        <p className={styles.kpiValue} style={{ color: "#991b1b" }}>
                            UGX {(acc?.openPayables || 0).toLocaleString()}
                        </p>
                        <span className={styles.kpiUnit}>unpaid supplier invoices</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>⏳</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Receivables Aging</h3>
                        <p className={styles.kpiValue} style={{ color: "#166534" }}>
                            UGX {(acc?.receivablesAging?.total || 0).toLocaleString()}
                        </p>
                        <span className={styles.kpiUnit}>outstanding customer payments</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>🏦</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Total Cash Position</h3>
                        <p className={styles.kpiValue}>
                            UGX {(cash.cash + cash.bank + cash.mobileMoney).toLocaleString()}
                        </p>
                        <span className={styles.kpiUnit}>Across all methods</span>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                {/* Cash Distribution */}
                <div className={styles.kpiCard} style={{ display: "flex", flexDirection: "column", height: "400px" }}>
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Cash Distribution</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={cashData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {cashData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={formatCurrency} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payables vs Receivables */}
                <div className={styles.kpiCard} style={{ display: "flex", flexDirection: "column", height: "400px" }}>
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Liquidity Overview</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summaryData} layout="vertical" margin={{ left: 20, right: 30, top: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                                <Tooltip formatter={formatCurrency} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {summaryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrap} style={{ marginTop: "2rem" }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Method</th>
                            <th>Balance</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Physical Cash</td><td>UGX {cash.cash.toLocaleString()}</td><td><span className={styles.status} data-status="open">Verified</span></td></tr>
                        <tr><td>Bank Account</td><td>UGX {cash.bank.toLocaleString()}</td><td><span className={styles.status} data-status="locked">Reconciled</span></td></tr>
                        <tr><td>Mobile Money</td><td>UGX {cash.mobileMoney.toLocaleString()}</td><td><span className={styles.status} data-status="open">Active</span></td></tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
