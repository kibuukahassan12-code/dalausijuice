"use client";

import { useState, useEffect } from "react";
import styles from "./orders.module.css";
import ExportButton from "@/components/Admin/ExportButton";
import ReceiptModal from "./ReceiptModal";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";

type OrderDashboard = {
    orders: any[];
    trend: { date: string; amount: number }[];
    productDistribution: { name: string; value: number }[];
    stats: {
        totalOrders: number;
        totalRevenue: number;
        pendingApproval: number;
        cancelledCount: number;
    };
};

export default function OrdersPage() {
    const [dashboard, setDashboard] = useState<OrderDashboard | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

    // Form State
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
    const [orderType, setOrderType] = useState("Delivery");
    const [transportFee, setTransportFee] = useState("0");
    const [selectedItems, setSelectedItems] = useState<{ productId: string, quantity: number, unitPrice: number }[]>([]);
    const [paymentMethodId, setPaymentMethodId] = useState("");
    const [amountPaid, setAmountPaid] = useState("");

    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);
    const [period, setPeriod] = useState("today");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const COLORS = ['#3e1c33', '#f97316', '#10b981', '#3b82f6', '#ef4444'];

    useEffect(() => {
        fetchDashboard();
        fetchProducts();
        fetchPaymentMethods();
    }, [period]);

    const fetchDashboard = async () => {
        try {
            console.log("[Orders Page] Fetching dashboard...");
            const res = await fetch(`/api/admin/orders/dashboard?period=${period}`, { cache: "no-store" });
            console.log("[Orders Page] Dashboard response status:", res.status);
            if (res.ok) {
                const data = await res.json();
                console.log("[Orders Page] Dashboard data:", data);
                setDashboard(data);
            } else {
                console.error("[Orders Page] Failed to fetch dashboard");
                setDashboard({ orders: [], trend: [], productDistribution: [], stats: { totalOrders: 0, totalRevenue: 0, pendingApproval: 0, cancelledCount: 0 } });
            }
        } catch (error) {
            console.error("[Orders Page] Error fetching dashboard:", error);
            setDashboard({ orders: [], trend: [], productDistribution: [], stats: { totalOrders: 0, totalRevenue: 0, pendingApproval: 0, cancelledCount: 0 } });
        }
        setLoading(false);
    };

    const fetchProducts = async () => {
        const res = await fetch("/api/admin/products");
        const data = await res.json();
        if (Array.isArray(data)) setProducts(data);
    };

    const fetchPaymentMethods = async () => {
        const res = await fetch("/api/admin/payment-methods");
        const data = await res.json();
        if (Array.isArray(data)) {
            setPaymentMethods(data);
            if (data.length > 0) setPaymentMethodId(data[0].id);
        }
    };

    const addItem = () => {
        if (products.length > 0) {
            setSelectedItems([...selectedItems, { productId: products[0].id, quantity: 1, unitPrice: products[0].unitPrice }]);
        }
    };

    const updateItem = (index: number, field: string, value: any) => {
        const nextItems = [...selectedItems];
        if (field === "productId") {
            const product = products.find(p => p.id === value);
            nextItems[index].productId = value;
            nextItems[index].unitPrice = product?.unitPrice || 10000;
        } else {
            (nextItems[index] as any)[field] = value;
        }
        setSelectedItems(nextItems);
    };

    const removeItem = (index: number) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const subtotal = selectedItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const totalAmount = subtotal + parseFloat(transportFee || "0");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedItems.length === 0) {
            alert("Please add at least one flavor");
            return;
        }
        setFormLoading(true);

        try {
            const res = await fetch("/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName, customerPhone, orderDate, orderType, transportFee,
                    items: selectedItems, paymentMethodId, amountPaid: amountPaid || "0"
                }),
            });

            if (res.status === 409) {
                const error = await res.json();
                if (confirm(`${error.message}\n\nDo you want to record it anyway?`)) {
                    const forceRes = await fetch("/api/admin/orders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            customerName, customerPhone, orderDate, orderType, transportFee,
                            items: selectedItems, paymentMethodId, amountPaid: amountPaid || "0", force: true
                        }),
                    });
                    if (forceRes.ok) {
                        const createdOrder = await forceRes.json();
                        resetForm();
                        // Show receipt for the newly created order
                        const paidAmount = createdOrder.paymentLinks?.reduce((sum: number, link: any) => sum + (link.payment?.amount || 0), 0) || parseFloat(amountPaid || "0");
                        const balanceDue = createdOrder.totalAmount - paidAmount;
                        setSelectedOrder({
                            ...createdOrder,
                            amountPaid: paidAmount,
                            balanceDue: balanceDue > 0 ? balanceDue : 0
                        });
                        setIsReceiptOpen(true);
                    } else {
                        alert("Failed to create order. Please try again.");
                    }
                }
            } else if (res.ok) {
                const createdOrder = await res.json();
                resetForm();
                // Show receipt for the newly created order
                const paidAmount = createdOrder.paymentLinks?.reduce((sum: number, link: any) => sum + (link.payment?.amount || 0), 0) || parseFloat(amountPaid || "0");
                const balanceDue = createdOrder.totalAmount - paidAmount;
                setSelectedOrder({
                    ...createdOrder,
                    amountPaid: paidAmount,
                    balanceDue: balanceDue > 0 ? balanceDue : 0
                });
                setIsReceiptOpen(true);
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create order.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setFormLoading(false);
        }
    };

    const resetForm = () => {
        setCustomerName("");
        setCustomerPhone("");
        setTransportFee("0");
        setSelectedItems([]);
        setAmountPaid("");
        fetchDashboard();
    };

    const handleAction = async (orderId: string, action: "APPROVE" | "CANCEL") => {
        if (!confirm(`${action === 'APPROVE' ? 'Approve' : 'Cancel'} this order?`)) return;
        try {
            const res = await fetch("/api/admin/orders/approve", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, action }),
            });
            if (res.ok) fetchDashboard();
        } catch (error) {
            console.error(error);
        }
    };

    const viewReceipt = (order: any) => {
        const amountPaid = order.paymentLinks?.reduce((sum: number, link: any) => sum + (link.payment?.amount || 0), 0) || 0;
        const balanceDue = order.totalAmount - amountPaid;
        setSelectedOrder({
            ...order,
            amountPaid,
            balanceDue: balanceDue > 0 ? balanceDue : 0
        });
        setIsReceiptOpen(true);
    };

    const downloadPDFReport = async () => {
        if (!dashboard?.orders?.length) {
            alert("No orders to generate report");
            return;
        }

        const doc = new jsPDF();
        const periodText = period.charAt(0).toUpperCase() + period.slice(1);
        
        // Title
        doc.setFontSize(20);
        doc.text(`Dalausi Juice - ${periodText} Orders Report`, 14, 20);
        
        // Date
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
        
        // Stats
        doc.setFontSize(14);
        doc.text("Summary:", 14, 45);
        doc.setFontSize(11);
        doc.text(`Total Orders: ${dashboard.stats.totalOrders}`, 14, 55);
        doc.text(`Total Revenue: UGX ${dashboard.stats.totalRevenue.toLocaleString()}`, 14, 62);
        doc.text(`Pending Approval: ${dashboard.stats.pendingApproval}`, 14, 69);
        doc.text(`Cancelled: ${dashboard.stats.cancelledCount}`, 14, 76);
        
        // Orders table
        const tableData = dashboard.orders.map((o: any) => [
            new Date(o.orderDate).toLocaleDateString(),
            o.customer.name,
            o.customer.phone,
            `UGX ${o.totalAmount.toLocaleString()}`,
            o.status,
            o.orderType
        ]);
        
        (doc as any).autoTable({
            startY: 90,
            head: [['Date', 'Customer', 'Phone', 'Total', 'Status', 'Type']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [62, 28, 51] },
            styles: { fontSize: 10 }
        });
        
        doc.save(`Orders-Report-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const formatCurrency = (val: any) => `UGX ${Number(val || 0).toLocaleString()}`;
    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short' });

    return (
        <div className={styles.container} id="orders-dashboard">
            <header className={styles.header}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1>Daily Client Orders</h1>
                        <p className={styles.purpose}>
                            <strong>Sales Ledger:</strong> Direct retail orders via Phone/WhatsApp. Linked to inventory and accounting.
                        </p>
                    </div>
                    <ExportButton elementId="orders-dashboard" filename={`Orders_Report_${new Date().toISOString().split('T')[0]}`} />
                </div>
            </header>

            {!loading && dashboard && (
                <section className={styles.kpiSection}>
                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>🥤</div>
                            <div className={styles.kpiContent}>
                                <h3 className={styles.kpiLabel}>Period Sales</h3>
                                <p className={styles.kpiValue}>{formatCurrency(dashboard.stats.totalRevenue)}</p>
                                <span className={styles.kpiUnit}>{dashboard.stats.totalOrders} successful orders</span>
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>⏳</div>
                            <div className={styles.kpiContent}>
                                <h3 className={styles.kpiLabel}>Pending Approval</h3>
                                <p className={styles.kpiValue} style={{ color: "#f97316" }}>{dashboard.stats.pendingApproval}</p>
                                <span className={styles.kpiUnit}>Orders awaiting ledger post</span>
                            </div>
                        </div>
                        <div className={styles.kpiCard}>
                            <div className={styles.kpiIcon}>🚫</div>
                            <div className={styles.kpiContent}>
                                <h3 className={styles.kpiLabel}>Cancelled</h3>
                                <p className={styles.kpiValue} style={{ color: "#ef4444" }}>{dashboard.stats.cancelledCount}</p>
                                <span className={styles.kpiUnit}>Excluded from revenue</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem", marginTop: "2rem" }}>
                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "350px", background: "white" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>Popular Flavors (qty)</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboard.productDistribution} layout="vertical">
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={100} />
                                        <Tooltip cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="value" fill="#3e1c33" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className={styles.kpiCard} style={{ flexDirection: "column", height: "350px", background: "white" }}>
                            <h3 className={styles.sectionTitle} style={{ fontSize: "1rem" }}>7-Day Revenue Pulse</h3>
                            <div style={{ flex: 1, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dashboard.trend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `${(val / 1000).toLocaleString()}k`} />
                                        <Tooltip formatter={formatCurrency} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <div className={styles.contentWrapper}>
                <section className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>New Order Record</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}>
                                <label>Customer Name</label>
                                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Phone Number</label>
                                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Order Date</label>
                                <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Order Type</label>
                                <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                                    <option value="Delivery">Delivery</option>
                                    <option value="Pickup">Pickup</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.itemsSection}>
                            <div className={styles.sectionHeader}>
                                <h3 style={{ fontSize: "0.9rem", color: "var(--color-plum)" }}>Selected Flavors</h3>
                                <button type="button" onClick={addItem} className={styles.addBtn}>+ Add Item</button>
                            </div>
                            {selectedItems.map((item, index) => (
                                <div key={index} className={styles.itemRow}>
                                    <select value={item.productId} onChange={(e) => updateItem(index, "productId", e.target.value)}>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <input type="number" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))} min="1" />
                                    <div className={styles.itemPrice}>{formatCurrency(item.quantity * item.unitPrice)}</div>
                                    <button type="button" onClick={() => removeItem(index)} className={styles.removeBtn}>×</button>
                                </div>
                            ))}
                        </div>

                        <div className={styles.financials}>
                            <div className={styles.inputGroup}>
                                <label>Transport Fee (UGX)</label>
                                <input type="number" value={transportFee} onChange={(e) => setTransportFee(e.target.value)} />
                            </div>
                            <div className={styles.summary}>
                                <div className={styles.summaryRow}>
                                    <span>Total Amount:</span>
                                    <strong style={{ color: "var(--color-plum)", fontSize: "1.2rem" }}>{formatCurrency(totalAmount)}</strong>
                                </div>
                            </div>
                        </div>

                        <div className={styles.paymentSection}>
                            <h3 style={{ fontSize: "0.9rem", color: "var(--color-plum)" }}>Payment Info</h3>
                            <div className={styles.inputGrid}>
                                <div className={styles.inputGroup}>
                                    <select value={paymentMethodId} onChange={(e) => setPaymentMethodId(e.target.value)}>
                                        {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder="Amount Paid" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={formLoading}>
                            {formLoading ? "Recording..." : "Post Official Order"}
                        </button>
                    </form>
                </section >

                <section className={styles.fullWidthSection}>
                    <div className={styles.listHeader}>
                        <h2 className={styles.sectionTitle}>Order History</h2>
                        <div className={styles.filterTabs}>
                            {["today", "week", "month", "all"].map(p => (
                                <button key={p} className={period === p ? styles.activeTab : ""} onClick={() => setPeriod(p)}>
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                            <button onClick={downloadPDFReport} className={styles.pdfReportBtn}>
                                Download PDF Report
                            </button>
                        </div>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Customer</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard?.orders.map((o) => (
                                    <tr key={o.id}>
                                        <td>{new Date(o.orderDate).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{o.customer.name}</div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{o.customer.phone}</div>
                                        </td>
                                        <td>{formatCurrency(o.totalAmount)}</td>
                                        <td>
                                            <span className={`${styles.status} ${styles[o.status.toLowerCase().replace(/\s+/g, '_')]}`}>
                                                {o.status}
                                            </span>
                                        </td>
                                        <td>
                                            {o.status === "Waiting Approval" ? (
                                                <div className={styles.actionCell}>
                                                    <button onClick={() => handleAction(o.id, "APPROVE")} className={styles.approveBtn}>Approve</button>
                                                    <button onClick={() => handleAction(o.id, "CANCEL")} className={styles.cancelBtn}>Cancel</button>
                                                </div>
                                            ) : o.status !== "Cancelled" && (
                                                <div className={styles.actionCell}>
                                                    <button onClick={() => viewReceipt(o)} className={styles.receiptBtn}>View Receipt</button>
                                                    <button onClick={() => handleAction(o.id, "CANCEL")} className={styles.cancelBtnSmall}>Cancel</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <ReceiptModal 
                order={selectedOrder} 
                isOpen={isReceiptOpen} 
                onClose={() => setIsReceiptOpen(false)} 
            />
        </div>
    );
}
