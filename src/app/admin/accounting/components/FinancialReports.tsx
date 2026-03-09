import { useState } from "react";
import styles from "../accounting.module.css";
import { DashboardData } from "../types";

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

type BalanceSheetData = {
    brand: { name: string; department: string; generationDate: string };
    period: { type: string; startDate: string; endDate: string };
    data: {
        assets: { cash: number; bank: number; mobileMoney: number; receivables: number; inventory: number; total: number };
        liabilities: { payables: number; total: number };
        equity: { retainedEarnings: number; total: number };
    };
};

function n(value: unknown): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
}

export default function FinancialReports() {
    const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly" | "balance_sheet">("daily");
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            setReportData(null);
            setBalanceSheet(null);

            if (reportType === "balance_sheet") {
                const url = `/api/admin/accounting/reports/balance-sheet?date=${reportDate}&type=monthly`;
                const res = await fetch(url);
                const data = await res.json();
                if (res.ok) setBalanceSheet(data);
                return;
            }

            let url = `/api/admin/accounting/reports/${reportType}`;
            if (reportType === "daily") {
                url += `?date=${reportDate}`;
            } else if (reportType === "weekly") {
                const ws = new Date(reportDate);
                ws.setDate(ws.getDate() - ws.getDay());
                url += `?weekStart=${ws.toISOString().split("T")[0]}`;
            } else if (reportType === "monthly") {
                const [year, month] = reportDate.split("-");
                url += `?month=${year}-${month}`;
            }

            const res = await fetch(url);
            const data = await res.json().catch(() => ({}));
            if (res.ok && data && !data.error) {
                setReportData(data);
            }
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className={styles.viewSection}>
            <h2 className={styles.sectionTitle}>Financial Reports</h2>
            <div className={styles.reportControls}>
                <select value={reportType} onChange={(e) => setReportType(e.target.value as any)}>
                    <option value="daily">Daily Report</option>
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="balance_sheet">Balance Sheet (Branded)</option>
                </select>
                <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                />
                <button onClick={fetchReport} disabled={loading}>{loading ? "Generating..." : "Generate Report"}</button>
            </div>

            {reportData && (
                <div className={styles.reportResults}>
                    {reportType === "daily" && (
                        <div>
                            <h3>Daily Sales Summary (from ledger)</h3>
                            <p>Date: {reportData.date ?? reportDate}</p>
                            <p>Bottles: UGX {n(reportData.sales?.bottles).toLocaleString()}</p>
                            <p>Jerrycans: UGX {n(reportData.sales?.jerrycans).toLocaleString()}</p>
                            <p>Events: UGX {n(reportData.sales?.events).toLocaleString()}</p>
                            <p>Total: UGX {n(reportData.sales?.total).toLocaleString()}</p>
                            {reportData.cashPosition && (
                                <p>Cash position: Cash UGX {n(reportData.cashPosition.cash).toLocaleString()} | Bank UGX {n(reportData.cashPosition.bank).toLocaleString()} | Mobile UGX {n(reportData.cashPosition.mobileMoney).toLocaleString()}</p>
                            )}
                            <p>Profit estimate: UGX {n(reportData.profitEstimate).toLocaleString()}</p>
                        </div>
                    )}

                    {reportType === "weekly" && (
                        <div>
                            <h3>Weekly Trends (from ledger)</h3>
                            <p>Week: {reportData.weekStart ?? ""} – {reportData.weekEnd ?? ""}</p>
                            <div className={styles.trends}>
                                {(reportData.salesTrend ?? []).map(({ date, sales }: { date: string; sales: number }) => (
                                    <div key={date}>{date}: UGX {n(sales).toLocaleString()}</div>
                                ))}
                            </div>
                            {reportData.costPerLiterTrend && (
                                <p>COGS (from ledger): UGX {n(reportData.costPerLiterTrend.totalCost).toLocaleString()}</p>
                            )}
                            <p>Wastage: UGX {n(reportData.wastageCost).toLocaleString()}</p>
                            <p>Supplier spend: UGX {n(reportData.supplierSpend).toLocaleString()}</p>
                        </div>
                    )}

                    {reportType === "monthly" && reportData.profitAndLoss && (
                        <div>
                            <h3>Monthly Profit & Loss</h3>
                            <p>Revenue: UGX {n(reportData.profitAndLoss.revenue?.total).toLocaleString()}</p>
                            <p>COGS: UGX {n(reportData.profitAndLoss.cogs?.total).toLocaleString()}</p>
                            <p>Gross Profit: UGX {n(reportData.profitAndLoss.grossProfit).toLocaleString()}</p>
                            <p>Expenses: UGX {n(reportData.profitAndLoss.expenses?.total).toLocaleString()}</p>
                            <p className={styles.netProfit}>
                                Net Profit: UGX {n(reportData.profitAndLoss.netProfit).toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {balanceSheet && (
                <div className={styles.brandedReport} id="printable-report">
                    <div className={styles.reportHeader}>
                        <div className={styles.reportBrand}>
                            <img src="/images/dalausi-logo.jpg" alt="Dalausi Logo" className={styles.reportLogo} />
                            <div>
                                <h2>{balanceSheet.brand.name}</h2>
                                <p>{balanceSheet.brand.department}</p>
                            </div>
                        </div>
                        <div className={styles.reportMeta}>
                            <h3>Balance Sheet</h3>
                            <p>As of {new Date(balanceSheet.period.endDate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className={styles.reportSection}>
                        <h4>Assets</h4>
                        <div className={styles.reportRow}><span>Cash on Hand</span> <span>UGX {balanceSheet.data.assets.cash.toLocaleString()}</span></div>
                        <div className={styles.reportRow}><span>Bank Balance</span> <span>UGX {balanceSheet.data.assets.bank.toLocaleString()}</span></div>
                        <div className={styles.reportRow}><span>Mobile Money</span> <span>UGX {balanceSheet.data.assets.mobileMoney.toLocaleString()}</span></div>
                        <div className={styles.reportRow}><span>Accounts Receivable</span> <span>UGX {balanceSheet.data.assets.receivables.toLocaleString()}</span></div>
                        <div className={`${styles.reportRow} ${styles.totalRow}`}><span>Total Assets</span> <span>UGX {balanceSheet.data.assets.total.toLocaleString()}</span></div>
                    </div>

                    <div className={styles.reportSection}>
                        <h4>Liabilities</h4>
                        <div className={styles.reportRow}><span>Accounts Payable</span> <span>UGX {balanceSheet.data.liabilities.payables.toLocaleString()}</span></div>
                        <div className={`${styles.reportRow} ${styles.totalRow}`}><span>Total Liabilities</span> <span>UGX {balanceSheet.data.liabilities.total.toLocaleString()}</span></div>
                    </div>

                    <div className={styles.reportSection}>
                        <h4>Equity</h4>
                        <div className={styles.reportRow}><span>Retained Earnings</span> <span>UGX {balanceSheet.data.equity.retainedEarnings.toLocaleString()}</span></div>
                        <div className={`${styles.reportRow} ${styles.totalRow}`}><span>Total Equity</span> <span>UGX {balanceSheet.data.equity.total.toLocaleString()}</span></div>
                    </div>

                    <div className={styles.reportFooter}>
                        <p>Generated on {new Date(balanceSheet.brand.generationDate).toLocaleString()}</p>
                        <button className={styles.submitBtn} onClick={() => window.print()} style={{ marginTop: "1rem" }}>Print Report</button>
                    </div>
                </div>
            )}
        </section>
    );
}
