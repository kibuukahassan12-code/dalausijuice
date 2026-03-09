"use client";

import { useState, useEffect } from "react";
import styles from "./crm.module.css";
import ExportButton from "@/components/Admin/ExportButton";

type CustomerInsight = {
    id: string;
    name: string;
    phone: string;
    ltv: number;
    orderCount: number;
    favoriteProduct: string;
    lastActivity: string;
    isVIP: boolean;
};

export default function CRMPage() {
    const [insights, setInsights] = useState<CustomerInsight[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInsights();
    }, []);

    const fetchInsights = async () => {
        try {
            const res = await fetch("/api/admin/crm/insights");
            if (res.ok) {
                setInsights(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => `UGX ${val.toLocaleString()}`;

    return (
        <div className={styles.container} id="crm-dashboard">
            <header className={styles.header}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1>Customer Relationship Management (CRM)</h1>
                        <p className={styles.subtitle}>Identify VIPs, track loyalty, and understand client preferences.</p>
                    </div>
                    <ExportButton elementId="crm-dashboard" filename={`CRM_Insights_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>👑</span>
                    <div className={styles.statContent}>
                        <h3>VIP Clients</h3>
                        <p className={styles.statValue}>{insights.filter(i => i.isVIP).length}</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>📈</span>
                    <div className={styles.statContent}>
                        <h3>Avg. Lifetime Value</h3>
                        <p className={styles.statValue}>
                            {formatCurrency(insights.length ? insights.reduce((s, i) => s + i.ltv, 0) / insights.length : 0)}
                        </p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statIcon}>🛍️</span>
                    <div className={styles.statContent}>
                        <h3>Total Customer Base</h3>
                        <p className={styles.statValue}>{insights.length}</p>
                    </div>
                </div>
            </div>

            <section className={styles.listSection}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Phone</th>
                                <th>Lifetime Value</th>
                                <th>Order Count</th>
                                <th>Favorite Flavor</th>
                                <th>Last Pulse</th>
                                <th>Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            {insights.map((customer) => (
                                <tr key={customer.id} className={customer.isVIP ? styles.vipRow : ""}>
                                    <td>
                                        <strong>{customer.name}</strong>
                                        {customer.isVIP && <span className={styles.vipBadge}>VIP</span>}
                                    </td>
                                    <td>{customer.phone}</td>
                                    <td className={styles.ltvValue}>{formatCurrency(customer.ltv)}</td>
                                    <td>{customer.orderCount} txn</td>
                                    <td><span className={styles.flavorTag}>{customer.favoriteProduct}</span></td>
                                    <td>{new Date(customer.lastActivity).toLocaleDateString()}</td>
                                    <td>
                                        <span className={customer.isVIP ? styles.badgeVIP : styles.badgeRegular}>
                                            {customer.isVIP ? "Loyal VIP" : "Regular"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {!loading && insights.length === 0 && (
                                <tr>
                                    <td colSpan={7} className={styles.empty}>No customer data found yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
