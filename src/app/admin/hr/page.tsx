"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./hr.module.css";
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

type HRKpis = {
    totalEmployees: number;
    casualThisMonth: number;
    payrollCostToday: number;
    payrollCostThisWeek: number;
    payrollCostThisMonth: number;
    departmentDistribution: { name: string; count: number }[];
    attendanceTrend: { date: string; count: number }[];
};

export default function HRPage() {
    const [kpis, setKpis] = useState<HRKpis | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/hr/dashboard");
            if (res.ok) {
                const data = await res.json();
                setKpis(data);
            }
        } catch (error) {
            console.error("Error fetching HR dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const operationalUnits = [
        { name: "Employee Management", description: "Register and track staff status", icon: "👤", status: "Active" },
        { name: "Attendance Tracking", description: "Daily check-in/out monitoring", icon: "⏰", status: "Active" },
        { name: "Payroll Processing", description: "Calculate salaries & tax", icon: "💰", status: "Active" },
        { name: "Department & Roles", description: "Organize staff hierarchy", icon: "🏢", status: "Active" },
    ];

    const COLORS = ['#3e1c33', '#f97316', '#10b981', '#3b82f6', '#8b5cf6'];

    const formatCurrency = (value: any) => `UGX ${Number(value || 0).toLocaleString()}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });

    return (
        <div className={styles.container} id="hr-dashboard">
            <header className={styles.header}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1>Human Resources Department</h1>
                        <p className={styles.purpose}>
                            <strong>Purpose:</strong> Manage employees, track attendance, and process payroll with automatic accounting integration.
                        </p>
                    </div>
                    <ExportButton elementId="hr-dashboard" filename={`HR_Report_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </header>

            {/* KPIs Section */}
            <section className={styles.kpiSection}>
                <h2 className={styles.sectionTitle}>Key Performance Indicators</h2>
                <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>👥</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Total Employees</h3>
                            <p className={styles.kpiValue}>{kpis?.totalEmployees || 0}</p>
                            <span className={styles.kpiUnit}>active staff</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>📅</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Casual Workers</h3>
                            <p className={styles.kpiValue}>{kpis?.casualThisMonth || 0}</p>
                            <span className={styles.kpiUnit}>this month</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>💵</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Payroll Cost (Today)</h3>
                            <p className={styles.kpiValue}>{formatCurrency(kpis?.payrollCostToday)}</p>
                            <span className={styles.kpiSubtext}>Week: {formatCurrency(kpis?.payrollCostThisWeek)}</span>
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <div className={styles.kpiIcon}>📊</div>
                        <div className={styles.kpiContent}>
                            <h3 className={styles.kpiLabel}>Monthly Payroll</h3>
                            <p className={styles.kpiValue}>{formatCurrency(kpis?.payrollCostThisMonth)}</p>
                            <span className={styles.kpiUnit}>total budget</span>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                {!loading && kpis && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "350px" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Department Distribution</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={kpis.departmentDistribution}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="count"
                                        >
                                            {kpis.departmentDistribution.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "350px" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>7-Day Attendance Trend</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={kpis.attendanceTrend}>
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
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="count" fill="#3e1c33" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <h2 className={styles.sectionTitle}>HR Operations</h2>
                <div className={styles.actionGrid}>
                    <Link href="/admin/hr/employees" className={styles.actionCard}>
                        <span className={styles.actionIcon}>👤</span>
                        <h3>Employees</h3>
                        <p>Manage staff details & status</p>
                    </Link>
                    <Link href="/admin/hr/attendance" className={styles.actionCard}>
                        <span className={styles.actionIcon}>⏰</span>
                        <h3>Attendance</h3>
                        <p>Daily check-in / check-out</p>
                    </Link>
                    <Link href="/admin/hr/payroll" className={styles.actionCard}>
                        <span className={styles.actionIcon}>💰</span>
                        <h3>Payroll</h3>
                        <p>Process monthly salaries</p>
                    </Link>
                </div>
            </section>

            {/* Operational Units */}
            <section className={styles.unitsSection}>
                <h2 className={styles.sectionTitle}>System Capabilities</h2>
                <p className={styles.sectionSubtitle}>End-to-end HR management lifecycle</p>
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
