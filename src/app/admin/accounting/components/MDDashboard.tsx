import styles from "../accounting.module.css";
import { DashboardData } from "../types";
import ExportButton from "@/components/Admin/ExportButton";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";

export default function MDDashboard({ d }: { d: DashboardData }) {
    const md = d.mdView;

    const pieData = [
        { name: 'Events', value: md?.eventVsRetail?.event || 0 },
        { name: 'Retail', value: md?.eventVsRetail?.retail || 0 },
    ];

    const COLORS = ['#3e1c33', '#f97316'];

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'short' });
    };

    const formatCurrency = (value: any) => {
        return `UGX ${Number(value || 0).toLocaleString()}`;
    };

    return (
        <section className={styles.viewSection} id="md-dashboard">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>MD Executive Dashboard</h2>
                <ExportButton elementId="md-dashboard" filename={`MD_Dashboard_${new Date().toISOString().split('T')[0]}`} />
            </div>

            {/* Top Row KPIs */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>🛒</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Daily Sales</h3>
                        <div className={styles.salesBreakdown}>
                            <div>Bottles: UGX {(md?.dailySales?.bottles || 0).toLocaleString()}</div>
                            <div>Jerrycans: UGX {(md?.dailySales?.jerrycans || 0).toLocaleString()}</div>
                            <div>Events: UGX {(md?.dailySales?.events || 0).toLocaleString()}</div>
                            <div className={styles.total}>Total: UGX {(md?.dailySales?.total || 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>💰</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Net Profit (Month)</h3>
                        <p className={styles.kpiValue}>UGX {(md?.netProfit || 0).toLocaleString()}</p>
                        <span className={`${styles.kpiUnit} ${(md?.netProfit || 0) >= 0 ? styles.success : styles.warning}`}>
                            {(md?.netProfit || 0) >= 0 ? "Profitable" : "Loss"}
                        </span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>⚠️</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Wastage Impact</h3>
                        <p className={styles.kpiValue}>UGX {(md?.wastageImpact || 0).toLocaleString()}</p>
                        <span className={styles.kpiUnit}>production wastage cost</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                {/* 7-Day Revenue Trend */}
                <div className={styles.kpiCard} style={{ display: "flex", flexDirection: "column", height: "400px" }}>
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>7-Day Revenue Trend</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={md?.analysis?.dailyTrend || []}>
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
                                    tickFormatter={(value) => `${(value / 1000).toLocaleString()}k`}
                                />
                                <Tooltip
                                    formatter={formatCurrency}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#3e1c33"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#3e1c33', strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Event vs Retail Split */}
                <div className={styles.kpiCard} style={{ display: "flex", flexDirection: "column", height: "400px" }}>
                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Revenue Distribution</h3>
                    <div style={{ flex: 1, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={formatCurrency} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Additional Analysis Cards */}
            {md?.analysis && (
                <div className={styles.kpiGrid} style={{ marginTop: "2rem" }}>
                    <div className={styles.kpiCard} style={{ background: "#fdf2f8" }}>
                        <div className={styles.kpiIcon}>📈</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Weekly Revenue</h3>
                            <p className={styles.kpiValue} style={{ color: "#be185d" }}>UGX {(md.analysis.weeklyRevenue || 0).toLocaleString()}</p>
                            <span className={styles.kpiUnit}>Sales from all sources</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard} style={{ background: "#f0f9ff" }}>
                        <div className={styles.kpiIcon}>🎯</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Daily Profit</h3>
                            <p className={styles.kpiValue} style={{ color: "#0369a1" }}>UGX {(md.analysis.dailyProfit || 0).toLocaleString()}</p>
                            <span className={styles.kpiUnit}>Target vs Actual</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard} style={{ background: "#ecfdf5" }}>
                        <div className={styles.kpiIcon}>💸</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Daily Expenditures</h3>
                            <p className={styles.kpiValue} style={{ color: "#047857" }}>UGX {(md.analysis.dailyExpenditures || 0).toLocaleString()}</p>
                            <span className={styles.kpiUnit}>OpEx monitoring</span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
