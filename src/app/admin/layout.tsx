"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";
import Image from "next/image";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    const handleLogout = async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
    };

    const menuItems = [
        { name: "Dashboard", path: "/admin", icon: "📊" },
        { name: "Daily Orders", path: "/admin/orders", icon: "🥤" },
        { name: "Events", path: "/admin/events", icon: "🎉" },
        { name: "Production", path: "/admin/production", icon: "🏭" },
        { name: "Procurement", path: "/admin/procurement", icon: "🍎" },
        { name: "Accounting", path: "/admin/accounting", icon: "💰" },
        { name: "Inventory", path: "/admin/inventory", icon: "📦" },
        { name: "Products", path: "/admin/products", icon: "🏷️" },
        { name: "Customer Relations", path: "/admin/crm", icon: "👑" },
        { name: "Human Resources", path: "/admin/hr", icon: "👥" },
    ];

    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNoti, setShowNoti] = useState(false);

    useEffect(() => {
        if (pathname !== "/admin/login") {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [pathname]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/admin/notifications");
            if (res.ok) setNotifications(await res.json());
        } catch (e) { }
    };

    return (
        <div className={styles.adminContainer}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/">
                        <Image src="/images/dalausi-logo.jpg" alt="Dalausi Juice" width={120} height={120} style={{ objectFit: 'contain' }} />
                    </Link>
                    <h2>Admin</h2>
                    <button 
                        className={styles.mobileMenuBtn} 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? '✕' : '☰'}
                    </button>
                </div>

                <nav className={`${styles.nav} ${mobileMenuOpen ? styles.open : ''}`}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.navLink} ${pathname === item.path ? styles.active : ""}`}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.name}</span>
                        </Link>
                    ))}
                    <button onClick={handleLogout} className={`${styles.navLink} ${styles.mobileLogout}`}>
                        <span className={styles.icon}>🚪</span>
                        <span className={styles.label}>Logout</span>
                    </button>
                </nav>

                <div className={styles.sidebarFooter}>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className={styles.mainContent}>
                <header className={styles.topHeader}>
                    <div className={styles.topHeaderContent}>
                        <h3>{menuItems.find(m => m.path === pathname)?.name || "Admin"}</h3>

                        <div className={styles.notificationCenter}>
                            <button className={styles.bellBtn} onClick={() => setShowNoti(!showNoti)}>
                                🔔
                                {notifications.length > 0 && <span className={styles.badge}>{notifications.length}</span>}
                            </button>

                            {showNoti && (
                                <div className={styles.notificationDropdown}>
                                    <div className={styles.dropdownHeader}>
                                        <h4>Command Center Alerts</h4>
                                        <button onClick={() => setShowNoti(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>✕</button>
                                    </div>
                                    <div className={styles.notificationList}>
                                        {notifications.map((n, i) => (
                                            <Link key={i} href={n.path} className={styles.notificationItem} onClick={() => setShowNoti(false)}>
                                                <span className={styles.notiIcon}>{n.type === 'alert' ? '🔴' : n.type === 'warning' ? '🟠' : '🔵'}</span>
                                                <div className={styles.notiContent}>
                                                    <h5>{n.title}</h5>
                                                    <p>{n.message}</p>
                                                </div>
                                            </Link>
                                        ))}
                                        {notifications.length === 0 && (
                                            <div className={styles.emptyNoti}>All systems green. No active alerts.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className={styles.pageContent}>
                    {children}
                </div>
            </main>
        </div>
    );
}
