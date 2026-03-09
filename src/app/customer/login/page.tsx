"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./auth.module.css";

export default function CustomerAuth() {
    const router = useRouter();

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.main}>
                <div className="container">
                    <div className={styles.authBox}>
                        <div className={styles.authHeader}>
                            <h1>Guest Ordering</h1>
                            <p>
                                Login is no longer required to order from Dalausi Juice!
                            </p>
                        </div>

                        <div className={styles.guestInfo}>
                            <div className={styles.infoIcon}>🧃</div>
                            <h2>Order Fresh Juice Without Login</h2>
                            <ul>
                                <li>✓ No account needed</li>
                                <li>✓ Pay with Mobile Money (MTN & Airtel)</li>
                                <li>✓ Quick and easy checkout</li>
                                <li>✓ Fresh juice delivered to you</li>
                            </ul>

                            <div className={styles.actionButtons}>
                                <button
                                    className={styles.primaryBtn}
                                    onClick={() => router.push("/daily-menu")}
                                >
                                    Browse Menu & Order
                                </button>
                                <button
                                    className={styles.secondaryBtn}
                                    onClick={() => router.push("/")}
                                >
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
