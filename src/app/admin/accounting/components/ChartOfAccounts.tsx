import styles from "../accounting.module.css";
import { Account } from "../types";

export default function ChartOfAccounts({ chartOfAccounts }: { chartOfAccounts: Account[] }) {
    return (
        <section className={styles.viewSection}>
            <h2 className={styles.sectionTitle}>Chart of Accounts</h2>
            <p className={styles.sectionSubtitle}>Juice-manufacturing-specific chart of accounts (seeded).</p>
            <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chartOfAccounts.map((a) => (
                            <tr key={a.id}>
                                <td>{a.account_code}</td>
                                <td>{a.account_name}</td>
                                <td>{a.account_type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {chartOfAccounts.length === 0 && <p>No accounts. Run seed.</p>}
            </div>
        </section>
    );
}
