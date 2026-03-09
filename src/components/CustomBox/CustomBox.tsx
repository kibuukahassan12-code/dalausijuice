"use client";

import { useState, useEffect } from "react";
import styles from "./box.module.css";
import Image from "next/image";

type Product = {
    id: string;
    name: string;
    unitPrice: number;
    imageUrl?: string;
};

export default function CustomBox() {
    const [products, setProducts] = useState<Product[]>([]);
    const [boxSize, setBoxSize] = useState<6 | 12>(6);
    const [selectedItems, setSelectedItems] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    useEffect(() => {
        fetch("/api/menu")
            .then(res => res.json())
            .then(data => {
                setProducts(data);
                setLoading(false);
            })
            .catch(err => console.error("Failed to load menu", err));
    }, []);

    const addItem = (product: Product) => {
        if (selectedItems.length < boxSize) {
            setSelectedItems([...selectedItems, product]);
        }
    };

    const removeItem = (index: number) => {
        const newItems = [...selectedItems];
        newItems.splice(index, 1);
        setSelectedItems(newItems);
    };

    const totalPrice = selectedItems.reduce((sum, item) => sum + item.unitPrice, 0);
    const progress = (selectedItems.length / boxSize) * 100;

    const filteredProducts = products.filter(p => {
        if (filter === "All") return true;
        if (filter === "Signatures") return p.name.toLowerCase().includes("cocktail") || p.name.toLowerCase().includes("meld");
        if (filter === "Pure Fruit") return !p.name.toLowerCase().includes("cocktail") && !p.name.toLowerCase().includes("meld");
        return true;
    });

    if (loading) return <div>Loading...</div>;

    return (
        <section className={styles.buildSection} id="build-your-box">
            <div className="container">
                <div className={styles.sectionHeader}>
                    <h2>Premium <span>Build-Your-Box</span></h2>
                    <p>Customize your curated Dalausi collection. Pick your favorites and we'll pack them fresh.</p>
                </div>

                <div className={styles.grid}>
                    {/* Left: Box Visual */}
                    <div className={styles.boxVisualArea}>
                        <div className={styles.sizeToggles}>
                            <button
                                className={boxSize === 6 ? styles.activeSize : ""}
                                onClick={() => { setBoxSize(6); setSelectedItems([]); }}
                            >
                                6-Pack Master
                            </button>
                            <button
                                className={boxSize === 12 ? styles.activeSize : ""}
                                onClick={() => { setBoxSize(12); setSelectedItems([]); }}
                            >
                                12-Pack Family
                            </button>
                        </div>

                        <div className={styles.progressContainer}>
                            <div className={styles.progressLabel}>
                                <span>Filling Your Box...</span>
                                <span>{selectedItems.length} / {boxSize}</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>

                        <div className={`${styles.boxContainer} ${boxSize === 6 ? styles.grid6 : styles.grid12}`}>
                            {Array.from({ length: boxSize }).map((_, i) => (
                                <div key={i} className={styles.slot} onClick={() => selectedItems[i] && removeItem(i)}>
                                    {selectedItems[i] ? (
                                        <div className={styles.filledSlot}>
                                        <Image 
                                        src={selectedItems[i].imageUrl || "/images/bottle-placeholder.png"} 
                                        alt={selectedItems[i].name}
                                        width={60}
                                        height={60}
                                        style={{ objectFit: "contain" }}
                                    />
                                            <span className={styles.slotLabel}>{selectedItems[i].name}</span>
                                            <button className={styles.removeBtn}>×</button>
                                        </div>
                                    ) : (
                                        <div className={styles.emptySlot}>
                                            <span>+</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className={styles.summaryBar}>
                            <div className={styles.summaryInfo}>
                                <span>Subtotal</span>
                                <strong>UGX {totalPrice.toLocaleString()}</strong>
                            </div>
                            <button className={styles.checkoutBtn} disabled={selectedItems.length < boxSize}>
                                {selectedItems.length < boxSize ? `Pick ${boxSize - selectedItems.length} More` : "Order Your Custom Box"}
                            </button>
                        </div>
                    </div>

                    {/* Right: Flavor Menu */}
                    <div className={styles.flavorMenu}>
                        <h2>Pick Your Flavors</h2>
                        <div className={styles.categoryFilter}>
                            {["All", "Signatures", "Pure Fruit"].map(cat => (
                                <button
                                    key={cat}
                                    className={`${styles.filterBtn} ${filter === cat ? styles.activeFilter : ""}`}
                                    onClick={() => setFilter(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className={styles.flavorGrid}>
                            {filteredProducts.map(product => (
                                <div key={product.id} className={styles.flavorCard} onClick={() => addItem(product)}>
                                    <div className={styles.imageWrapper}>
                                    <Image 
                                    src={product.imageUrl || "/images/bottle-placeholder.png"} 
                                    alt={product.name}
                                    width={80}
                                    height={80}
                                    style={{ objectFit: "contain" }}
                                />
                                    </div>
                                    <h3>{product.name}</h3>
                                    <p>UGX {product.unitPrice.toLocaleString()}</p>
                                    <button className={styles.addCta} disabled={selectedItems.length >= boxSize}>
                                        {selectedItems.length >= boxSize ? "Full" : "Add"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
