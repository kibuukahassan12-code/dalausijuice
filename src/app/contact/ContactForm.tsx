"use client";

import { useState } from "react";
import styles from "./contact.module.css";

export default function ContactForm() {
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setStatus("loading");

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.get("name"),
                    email: formData.get("email"),
                    phone: formData.get("phone"),
                    message: formData.get("message"),
                }),
            });

            if (res.ok) {
                setStatus("success");
                form.reset();
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    }

    return (
        <form onSubmit={handleSubmit} className="contact-form">
            <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.formLabel}>
                    Name *
                </label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className={styles.formInput}
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                    Email *
                </label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className={styles.formInput}
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="phone" className={styles.formLabel}>
                    Phone
                </label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={styles.formInput}
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="message" className={styles.formLabel}>
                    Message *
                </label>
                <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className={styles.formTextarea}
                />
            </div>

            {status === "success" && (
                <p className={styles.successMessage}>
                    Thank you! Your message has been sent.
                </p>
            )}
            {status === "error" && (
                <p className={styles.errorMessage}>
                    Something went wrong. Please try again or contact us via WhatsApp.
                </p>
            )}

            <button
                type="submit"
                disabled={status === "loading"}
                className="btn btn-primary"
                style={{ width: "100%" }}
            >
                {status === "loading" ? "Sending..." : "Send Message"}
            </button>
        </form>
    );
}
