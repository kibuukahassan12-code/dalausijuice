"use client";

import { useState, useEffect } from "react";
import styles from "./inventory.module.css";
import ExportButton from "@/components/Admin/ExportButton";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

type InventoryItem = {
    id: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    unitCost: number;
    lowStockThreshold?: number;
    expiryDate: string | null;
    supplier: string | null;
};

type Recipe = {
    id: string;
    productId: string;
    product: { name: string };
    ingredients: {
        inventoryItem: { name: string };
        quantity: number;
    }[];
};

type InventoryDashboard = {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    categoryDistribution: { name: string; value: number }[];
    topItems: { name: string; value: number; stock: number; unit: string }[];
    items: InventoryItem[];
};

export default function InventoryPage() {
    const [dashboard, setDashboard] = useState<InventoryDashboard | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [viewMode, setViewMode] = useState<"inventory" | "recipes">("inventory");
    const [formData, setFormData] = useState({
        name: "",
        category: "Fruit",
        unit: "kg",
        currentStock: "",
        unitCost: "",
        lowStockThreshold: "10",
        supplier: "",
        expiryDate: ""
    });

    useEffect(() => {
        fetchDashboard();
        fetchRecipes();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await fetch("/api/admin/inventory/dashboard");
            if (res.ok) {
                const data = await res.json();
                setDashboard(data);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecipes = async () => {
        try {
            const res = await fetch("/api/admin/inventory/recipes");
            if (res.ok) setRecipes(await res.json());
        } catch (e) { }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                setFormData({ name: "", category: "Fruit", unit: "kg", currentStock: "", unitCost: "", lowStockThreshold: "10", supplier: "", expiryDate: "" });
                fetchDashboard();
            }
        } catch (error) {
            alert("Failed to save item");
        }
    };

    const COLORS = ['#3e1c33', '#f97316', '#10b981', '#3b82f6', '#ef4444'];
    const formatCurrency = (val: any) => `UGX ${Number(val || 0).toLocaleString()}`;

    return (
        <div className={styles.container} id="inventory-dashboard">
            <header className={styles.header}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1>Production Inventory & BOM</h1>
                        <p className={styles.purpose}>
                            <strong>Automated Supply Chain:</strong> Inventory levels now auto-deduct based on production batches using saved recipes.
                        </p>
                    </div>
                    <ExportButton elementId="inventory-dashboard" filename={`Inventory_Report_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </header>

            {/* View Selection */}
            <div className={styles.tabHeader}>
                <button
                    className={`${styles.tabBtn} ${viewMode === "inventory" ? styles.activeTab : ""}`}
                    onClick={() => setViewMode("inventory")}
                >
                    📦 Master Stock
                </button>
                <button
                    className={`${styles.tabBtn} ${viewMode === "recipes" ? styles.activeTab : ""}`}
                    onClick={() => setViewMode("recipes")}
                >
                    📜 Juice Recipes (BOM)
                </button>
            </div>

            {viewMode === "inventory" ? (
                <>
                    {/* Dashboards */}
                    <section className={styles.kpiSection}>
                        <h2 className={styles.sectionTitle}>Global Stock Summary</h2>
                        <div className={styles.kpiGrid}>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>📦</div>
                                <div className={styles.kpiContent}>
                                    <h3 className={styles.kpiLabel}>Total SKU's</h3>
                                    <p className={styles.kpiValue}>{dashboard?.totalItems || 0}</p>
                                    <span className={styles.kpiUnit}>Items in inventory</span>
                                </div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>💰</div>
                                <div className={styles.kpiContent}>
                                    <h3 className={styles.kpiLabel}>Stock Value</h3>
                                    <p className={styles.kpiValue}>{formatCurrency(dashboard?.totalValue)}</p>
                                    <span className={styles.kpiUnit}>Total asset value</span>
                                </div>
                            </div>
                            <div className={styles.kpiCard}>
                                <div className={styles.kpiIcon}>⚠️</div>
                                <div className={styles.kpiContent}>
                                    <h3 className={styles.kpiLabel}>Critical Alerts</h3>
                                    <p className={styles.kpiValue} style={{ color: "#ef4444" }}>{dashboard?.lowStockItems || 0}</p>
                                    <span className={styles.kpiUnit}>Below reorder points</span>
                                </div>
                            </div>
                        </div>

                        {!loading && dashboard && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                                <div className={styles.kpiCard} style={{ flexDirection: "column", height: "400px" }}>
                                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Value by Category</h3>
                                    <div style={{ flex: 1, width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={dashboard.categoryDistribution}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {dashboard.categoryDistribution.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={formatCurrency} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className={styles.kpiCard} style={{ flexDirection: "column", height: "400px" }}>
                                    <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Top Assets (Value)</h3>
                                    <div style={{ flex: 1, width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={dashboard.topItems} layout="vertical" margin={{ left: 20, right: 30, top: 10, bottom: 10 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                                                <Tooltip formatter={formatCurrency} cursor={{ fill: '#f8fafc' }} />
                                                <Bar dataKey="value" fill="#3e1c33" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button className={styles.submitBtn} onClick={() => setShowForm(!showForm)}>
                            {showForm ? "Cancel" : "+ Add New Stock Item"}
                        </button>
                    </div>

                    {showForm && (
                        <section className={styles.formSection}>
                            <h2 className={styles.sectionTitle}>Record New Inventory Item</h2>
                            <form className={styles.form} onSubmit={handleSubmit}>
                                <div className={styles.inputGrid}>
                                    <div className={styles.inputGroup}>
                                        <label>Item Name</label>
                                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Passion Fruit" required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Category</label>
                                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                                            <option>Fruit</option>
                                            <option>Packaging</option>
                                            <option>Additive</option>
                                            <option>Equipment</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Unit</label>
                                        <select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                                            <option>kg</option>
                                            <option>liters</option>
                                            <option>pieces</option>
                                            <option>boxes</option>
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Initial Stock Level</label>
                                        <input type="number" step="0.01" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Unit Cost (UGX)</label>
                                        <input type="number" value={formData.unitCost} onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })} required />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Low Stock Alert Threshold</label>
                                        <input type="number" value={formData.lowStockThreshold} onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })} required />
                                    </div>
                                </div>
                                <button type="submit" className={styles.submitBtn}>Initialize Inventory Item</button>
                            </form>
                        </section>
                    )}

                    <section className={styles.listSection}>
                        <h2 className={styles.sectionTitle}>Master Stock Ledger</h2>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Category</th>
                                        <th>Stock Level</th>
                                        <th>Value</th>
                                        <th>Alert Point</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboard?.items.map(item => {
                                        const isLow = item.currentStock <= (item.lowStockThreshold || 10);
                                        return (
                                            <tr key={item.id}>
                                                <td><strong>{item.name}</strong></td>
                                                <td>{item.category}</td>
                                                <td style={{ color: isLow ? "#ef4444" : "inherit", fontWeight: isLow ? 700 : 400 }}>
                                                    {item.currentStock} {item.unit}
                                                </td>
                                                <td>{formatCurrency(item.currentStock * item.unitCost)}</td>
                                                <td>{item.lowStockThreshold || 10} {item.unit}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${isLow ? styles.low : styles.ok}`}>
                                                        {isLow ? "⚠️ REORDER" : "In Stock"}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            ) : (
                <section className={styles.listSection}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Standard Product Recipes (BOM)</h2>
                        <button className={styles.submitBtn} disabled>+ Define New Recipe</button>
                    </div>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Juice Flavor</th>
                                    <th>Standard Batch</th>
                                    <th>Required Materials</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipes.map(recipe => (
                                    <tr key={recipe.id}>
                                        <td><strong>{recipe.product.name}</strong></td>
                                        <td>1.0 Liter</td>
                                        <td>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                                {recipe.ingredients.map((ing, i) => (
                                                    <span key={i} className={styles.flavorTag}>
                                                        {ing.inventoryItem.name}: {ing.quantity}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <button className={styles.viewBtn} disabled>Edit BOM</button>
                                        </td>
                                    </tr>
                                ))}
                                {recipes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className={styles.empty}>
                                            No recipes defined. Automated inventory deduction will not work for new batches until recipes are added.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
