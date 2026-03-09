"use client";

import { useState, useEffect } from "react";
import styles from "./accounting.module.css";
import { DashboardData, Period, Account, LedgerEntry } from "./types";

// Import components
import DashboardKPIs from "./components/DashboardKPIs";
import AccountantDashboard from "./components/AccountantDashboard";
import FinanceManagerDashboard from "./components/FinanceManagerDashboard";
import MDDashboard from "./components/MDDashboard";
import IncomeRecording from "./components/IncomeRecording";
import ExpenseRecording from "./components/ExpenseRecording";
import CashBook from "./components/CashBook";
import FinancialReports from "./components/FinancialReports";
import PeriodControl from "./components/PeriodControl";
import ChartOfAccounts from "./components/ChartOfAccounts";
import LedgerEntries from "./components/LedgerEntries";

const EMPTY_DASHBOARD: DashboardData = {
    currentPeriod: null,
    periodStatus: "OPEN",
    accountantView: {
        openPayables: 0,
        receivablesAging: { total: 0, current: 0 },
        dailyCashPosition: { cash: 0, bank: 0, mobileMoney: 0 },
    },
    financeManagerView: {
        profitability: { revenue: 0, cogs: 0, expenses: 0, netProfit: 0 },
        costPerLiter: 0,
        expenseTrends: {},
    },
    mdView: {
        dailySales: { bottles: 0, jerrycans: 0, events: 0, total: 0 },
        netProfit: 0,
        eventVsRetail: { event: 0, retail: 0 },
        wastageImpact: 0,
    },
};

type Tab = "accountant" | "finance" | "md" | "reports" | "periods" | "chart" | "ledger" | "income" | "expenses" | "cashbook";

export default function AccountingPage() {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("accountant");
    const [periods, setPeriods] = useState<Period[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<Account[]>([]);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/accounting/dashboard");
            const data = await res.json().catch(() => ({}));
            if (res.ok && data && typeof data.accountantView === "object") {
                setDashboard(data as DashboardData);
            } else {
                setDashboard(EMPTY_DASHBOARD);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            setDashboard(EMPTY_DASHBOARD);
        } finally {
            setLoading(false);
        }
    };

    const fetchPeriods = async () => {
        try {
            const res = await fetch("/api/admin/accounting/periods");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setPeriods(data);
        } catch { setPeriods([]); }
    };

    const fetchChartOfAccounts = async () => {
        try {
            const res = await fetch("/api/admin/accounting/chart-of-accounts");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setChartOfAccounts(data);
        } catch { setChartOfAccounts([]); }
    };

    const fetchLedger = async () => {
        try {
            const res = await fetch("/api/admin/accounting/entries");
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setLedgerEntries(data);
        } catch { setLedgerEntries([]); }
    };

    const closePeriod = async (periodMonth: string) => {
        if (!confirm(`Close period ${periodMonth}? No further entries will be allowed.`)) return;
        try {
            const res = await fetch("/api/admin/accounting/periods", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ periodMonth, closedBy: "admin" }),
            });
            const json = await res.json();
            if (res.ok) {
                fetchPeriods();
                fetchDashboard();
            } else {
                alert(json.error || "Failed to close period");
            }
        } catch (e) {
            alert("Failed to close period");
        }
    };

    if (loading) {
        return <div className={styles.container}>Loading KPIs...</div>;
    }

    const d = dashboard ?? EMPTY_DASHBOARD;

    const quickActions = [
        { id: "accountant" as const, label: "Accountant View", desc: "Payables, receivables, cash", icon: "📋" },
        { id: "finance" as const, label: "Finance Manager", desc: "Profitability & costs", icon: "📊" },
        { id: "md" as const, label: "MD View", desc: "Sales, profit, wastage", icon: "👔" },
        { id: "income" as const, label: "Record Income", desc: "Track all company income", icon: "💰" },
        { id: "expenses" as const, label: "Record Expenses", desc: "Track all company expenses", icon: "💸" },
        { id: "cashbook" as const, label: "Cash Book", desc: "Daily/weekly/monthly cash flow", icon: "📖" },
        { id: "reports" as const, label: "Reports", desc: "Daily, weekly, monthly", icon: "📈" },
        { id: "periods" as const, label: "Period Control", desc: "Close & lock periods", icon: "🔒" },
        { id: "chart" as const, label: "Chart of Accounts", desc: "Account hierarchy", icon: "📑" },
        { id: "ledger" as const, label: "Ledger", desc: "Audit trail", icon: "📒" },
    ];

    const operationalUnits = [
        { name: "General Ledger & Posting", description: "Source-driven double-entry bookkeeping, no deletes", icon: "📒", status: "Active" },
        { name: "Payables & Receivables", description: "AP aging, AR aging, supplier payments", icon: "💳", status: "Active" },
        { name: "Financial Reporting", description: "Daily, weekly, monthly P&L from ledger", icon: "📊", status: "Active" },
        { name: "Period Control & Audit", description: "Locked periods, audit-ready trail", icon: "🔐", status: "Active" },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case "accountant": return <AccountantDashboard d={d} />;
            case "finance": return <FinanceManagerDashboard d={d} />;
            case "md": return <MDDashboard d={d} />;
            case "income": return <IncomeRecording />;
            case "expenses": return <ExpenseRecording />;
            case "cashbook": return <CashBook />;
            case "reports": return <FinancialReports />;
            case "periods": return <PeriodControl periods={periods} onClosePeriod={closePeriod} />;
            case "chart": return <ChartOfAccounts chartOfAccounts={chartOfAccounts} />;
            case "ledger": return <LedgerEntries entries={ledgerEntries} />;
            default: return <AccountantDashboard d={d} />;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Accounting Department</h1>
                <p className={styles.purpose}>
                    <strong>Purpose:</strong> Source-driven, audit-ready accounting: ledger-only reporting, locked periods, no deletes.
                </p>
                <div className={styles.periodInfo}>
                    <span>Current Period: {d.currentPeriod ?? "Not set"}</span>
                    <span className={styles.status} data-status={(d.periodStatus ?? "open").toLowerCase()}>
                        {d.periodStatus ?? "OPEN"}
                    </span>
                </div>
            </header>

            {/* KPIs Section */}
            <DashboardKPIs d={d} />

            {/* Quick Actions */}
            <section className={styles.quickActions}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.actionGrid}>
                    {quickActions.map((a) => (
                        <div
                            key={a.id}
                            className={`${styles.actionCard} ${activeTab === a.id ? styles.active : ""}`}
                            onClick={() => {
                                setActiveTab(a.id);
                                if (a.id === "periods") fetchPeriods();
                                if (a.id === "chart") fetchChartOfAccounts();
                                if (a.id === "ledger") fetchLedger();
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setActiveTab(a.id);
                                    if (a.id === "periods") fetchPeriods();
                                    if (a.id === "chart") fetchChartOfAccounts();
                                    if (a.id === "ledger") fetchLedger();
                                }
                            }}
                        >
                            <span className={styles.actionIcon}>{a.icon}</span>
                            <h3>{a.label}</h3>
                            <p>{a.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Dynamic Tab Content */}
            {renderTabContent()}

            {/* Operational Units */}
            <section className={styles.unitsSection}>
                <h2 className={styles.sectionTitle}>Operational Units</h2>
                <p className={styles.sectionSubtitle}>Core functions within Accounting</p>
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
