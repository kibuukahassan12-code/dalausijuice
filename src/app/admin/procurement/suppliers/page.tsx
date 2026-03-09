"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../../production/production.module.css";

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [name, setName] = useState("");
    const [supplier_type, setSupplierType] = useState("FRUIT");
    const [contact_person, setContactPerson] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [payment_terms, setPaymentTerms] = useState("");
    const [default_unit_price, setDefaultUnitPrice] = useState("");
    const [status, setStatus] = useState("ACTIVE");

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        const res = await fetch("/api/admin/procurement/suppliers");
        const data = await res.json();
        if (Array.isArray(data)) setSuppliers(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !supplier_type || !contact_person || !phone) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/procurement/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    supplier_type,
                    contact_person,
                    phone,
                    email,
                    payment_terms,
                    default_unit_price,
                    status,
                }),
            });

            if (res.ok) {
                setName("");
                setSupplierType("FRUIT");
                setContactPerson("");
                setPhone("");
                setEmail("");
                setPaymentTerms("");
                setDefaultUnitPrice("");
                setStatus("ACTIVE");
                fetchSuppliers();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create supplier");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create supplier");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/procurement" className={styles.backLink}>← Back to Procurement</Link>
                    <h1>Supplier Management</h1>
                    <p className={styles.purpose}>Manage supplier database. No supplier → no purchase.</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>New Supplier</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Name *</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Supplier Type *</label>
                            <select value={supplier_type} onChange={(e) => setSupplierType(e.target.value)} required>
                                <option value="FRUIT">FRUIT</option>
                                <option value="PACKAGING">PACKAGING</option>
                                <option value="EQUIPMENT">EQUIPMENT</option>
                                <option value="SERVICES">SERVICES</option>
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Contact Person *</label>
                            <input type="text" value={contact_person} onChange={(e) => setContactPerson(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Phone *</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Payment Terms</label>
                            <input type="text" value={payment_terms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="e.g., Net 30" />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Default Unit Price (UGX)</label>
                            <input type="number" step="0.01" value={default_unit_price} onChange={(e) => setDefaultUnitPrice(e.target.value)} />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)}>
                                <option value="ACTIVE">ACTIVE</option>
                                <option value="SUSPENDED">SUSPENDED</option>
                            </select>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Creating..." : "Create Supplier"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Suppliers</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Contact</th>
                                    <th>Phone</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map((supplier) => (
                                    <tr key={supplier.id}>
                                        <td><strong>{supplier.name}</strong></td>
                                        <td>{supplier.supplier_type}</td>
                                        <td>{supplier.contact_person}</td>
                                        <td>{supplier.phone}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[supplier.status.toLowerCase()]}`}>
                                                {supplier.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {suppliers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className={styles.empty}>No suppliers yet</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
