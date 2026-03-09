import styles from "../accounting.module.css";
import { DashboardData } from "../types";
import ExportButton from "@/components/Admin/ExportButton";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    Legend
} from "recharts";

export default function FinanceManagerDashboard({ d }: { d: DashboardData }) {
    const fin = d.financeManagerView;
    const prof = fin?.profitability;

    const expenseTrendData = Object.entries(fin?.expenseTrends || {}).map(([month, amount]) => ({
        month,
        amount
    })).sort((a, b) => a.month.localeCompare(b.month));

    const profitabilityData = [
        { name: 'Revenue', amount: prof?.revenue || 0 },
        { name: 'COGS', amount: -(prof?.cogs || 0) },
        { name: 'Expenses', amount: -(prof?.expenses || 0) },
        { name: 'Net Profit', amount: prof?.netProfit || 0 },
    ];

    const formatCurrency = (value: any) => {
        return `UGX ${Math.abs(Number(value || 0)).toLocaleString()}`;
    };

    return (
        <section className={styles.viewSection} id="finance-dashboard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Finance Manager Control</h2>
                <ExportButton elementId="finance-dashboard" filename={`Finance_Report_${new Date().toISOString().split('T')[0]}`} />
            </div>

            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>📊</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Revenue vs Expenses</h3>
                        <p className={styles.kpiValue}>UGX {(prof?.revenue || 0).toLocaleString()}</p>
                        <span className={styles.kpiUnit}>Revenue this month</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>📉</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Total Costs (COGS + OpEx)</h3>
                        <p className={styles.kpiValue} style={{ color: "#991b1b" }}>UGX {((prof?.cogs || 0) + (prof?.expenses || 0)).toLocaleString()}</p>
                        <span className={styles.kpiUnit}>All expenditures</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>💎</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Net Profitability</h3>
                        <p className={styles.kpiValue} style={{ color: "#166534" }}>UGX {(prof?.netProfit || 0).toLocaleString()}</p>
                        <span className={styles.kpiUnit}>Final bottom line</span>
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                {/* Profitability Visualization */}
                <div className={styles.kpiCard} style={{ display: "flex", flexDirection: "column", height: "400px" }}>
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Profitability Breakdown</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={profitabilityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                                />
                                <Tooltip
                                    formatter={formatCurrency}
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                    {profitabilityData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.amount >= 0 ? '#166534' : '#991b1b'}
                                            fillOpacity={entry.name === 'Revenue' ? 0.8 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Trends */}
                <div className={styles.kpiCard} style={{ display: "flex", flexDirection: "column", height: "400px" }}>
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Monthly Expense Trends</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={expenseTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                                />
                                <Tooltip
                                    formatter={formatCurrency}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line
                                    type="stepAfter"
                                    dataKey="amount"
                                    stroke="#991b1b"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#991b1b', strokeWidth: 2, stroke: '#fff' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className={styles.tableWrap} style={{ marginTop: "2rem" }}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>Revenue</td><td>UGX {(prof?.revenue || 0).toLocaleString()}</td><td><span className={styles.status} data-status="open">Active</span></td></tr>
                        <tr><td>Cost of Goods Sold</td><td>UGX {(prof?.cogs || 0).toLocaleString()}</td><td><span className={styles.status} data-status="locked">Fixed</span></td></tr>
                        <tr><td>Operating Expenses</td><td>UGX {(prof?.expenses || 0).toLocaleString()}</td><td><span className={styles.status} data-status="open">Active</span></td></tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
