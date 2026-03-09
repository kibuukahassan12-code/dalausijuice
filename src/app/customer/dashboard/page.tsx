"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./portal.module.css";

type CustomerProfile = {
    customer: {
        id: string;
        name: string;
        phone: string;
        email: string | null;
        loyaltyTier: string;
        loyaltyPoints: number;
        referralCode: string | null;
        memberSince: string;
    };
    stats: {
        lifetimeSpend: number;
        totalOrders: number;
        completedOrders: number;
        pendingOrders: number;
    };
    loyalty: {
        tier: string;
        points: number;
        benefits: {
            discount: number;
            pointsMultiplier: number;
            perks: string[];
        };
        nextTier: string | null;
        progressToNext: number;
        spendToNextTier: number;
    };
    recentOrders: any[];
};

export default function CustomerPortal() {
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("order") === "success") {
            setShowSuccess(true);
            // Clean up URL
            window.history.replaceState(null, "", "/customer/dashboard");
            setTimeout(() => setShowSuccess(false), 5000);
        }
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/customer/profile");
            if (res.status === 401) {
                router.push("/customer/login");
                return;
            }
            const data = await res.json();
            setProfile(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getTierColor = (tier: string) => {
        const colors: Record<string, string> = {
            REGULAR: "#64748b",
            VIP: "#f59e0b",
            GOLD: "#eab308",
            PLATINUM: "#8b5cf6"
        };
        return colors[tier] || colors.REGULAR;
    };

    const getTierIcon = (tier: string) => {
        const icons: Record<string, string> = {
            REGULAR: "🥤",
            VIP: "⭐",
            GOLD: "👑",
            PLATINUM: "💎"
        };
        return icons[tier] || icons.REGULAR;
    };

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <Header />
                <main className={styles.main}>
                    <div className="container">
                        <div className={styles.loading}>Loading your dashboard...</div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // ... (rest of render)

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.main}>
                <div className="container">
                    {showSuccess && (
                        <div style={{
                            backgroundColor: "#dcfce7",
                            color: "#166534",
                            padding: "1rem",
                            borderRadius: "0.75rem",
                            marginBottom: "1.5rem",
                            border: "1px solid #bbf7d0",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            fontWeight: 500
                        }}>
                            <span style={{ fontSize: "1.25rem" }}>🎉</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Order Placed Successfully!</h3>
                                <p style={{ margin: 0, fontSize: "0.9rem" }}>Thank you for your order. You've earned loyalty points!</p>
                            </div>
                        </div>
                    )}

                    <div className={styles.hero}>
                        <h1>Welcome back, <span className={styles.highlight}>{profile.customer.name}</span></h1>
                        <p>Your Dalausi Rewards Dashboard</p>
                    </div>

                    {/* Loyalty Tier Card */}
                    <div className={styles.tierCard} style={{ borderColor: getTierColor(profile.loyalty.tier) }}>
                        <div className={styles.tierHeader}>
                            <div className={styles.tierBadge} style={{ background: getTierColor(profile.loyalty.tier) }}>
                                <span className={styles.tierIcon}>{getTierIcon(profile.loyalty.tier)}</span>
                                <span className={styles.tierName}>{profile.loyalty.tier}</span>
                            </div>
                            <div className={styles.tierPoints}>
                                <span className={styles.pointsValue}>{profile.loyalty.points.toLocaleString()}</span>
                                <span className={styles.pointsLabel}>Loyalty Points</span>
                            </div>
                        </div>

                        <div className={styles.tierBenefits}>
                            <h3>Your Perks</h3>
                            <div className={styles.perksList}>
                                {profile.loyalty.benefits.perks.map((perk, i) => (
                                    <div key={i} className={styles.perk}>
                                        <span className={styles.perkIcon}>✓</span>
                                        {perk}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {profile.loyalty.nextTier && (
                            <div className={styles.tierProgress}>
                                <div className={styles.progressHeader}>
                                    <span>Progress to {profile.loyalty.nextTier}</span>
                                    <span>{profile.loyalty.progressToNext.toFixed(0)}%</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: `${profile.loyalty.progressToNext}%`,
                                            background: getTierColor(profile.loyalty.nextTier)
                                        }}
                                    ></div>
                                </div>
                                <p className={styles.progressText}>
                                    Spend UGX {profile.loyalty.spendToNextTier.toLocaleString()} more to unlock {profile.loyalty.nextTier} status
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>💰</div>
                            <div className={styles.statContent}>
                                <h4>Lifetime Spend</h4>
                                <p className={styles.statValue}>UGX {profile.stats.lifetimeSpend.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>📦</div>
                            <div className={styles.statContent}>
                                <h4>Total Orders</h4>
                                <p className={styles.statValue}>{profile.stats.totalOrders}</p>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>✅</div>
                            <div className={styles.statContent}>
                                <h4>Completed</h4>
                                <p className={styles.statValue}>{profile.stats.completedOrders}</p>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statIcon}>🕐</div>
                            <div className={styles.statContent}>
                                <h4>Pending</h4>
                                <p className={styles.statValue}>{profile.stats.pendingOrders}</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders */}
                    <div className={styles.ordersSection}>
                        <h2>Recent Orders</h2>
                        {profile.recentOrders.length === 0 ? (
                            <div className={styles.emptyState}>
                                <p>No orders yet. Start shopping to earn rewards!</p>
                                <a href="/daily-menu" className={styles.shopBtn}>Browse Menu</a>
                            </div>
                        ) : (
                            <div className={styles.ordersList}>
                                {profile.recentOrders.map(order => (
                                    <div key={order.id} className={styles.orderCard}>
                                        <div className={styles.orderHeader}>
                                            <div>
                                                <h4>Order #{order.id.slice(0, 8)}</h4>
                                                <p className={styles.orderDate}>
                                                    {new Date(order.orderDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className={styles.orderStatus}>
                                                <span className={`${styles.statusBadge} ${styles[order.status.toLowerCase()]}`}>
                                                    {order.status}
                                                </span>
                                                <p className={styles.orderTotal}>
                                                    UGX {order.totalAmount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={styles.orderItems}>
                                            {order.items.map((item: any, i: number) => (
                                                <div key={i} className={styles.orderItem}>
                                                    <span>{item.quantity}x {item.product}</span>
                                                    <span>UGX {item.price.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
