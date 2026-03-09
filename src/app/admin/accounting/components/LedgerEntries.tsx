import styles from "../accounting.module.css";
import { LedgerEntry } from "../types";

export default function LedgerEntries({ entries }: { entries: LedgerEntry[] }) {
    return (
        <section className={styles.viewSection}>
            <h2 className={styles.sectionTitle}>Ledger Entries</h2>
            <p className={styles.sectionSubtitle}>Immutable audit trail. No deletes. All entries reference a source.</p>
            <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Account</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Source</th>
                            <th>Department</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((e) => (
                            <tr key={e.id}>
                                <td>{e.entry_date ? new Date(e.entry_date).toLocaleDateString() : "-"}</td>
                                <td>{e.account?.account_code} {e.account?.account_name}</td>
                                <td>{Number(e.debit_amount).toLocaleString()}</td>
                                <td>{Number(e.credit_amount).toLocaleString()}</td>
                                <td>{e.source_type} / {(e.source_id || "").slice(0, 12)}</td>
                                <td>{e.department}</td>
                                <td>{e.description ?? "-"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {entries.length === 0 && <p>No ledger entries yet.</p>}
            </div>
        </section>
    );
}
