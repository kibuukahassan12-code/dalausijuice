"use client";

import { useCart } from "@/contexts/CartContext";
import { useRouter, usePathname } from "next/navigation";
import styles from "./CartButton.module.css";

export default function CartButton() {
    const { itemCount } = useCart();
    const router = useRouter();
    const pathname = usePathname();

    if (pathname.startsWith("/admin")) return null;
    if (itemCount === 0) return null;

    return (
        <button
            className={styles.cartBtn}
            onClick={() => router.push("/checkout")}
        >
            <span className={styles.cartIcon}>🛒</span>
            <span className={styles.cartCount}>{itemCount}</span>
        </button>
    );
}
