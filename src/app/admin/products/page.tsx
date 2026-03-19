"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./products.module.css";

/**
 * Eye (no cross) = visible on daily menu. Crossed eye = hidden from daily menu.
 * A click on either icon always toggles the state.
 */
function EyeIcon({ visible }: { visible: boolean }) {
    if (visible) {
        return (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Visible on daily menu — click to hide">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        );
    }
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Hidden from daily menu — click to show">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

export default function ProductsPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [unitPrice, setUnitPrice] = useState("10000");
    const [costPerUnit, setCostPerUnit] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const [menuStatus, setMenuStatus] = useState("OPEN");
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchProducts = async () => {
        const res = await fetch("/api/admin/products", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) {
            // Normalize showOnMenu: true or 1 = visible (open eye); false/0/undefined = hidden (crossed eye).
            setProducts(data.map((p: any) => ({ ...p, showOnMenu: Boolean(p.showOnMenu) })));
        }
    };

    const fetchMenuStatus = async () => {
        try {
            const res = await fetch("/api/admin/settings?key=daily_menu_status");
            const data = await res.json();
            if (data.value) setMenuStatus(data.value);
        } catch (error) {
            console.error("Error fetching menu status:", error);
        }
    };

    const updateMenuStatus = async (newStatus: string) => {
        console.log("[Toggle] Clicked. Current status:", menuStatus, "→ New status:", newStatus);
        setUpdatingStatus(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: "daily_menu_status", value: newStatus }),
            });
            console.log("[Toggle] API response status:", res.status);
            const data = await res.json();
            console.log("[Toggle] API response data:", data);
            
            if (res.ok || data.fallback) {
                setMenuStatus(newStatus);
                alert(`Menu is now ${newStatus === "OPEN" ? "OPEN" : "CLOSED"} for orders${data.fallback ? " (fallback mode)" : ""}`);
            } else {
                console.error("[Toggle] API error:", data.error);
                alert("Failed to update menu status. Please try again.");
            }
        } catch (error) {
            console.error("[Toggle] Network error:", error);
            alert("Network error. Please check your connection.");
        } finally {
            setUpdatingStatus(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchMenuStatus();
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        let imageUrl: string | null = null;
        try {
            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);
                const uploadRes = await fetch("/api/admin/products/upload", {
                    method: "POST",
                    body: formData,
                });
                if (!uploadRes.ok) throw new Error("Upload failed");
                const uploadData = await uploadRes.json();
                imageUrl = uploadData.imageUrl;
            }
            const res = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, unitPrice, costPerUnit, imageUrl, showOnMenu: true }),
            });
            if (res.ok) {
                setName("");
                setCostPerUnit("");
                setImageFile(null);
                setImagePreview(null);
                fetchProducts();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    /** Only runs on explicit click. Crossed eye → open eye (show on menu). Open eye → crossed eye (hide). Icon does not change unless this is called. */
    const toggleVisibility = async (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;
        const isVisibleOnMenu = Boolean(product.showOnMenu);
        const nextShowOnMenu = !isVisibleOnMenu;
        setTogglingId(productId);
        setProducts((prev) =>
            prev.map((p) => (p.id === productId ? { ...p, showOnMenu: nextShowOnMenu } : p))
        );
        try {
            const res = await fetch("/api/admin/products", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: productId, showOnMenu: nextShowOnMenu }),
                cache: "no-store",
            });
            if (!res.ok) {
                setProducts((prev) =>
                    prev.map((p) => (p.id === productId ? { ...p, showOnMenu: isVisibleOnMenu } : p))
                );
                setTogglingId(null);
                return;
            }
            // Do not refetch: icon state stays until user clicks again
        } catch (error) {
            console.error(error);
            setProducts((prev) =>
                prev.map((p) => (p.id === productId ? { ...p, showOnMenu: isVisibleOnMenu } : p))
            );
        } finally {
            setTogglingId(null);
        }
    };

    return (
        <div className={styles.container}>
            <section className={styles.formSection}>
                <h2>Add New Juice Flavor</h2>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Flavor Name</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Avocado Mix" required />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Sale Price (UGX)</label>
                        <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Production Cost (UGX)</label>
                        <input type="number" value={costPerUnit} onChange={(e) => setCostPerUnit(e.target.value)} placeholder="e.g. 4000" />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Flavor Image (for daily menu)</label>
                        <input type="file" accept="image/*" onChange={handleImageChange} className={styles.fileInput} />
                        {imagePreview && (
                            <div className={styles.previewWrap}>
                                <Image src={imagePreview} alt="Preview" width={80} height={80} className={styles.previewImg} />
                            </div>
                        )}
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? "Adding..." : "Add Flavor"}
                    </button>
                </form>
            </section>

            <section className={styles.listSection}>
                <h2>Current Flavors</h2>
                <p className={styles.menuHint}>
                    <span><EyeIcon visible={true} /> Eye = visible on daily menu — click to hide</span>
                    <span><EyeIcon visible={false} /> Crossed eye = hidden from daily menu — click to show</span>
                </p>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Sale Price</th>
                                <th>Estimated Cost</th>
                                <th>Margin</th>
                                <th>On Menu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        {p.imageUrl ? (
                                            <Image src={p.imageUrl} alt={p.name} width={48} height={48} className={styles.thumb} />
                                        ) : (
                                            <span className={styles.noImg}>—</span>
                                        )}
                                    </td>
                                    <td>{p.name}</td>
                                    <td>UGX {p.unitPrice?.toLocaleString()}</td>
                                    <td>{p.costPerUnit ? `UGX ${p.costPerUnit.toLocaleString()}` : "-"}</td>
                                    <td className={styles.margin}>
                                        {p.costPerUnit
                                            ? `UGX ${(p.unitPrice - p.costPerUnit).toLocaleString()}`
                                            : "N/A"}
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={styles.eyeBtn}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                toggleVisibility(p.id);
                                            }}
                                            disabled={togglingId === p.id}
                                            title={Boolean(p.showOnMenu) ? "Visible on daily menu — click to hide" : "Hidden from daily menu — click to show"}
                                            aria-label={Boolean(p.showOnMenu) ? "Hide from daily menu" : "Show on daily menu"}
                                        >
                                            <EyeIcon visible={Boolean(p.showOnMenu)} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className={styles.statusControls}>
                    <h3>Dalausi juice Daily Menu Status</h3>

                    <div className={styles.statusLabel}>
                        Status: <strong>{menuStatus === "OPEN" ? "Order Taking OPEN" : "Orders CLOSED"}</strong>
                    </div>

                    <button
                        type="button"
                        className={`${styles.toggleBtn} ${menuStatus === "OPEN" ? styles.toggleBtnOpen : styles.toggleBtnClosed}`}
                        onClick={() => {
                            console.log("[Button] onClick triggered");
                            const newStatus = menuStatus === "OPEN" ? "CLOSED" : "OPEN";
                            updateMenuStatus(newStatus);
                        }}
                        disabled={updatingStatus}
                    >
                        {updatingStatus ? "..." : menuStatus === "OPEN" ? "CLOSE ORDERS" : "OPEN ORDERS"}
                    </button>

                    <div className={`${styles.toggleText} ${menuStatus === "OPEN" ? styles.statusOpen : styles.statusClosed}`}>
                        {menuStatus === "OPEN" ? "Orders are OPEN — accepting new orders" : "Orders are CLOSED — not accepting orders"}
                    </div>
                </div>
            </section>
        </div>
    );
}
