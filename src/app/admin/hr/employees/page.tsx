"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "../hr.module.css";

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        departmentId: "",
        roleId: "",
        employmentType: "FULL_TIME",
        hireDate: new Date().toISOString().split("T")[0],
        baseSalary: "",
    });

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
        fetchRoles();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await fetch("/api/admin/hr/employees");
            if (res.ok) {
                const data = await res.json();
                setEmployees(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await fetch("/api/admin/hr/departments");
            if (res.ok) {
                const data = await res.json();
                setDepartments(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching departments:", error);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await fetch("/api/admin/hr/roles");
            if (res.ok) {
                const data = await res.json();
                setRoles(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error("Error fetching roles:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/hr/employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                fetchEmployees();
                setShowForm(false);
                setFormData({
                    firstName: "",
                    lastName: "",
                    phone: "",
                    email: "",
                    departmentId: "",
                    roleId: "",
                    employmentType: "FULL_TIME",
                    hireDate: new Date().toISOString().split("T")[0],
                    baseSalary: "",
                });
            } else {
                const err = await res.json();
                alert(err.error || "Failed to create employee");
            }
        } catch (error) {
            alert("Failed to create employee");
        }
    };

    if (loading) {
        return <div className={styles.container}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <Link href="/admin/hr" className={styles.backLink}>← Back to HR</Link>
                <h1>Employee Management</h1>
            </header>

            <section className={styles.quickActions}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h2 className={styles.sectionTitle}>Employees</h2>
                    <button onClick={() => setShowForm(!showForm)} className={styles.submitBtn}>
                        {showForm ? "Cancel" : "+ Add Employee"}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGrid}>
                            <div className={styles.inputGroup}>
                                <label>First Name *</label>
                                <input
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Last Name *</label>
                                <input
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Phone *</label>
                                <input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Department *</label>
                                <select
                                    value={formData.departmentId}
                                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Role *</label>
                                <select
                                    value={formData.roleId}
                                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Employment Type *</label>
                                <select
                                    value={formData.employmentType}
                                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                                    required
                                >
                                    <option value="FULL_TIME">Full Time</option>
                                    <option value="PART_TIME">Part Time</option>
                                    <option value="CASUAL">Casual</option>
                                </select>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Hire Date *</label>
                                <input
                                    type="date"
                                    value={formData.hireDate}
                                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Base Salary (UGX) *</label>
                                <input
                                    type="number"
                                    value={formData.baseSalary}
                                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                                    required
                                    min="0"
                                />
                            </div>
                        </div>
                        <button type="submit" className={styles.submitBtn}>Create Employee</button>
                    </form>
                )}

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Employee No</th>
                                <th>Name</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Type</th>
                                <th>Salary</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.id}>
                                    <td>{emp.employeeNo}</td>
                                    <td>{emp.firstName} {emp.lastName}</td>
                                    <td>{emp.department?.name ?? "—"}</td>
                                    <td>{emp.role?.name ?? "—"}</td>
                                    <td>{emp.employmentType}</td>
                                    <td>UGX {emp.baseSalary?.toLocaleString() ?? "0"}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[emp.status?.toLowerCase()] ?? styles.active}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={7} className={styles.empty}>No employees yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
