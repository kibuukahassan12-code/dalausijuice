"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./production.module.css";
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
    Legend,
    AreaChart,
    Area
} from "recharts";

type ProductionKpis = {
    dailyOutput: number;
    targetLiters: number;
    wastagePercent: number;
    hygieneScore: number;
    costPerLiter: number;
    revenuePotential: number;
    qcRejectionRate: number;
    batchesToday: number;
    qcApproved: number;
    qcRejected: number;
    outputTrend: { date: string; output: number; target: number }[];
    juiceTypeDistribution: { name: string; value: number }[];
};

export default function ProductionPage() {
    const [kpis, setKpis] = useState<ProductionKpis | null>(null);
    const [advisorData, setAdvisorData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([fetchDashboard(), fetchAdvisor()]);
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/production/dashboard");
            if (res.ok) setKpis(await res.json());
        } catch (error) {
            console.error("Error fetching dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdvisor = async () => {
        try {
            const res = await fetch("/api/admin/production/predictive-advisor");
            if (res.ok) setAdvisorData(await res.json());
        } catch (e) { }
    };

    const operationalUnits = [
        { name: "Juice Production & Processing", description: "Daily juice extraction and blending", icon: "🥤", status: "Active" },
        { name: "Quality Control & Food Safety", description: "Testing and safety standards monitoring", icon: "✅", status: "Active" },
        { name: "Inventory & Raw Materials", description: "Fruit sourcing and stock management", icon: "📦", status: "Active" },
        { name: "Equipment & Maintenance", description: "Production equipment upkeep", icon: "🔧", status: "Active" },
    ];

    const COLORS = ['#3e1c33', '#f97316', '#10b981', '#3b82f6', '#ef4444'];

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'short' });
    };

    const formatLiters = (value: any) => `${Number(value || 0).toFixed(1)}L`;

    return (
        <div className={styles.container} id="production-dashboard">
            <header className={styles.header}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1>Production Department</h1>
                        <p className={styles.purpose}>
                            <strong>Purpose:</strong> Produce consistent, safe, high-quality juice daily. Monitoring efficiency and quality control.
                        </p>
                    </div>
                    <ExportButton elementId="production-dashboard" filename={`Production_Report_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </header>

            {/* KPIs Section */}
            <section className={styles.kpiSection}>
                <h2 className={styles.sectionTitle}>Daily Performance</h2>
                <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>📊</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Daily Output</h3>
                            <p className={styles.kpiValue}>{(kpis?.dailyOutput || 0).toFixed(1)}</p>
                            <span className={styles.kpiUnit}>liters total</span>
                            {kpis && kpis.targetLiters > 0 && (
                                <span className={styles.kpiSubtext}>
                                    Target: {kpis.targetLiters.toFixed(1)}L ({((kpis.dailyOutput / kpis.targetLiters) * 100).toFixed(1)}%)
                                </span>
                            )}
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>⚠️</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Wastage %</h3>
                            <p className={styles.kpiValue}>{(kpis?.wastagePercent || 0).toFixed(1)}%</p>
                            <span className={`${styles.kpiUnit} ${(kpis?.wastagePercent || 0) > 5 ? styles.warning : styles.success}`}>
                                {(kpis?.wastagePercent || 0) <= 5 ? "Optimized" : "High Wastage"}
                            </span>
                        </div>
                    </div>
                    <div className={styles.kpiIconSmall} style={{ display: 'none' }}></div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>💰</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Cost / Liter</h3>
                            <p className={styles.kpiValue}>UGX {(kpis?.costPerLiter || 0).toLocaleString()}</p>
                            <span className={styles.kpiUnit}>raw material cost</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>✅</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>QC Acceptance</h3>
                            <p className={styles.kpiValue}>{(100 - (kpis?.qcRejectionRate || 0)).toFixed(1)}%</p>
                            <span className={styles.kpiUnit}>{kpis?.qcApproved || 0} batches passed</span>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                {!loading && kpis && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "400px" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Output vs Target (Liters)</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={kpis.outputTrend}>
                                        <defs>
                                            <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
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
                                        />
                                        <Tooltip formatter={formatLiters} />
                                        <Legend verticalAlign="top" height={36} />
                                        <Area type="monotone" dataKey="output" stroke="#3e1c33" fillOpacity={1} fill="url(#colorOutput)" strokeWidth={3} />
                                        <Line type="monotone" dataKey="target" stroke="#64748b" strokeDasharray="5 5" dot={false} strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "400px" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Production by Juice Type</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={kpis.juiceTypeDistribution}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {kpis.juiceTypeDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={formatLiters} />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* NEW: Predictive Production Advisor */}
            {advisorData && advisorData.predictions.length > 0 && (
                <section className={styles.advisorSection}>
                    <div className={styles.advisorHeader}>
                        <h2>
                            <div className={styles.advisorPulse}></div>
                            Predictive Production Advisor
                        </h2>
                        <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Analysis Date: {new Date(advisorData.date).toLocaleDateString()}</span>
                    </div>

                    <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem", color: "var(--color-orange)", fontStyle: "italic" }}>
                        "{advisorData.advisorMessage}"
                    </p>

                    <div className={styles.predictionGrid}>
                        {advisorData.predictions.map((p: any, i: number) => (
                            <div key={i} className={styles.predictionCard}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <h3>{p.productName}</h3>
                                    <span className={`${styles.priorityTag} ${p.priority === 'HIGH' ? styles.priorityHigh : styles.priorityNormal}`}>
                                        {p.priority}
                                    </span>
                                </div>
                                <div className={styles.predictionStats}>
                                    <div className={styles.statLine}>
                                        <span>Avg Daily Demand:</span>
                                        <strong>{p.avgDailyDemand}L</strong>
                                    </div>
                                    <div className={styles.statLine}>
                                        <span>Event Reservations:</span>
                                        <strong>{p.upcomingEventDemand}L</strong>
                                    </div>
                                    <div className={styles.statLine}>
                                        <span>Current Stock:</span>
                                        <strong>{p.currentStock}L</strong>
                                    </div>
                                </div>
                                <div className={styles.recRow}>
                                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Plan Tomorrow:</span>
                                    <span className={styles.recValue}>{p.recommendedProduction}L</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <h2 className={styles.sectionTitle}>Production Workflow</h2>
                <div className={styles.actionGrid}>
                    <Link href="/admin/production/planning" className={styles.actionCard}>
                        <span className={styles.actionIcon}>📅</span>
                        <h3>Planning</h3>
                        <p>Daily output targets</p>
                    </Link>
                    <Link href="/admin/production/batches" className={styles.actionCard}>
                        <span className={styles.actionIcon}>🏭</span>
                        <h3>Process</h3>
                        <p>Batch execution</p>
                    </Link>
                    <Link href="/admin/production/qc" className={styles.actionCard}>
                        <span className={styles.actionIcon}>✅</span>
                        <h3>Quality</h3>
                        <p>Control & approval</p>
                    </Link>
                    <Link href="/admin/production/packaging" className={styles.actionCard}>
                        <span className={styles.actionIcon}>🏷️</span>
                        <h3>Package</h3>
                        <p>Bottling & labeling</p>
                    </Link>
                </div>
            </section>

            {/* Operational Units */}
            <section className={styles.unitsSection}>
                <h2 className={styles.sectionTitle}>Process Control Units</h2>
                <div className={styles.unitsGrid}>
                    {operationalUnits.map((unit, index) => (
                        <div key={index} className={styles.unitCard}>
                            <div className={styles.unitHeader}>
                                <span className={styles.unitIcon}>{unit.icon}</span>
                                <span className={`${styles.statusBadge} ${styles.active}`}>{unit.status}</span>
                            </div>
                            <h3 className={styles.unitName}>{unit.name}</h3>
                            <p className={styles.unitDescription}>{unit.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
