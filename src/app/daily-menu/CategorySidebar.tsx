"use client";

import { useState } from "react";
import styles from "./daily-menu.module.css";

export default function CategorySidebar() {
    const [selectedCategory, setSelectedCategory] = useState("All");

    return (
        <aside className={styles.sidebar}>
            <h2 className={styles.sidebarTitle}>Categories</h2>
            <ul className={styles.categoryList}>
                {["All", "Juices"].map((category) => (
                    <li key={category}>
                        <button
                            className={`${styles.categoryBtn} ${category === selectedCategory ? styles.categoryBtnActive : ""}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
