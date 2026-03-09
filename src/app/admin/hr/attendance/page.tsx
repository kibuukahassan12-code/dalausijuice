"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../hr.module.css";

export default function AttendancePage() {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
    const [selectedEmployee, setSelectedEmployee] = useState("");

    useEffect(() => {
        fetchAttendance();
        fetchEmployees();
    }, [selectedDate]);

    const fetchAttendance = async () => {
        try {
            const url = `/api/admin/hr/attendance?date=${selectedDate}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setAttendance(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/admin/hr/employees");
            if (res.ok) {
                const data = await res.json();
                setEmployees(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        }
    };

    const handleCheckIn = async (employeeId: string) => {
        try {
            const res = await fetch("/api/admin/hr/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId,
                    date: selectedDate,
                    action: "check_in",
                }),
            });
            if (res.ok) {
                fetchAttendance();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to check in");
            }
        } catch (error) {
            alert("Failed to check in");
        }
    };

    const handleCheckOut = async (employeeId: string) => {
        try {
            const res = await fetch("/api/admin/hr/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    employeeId,
                    date: selectedDate,
                    action: "check_out",
                }),
            });
            if (res.ok) {
                fetchAttendance();
            } else {
                const err = await res.json();
                alert(err.error || "Failed to check out");
            }
        } catch (error) {
            alert("Failed to check out");
        }
    };

    const getAttendanceForEmployee = (employeeId: string) => {
        return attendance.find((a) => a.employeeId === employeeId);
    };

    if (loading) {
        return <div className={styles.container}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin/hr" className={styles.backLink}>← Back to HR</Link>
                <h1>Attendance Management</h1>
            </header>

            <section className={styles.quickActions}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                    <h2 className={styles.sectionTitle}>Attendance Records</h2>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Date:</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.5rem" }}
                        />
                    </div>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Employee No</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Hours Worked</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => {
                                const record = getAttendanceForEmployee(emp.id);
                                return (
                                    <tr key={emp.id}>
                                        <td>{emp.firstName} {emp.lastName}</td>
                                        <td>{emp.employeeNo}</td>
                                        <td>
                                            {record?.checkIn
                                                ? new Date(record.checkIn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                                                : "—"}
                                        </td>
                                        <td>
                                            {record?.checkOut
                                                ? new Date(record.checkOut).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
                                                : "—"}
                                        </td>
                                        <td>{record?.hoursWorked ? record.hoursWorked.toFixed(2) : "0.00"}</td>
                                        <td>
                                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                                {!record?.checkIn ? (
                                                    <button
                                                        onClick={() => handleCheckIn(emp.id)}
                                                        className={styles.submitBtn}
                                                        style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                                                    >
                                                        Check In
                                                    </button>
                                                ) : !record?.checkOut ? (
                                                    <button
                                                        onClick={() => handleCheckOut(emp.id)}
                                                        className={styles.submitBtn}
                                                        style={{ padding: "0.5rem 1rem", fontSize: "0.75rem" }}
                                                    >
                                                        Check Out
                                                    </button>
                                                ) : (
                                                    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Complete</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={6} className={styles.empty}>No employees found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
