"use client";

import { useState } from "react";
import styles from "./quote.module.css";
import Image from "next/image";

export default function QuoteEngine() {
    const [guests, setGuests] = useState(100);
    const [services, setServices] = useState({
        juice: true,
        vip: false,
        fruits: false,
        tea: false,
        mocktails: false
    });
    const [downloading, setDownloading] = useState(false);

    const JERRYCAN_PRICE = 200000;
    const VIP_PRICE = 500000;
    const FRUIT_PRICE_PER_100 = 1000000;
    const TEA_PRICE_PER_100 = 700000;
    const MOCKTAIL_PRICE_PER_GLASS = 15000;

    // Calculation Logic
    const litersNeeded = Math.ceil(guests * 1.6); // 1.6L per 1 guest recommended
    const jerrycans = Math.ceil(litersNeeded / 20);
    const juiceTotal = jerrycans * JERRYCAN_PRICE;

    const fruitTotal = services.fruits ? (Math.ceil(guests / 100) * FRUIT_PRICE_PER_100) : 0;
    const teaTotal = services.tea ? (Math.ceil(guests / 100) * TEA_PRICE_PER_100) : 0;
    const vipTotal = services.vip ? VIP_PRICE : 0;
    const mocktailTotal = services.mocktails ? (guests * MOCKTAIL_PRICE_PER_GLASS) : 0;

    const subtotal = juiceTotal + fruitTotal + teaTotal + vipTotal + mocktailTotal;
    const serviceFee = subtotal * 0.1;
    const grandTotal = subtotal + serviceFee;

    // Build line items for PDF
    const buildLineItems = () => {
        const items: { description: string; total: number }[] = [];
        items.push({
            description: `Fresh Juice Service (${jerrycans} Jerrycans / ${jerrycans * 20}L)`,
            total: juiceTotal
        });
        if (services.vip) {
            items.push({ description: "VIP Signature Welcome (Bride & Groom)", total: VIP_PRICE });
        }
        if (services.fruits) {
            items.push({ description: "Artisan Fresh Fruit Display & Carvings", total: fruitTotal });
        }
        if (services.tea) {
            items.push({ description: "Full Spiced Tea & Coffee Service", total: teaTotal });
        }
        if (services.mocktails) {
            items.push({ description: `Premium Mocktail Service (${guests} glasses)`, total: mocktailTotal });
        }
        return items;
    };

    const handleDownloadPDF = async () => {
        setDownloading(true);
        try {
            const { generateQuotePDF } = await import("@/lib/quote-pdf");
            await generateQuotePDF({
                guests,
                items: buildLineItems(),
                subtotal,
                serviceFee,
                grandTotal,
                date: new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }),
            });
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <section className={styles.engineSection} id="quote-calculator">
            <div className="container">
                <div className={styles.sectionHeader}>
                    <h2>Instant Catering <span>Quote</span></h2>
                    <p>Planning a wedding or corporate event? Get a professional estimate in seconds.</p>
                </div>

                <div className={styles.grid}>
                    {/* Inputs */}
                    <div className={styles.inputsCard}>
                        <h2>Event Details</h2>
                        <div className={styles.inputGroup}>
                            <label>Number of Guests</label>
                            <input
                                type="number"
                                value={guests}
                                onChange={(e) => setGuests(parseInt(e.target.value) || 0)}
                                min="10"
                            />
                        </div>

                        <div className={styles.servicesGrid}>
                            <div className={styles.checkboxGroup}>
                                <input type="checkbox" checked={services.juice} disabled />
                                <label>Standard Juice Service (Fresh 20L Jerrycans)</label>
                            </div>
                            <div className={styles.checkboxGroup}>
                                <input type="checkbox" checked={services.vip} onChange={(e) => setServices({ ...services, vip: e.target.checked })} />
                                <label>VIP Signature Welcome (Bride & Groom)</label>
                            </div>
                            <div className={styles.checkboxGroup}>
                                <input type="checkbox" checked={services.fruits} onChange={(e) => setServices({ ...services, fruits: e.target.checked })} />
                                <label>Artisan Fruit Display & Carvings</label>
                            </div>
                            <div className={styles.checkboxGroup}>
                                <input type="checkbox" checked={services.tea} onChange={(e) => setServices({ ...services, tea: e.target.checked })} />
                                <label>Spiced Tea & Coffee Service</label>
                            </div>
                            <div className={styles.checkboxGroup}>
                                <input type="checkbox" checked={services.mocktails} onChange={(e) => setServices({ ...services, mocktails: e.target.checked })} />
                                <label>Custom Mocktails (Waitstaff Service)</label>
                            </div>
                        </div>
                    </div>

                    {/* Output (Quote) */}
                    <div className={styles.quoteArea} id="event-quote-output">
                        <div className={styles.quoteHeader}>
                            <Image 
                                src="/images/dalausi-logo.jpg" 
                                alt="Dalausi Juice" 
                                width={120}
                                height={60}
                                className={styles.quoteLogo}
                                style={{ objectFit: "contain" }}
                            />
                            <div style={{ textAlign: "right" }}>
                                <h3>PROVISIONAL QUOTE</h3>
                                <p>DATE: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            </div>
                        </div>

                        <div className={styles.quoteBody}>
                            <p><strong>Proposed For:</strong> Event Catering ({guests} Guests)</p>
                            <hr />
                            <table className={styles.quoteTable}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left" }}>Item Description</th>
                                        <th style={{ textAlign: "right" }}>Total (UGX)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Fresh Juice Service ({jerrycans} Jerrycans / {jerrycans * 20}L)</td>
                                        <td style={{ textAlign: "right" }}>{juiceTotal.toLocaleString()}</td>
                                    </tr>
                                    {services.vip && (
                                        <tr>
                                            <td>VIP Signature Welcome</td>
                                            <td style={{ textAlign: "right" }}>{VIP_PRICE.toLocaleString()}</td>
                                        </tr>
                                    )}
                                    {services.fruits && (
                                        <tr>
                                            <td>Assorted Fresh Fruit Display</td>
                                            <td style={{ textAlign: "right" }}>{fruitTotal.toLocaleString()}</td>
                                        </tr>
                                    )}
                                    {services.tea && (
                                        <tr>
                                            <td>Full Spiced Tea & Coffee Service</td>
                                            <td style={{ textAlign: "right" }}>{teaTotal.toLocaleString()}</td>
                                        </tr>
                                    )}
                                    {services.mocktails && (
                                        <tr>
                                            <td>Premium Mocktail Service ({guests} glasses)</td>
                                            <td style={{ textAlign: "right" }}>{mocktailTotal.toLocaleString()}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.quoteFooter}>
                            <div className={styles.feeLine}>
                                <span>Subtotal:</span>
                                <span>UGX {subtotal.toLocaleString()}</span>
                            </div>
                            <div className={styles.feeLine}>
                                <span>Service, Logistics & Setup (10%):</span>
                                <span>UGX {serviceFee.toLocaleString()}</span>
                            </div>
                            <div className={styles.totalLine}>
                                <span>GRAND TOTAL:</span>
                                <span>UGX {grandTotal.toLocaleString()}</span>
                            </div>
                            <p className={styles.disclaimer}>*This is a provisional quote based on standard event logistics. Final pricing may vary based on location and specific requirements.</p>
                        </div>
                        <div className={styles.downloadCta}>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={downloading}
                                className={styles.pdfBtn}
                            >
                                {downloading ? "⌛ Generating..." : "📄 Download PDF Quote"}
                            </button>
                            <a href={`https://wa.me/256702071497?text=hello%20dalausi%20i%20got%20this%20quote%20for%20a%20${guests}%20guest%20event%20with%20grand%20total%20${grandTotal}`} className={styles.waBtn}>
                                Confirm on WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
