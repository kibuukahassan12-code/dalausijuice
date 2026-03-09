import styles from "../accounting.module.css";
import { Period } from "../types";

export default function PeriodControl({ periods, onClosePeriod }: { periods: Period[]; onClosePeriod: (month: string) => void }) {
    return (
        <section className={styles.viewSection}>
            <h2 className={styles.sectionTitle}>Accounting Period Control</h2>
            <p className={styles.sectionSubtitle}>Locked periods block all ledger writes. Only OPEN periods accept new entries.</p>
            <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {periods.map((p) => (
                            <tr key={p.id}>
                                <td>{p.period_month}</td>
                                <td>{p.start_date ? new Date(p.start_date).toLocaleDateString() : "-"}</td>
                                <td>{p.end_date ? new Date(p.end_date).toLocaleDateString() : "-"}</td>
                                <td><span className={styles.status} data-status={(p.status || "open").toLowerCase()}>{p.status}</span></td>
                                <td>
                                    {p.status === "OPEN" ? (
                                        <button className={styles.closeBtn} onClick={() => onClosePeriod(p.period_month)}>Close Period</button>
                                    ) : (
                                        <span>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {periods.length === 0 && <p>No periods. Run seed to create periods.</p>}
            </div>
        </section>
    );
}
