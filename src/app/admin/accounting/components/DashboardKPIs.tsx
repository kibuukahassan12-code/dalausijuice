import styles from "../accounting.module.css";
import { DashboardData } from "../types";

export default function DashboardKPIs({ d }: { d: DashboardData }) {
    const totalCash = (d.accountantView?.dailyCashPosition?.cash || 0) +
        (d.accountantView?.dailyCashPosition?.bank || 0) +
        (d.accountantView?.dailyCashPosition?.mobileMoney || 0);

    return (
        <section className={styles.kpiSection}>
            <h2 className={styles.sectionTitle}>Key Performance Indicators</h2>
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>📤</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Open Payables</h3>
                        <p className={styles.kpiValue}>UGX {(d.accountantView?.openPayables || 0).toLocaleString()}</p>
                        <span className={styles.kpiUnit}>suppliers owed</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>📥</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Receivables</h3>
                        <p className={styles.kpiValue}>UGX {(d.accountantView?.receivablesAging?.total || 0).toLocaleString()}</p>
                        <span className={styles.kpiUnit}>clients owe</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>💵</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Daily Cash Position</h3>
                        <p className={styles.kpiValue}>UGX {totalCash.toLocaleString()}</p>
                        <span className={styles.kpiSubtext}>Cash + Bank + Mobile</span>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={styles.kpiIcon}>💰</div>
                    <div className={styles.kpiContent}>
                        <h3 className={styles.kpiLabel}>Net Profit (Month)</h3>
                        <p className={styles.kpiValue}>UGX {(d.financeManagerView?.profitability?.netProfit || 0).toLocaleString()}</p>
                        <span className={`${styles.kpiUnit} ${(d.financeManagerView?.profitability?.netProfit || 0) >= 0 ? styles.success : styles.warning}`}>
                            {(d.financeManagerView?.profitability?.netProfit || 0) >= 0 ? "Profitable" : "Loss"}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
