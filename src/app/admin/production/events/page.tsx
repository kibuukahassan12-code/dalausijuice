"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../production.module.css";

const PRICE_PER_LITER = 10000;

export default function EventCateringPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form fields - exact as specified
    const [customer_id, setCustomerId] = useState("");
    const [client_name, setClientName] = useState("");
    const [event_date, setEventDate] = useState(new Date().toISOString().split("T")[0]);
    const [location, setLocation] = useState("");
    const [ordered_liters, setOrderedLiters] = useState("");

    useEffect(() => {
        fetchEvents();
        fetchCustomers();
    }, []);

    const fetchEvents = async () => {
        const res = await fetch("/api/admin/production/events");
        const data = await res.json();
        if (Array.isArray(data)) setEvents(data);
    };

    const fetchCustomers = async () => {
        const res = await fetch("/api/admin/customers");
        const data = await res.json();
        if (Array.isArray(data)) setCustomers(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer_id || !client_name || !event_date || !location || !ordered_liters) {
            alert("Please fill all required fields");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/production/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id,
                    client_name,
                    event_date,
                    location,
                    ordered_liters: Number(ordered_liters),
                }),
            });

            if (res.ok) {
                setCustomerId("");
                setClientName("");
                setEventDate(new Date().toISOString().split("T")[0]);
                setLocation("");
                setOrderedLiters("");
                fetchEvents();
            } else {
                const error = await res.json();
                alert(error.error || "Failed to create event");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to create event");
        } finally {
            setLoading(false);
        }
    };

    // Auto-calculations
    const jerrycans_required = ordered_liters ? Math.ceil(Number(ordered_liters) / 20) : 0;
    const total_value_ugx = ordered_liters ? Number(ordered_liters) * PRICE_PER_LITER : 0;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <Link href="/admin/production" className={styles.backLink}>← Back to Production</Link>
                    <h1>Event Catering</h1>
                    <p className={styles.purpose}>Create event orders for production. Events use JERRYCAN packaging only (10-20L).</p>
                </div>
            </header>

            <div className={styles.grid}>
                <section className={styles.formSection}>
                    <h2>New Event Order</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Customer *</label>
                            <select value={customer_id} onChange={(e) => setCustomerId(e.target.value)} required>
                                <option value="">Select customer</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Client Name *</label>
                            <input
                                type="text"
                                value={client_name}
                                onChange={(e) => setClientName(e.target.value)}
                                placeholder="Event client name"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Event Date *</label>
                            <input
                                type="date"
                                value={event_date}
                                onChange={(e) => setEventDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Location *</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Event location"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Ordered Liters *</label>
                            <input
                                type="number"
                                step="0.1"
                                value={ordered_liters}
                                onChange={(e) => setOrderedLiters(e.target.value)}
                                placeholder="e.g., 200"
                                required
                                min="10"
                            />
                            <small style={{ color: "#64748b" }}>Minimum 10L for events</small>
                        </div>

                        <div className={styles.summaryBox}>
                            <div className={styles.summaryRow}>
                                <span>Jerrycans Required (auto):</span>
                                <strong>{jerrycans_required} × 20L</strong>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Total Value (auto):</span>
                                <strong>UGX {total_value_ugx.toLocaleString()}</strong>
                            </div>
                            <small>Calculated: {ordered_liters || 0}L × UGX {PRICE_PER_LITER.toLocaleString()}/L</small>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Creating..." : "Create Event Order"}
                        </button>
                    </form>
                </section>

                <section className={styles.listSection}>
                    <h2>Event Orders</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Client Name</th>
                                    <th>Event Date</th>
                                    <th>Location</th>
                                    <th>Ordered (L)</th>
                                    <th>Jerrycans</th>
                                    <th>Total Value</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td>{event.client_name}</td>
                                        <td>{new Date(event.eventDate).toLocaleDateString()}</td>
                                        <td>{event.location}</td>
                                        <td>{event.ordered_liters?.toFixed(1)}L</td>
                                        <td>{event.jerrycans_required} × 20L</td>
                                        <td>UGX {event.total_value_ugx?.toLocaleString()}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[event.production_status?.toLowerCase() || ""]}`}>
                                                {event.production_status || "—"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {events.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className={styles.empty}>No event orders yet</td>
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
