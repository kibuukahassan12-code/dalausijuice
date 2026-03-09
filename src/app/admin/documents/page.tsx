"use client";

import { useState } from "react";
import styles from "./documents.module.css";
import Image from "next/image";

type DocumentType = "Quotation" | "Invoice" | "Receipt";

export default function DocumentsPage() {
    const [docType, setDocType] = useState<DocumentType>("Quotation");
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [items, setItems] = useState([{ description: "", quantity: 1, price: 0 }]);
    const [docNumber, setDocNumber] = useState(`DJ-${Math.floor(1000 + Math.random() * 9000)}`);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [isPreview, setIsPreview] = useState(false);

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, price: 0 }]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

    const handlePrint = () => {
        window.print();
    };

    if (isPreview) {
        return (
            <div className={styles.previewMode}>
                <div className={styles.previewControls}>
                    <button onClick={() => setIsPreview(false)} className={styles.backBtn}>← Back to Edit</button>
                    <button onClick={handlePrint} className={styles.printBtn}>Print Document</button>
                </div>

                <div className={styles.documentPage} id="printable-document">
                    <div className={styles.docHeader}>
                        <div className={styles.brandInfo}>
                            <Image src="/images/dalausi-logo2.png" alt="Dalausi Juice" width={180} height={60} style={{ objectFit: 'contain' }} />
                            <p>Natural & Refreshing</p>
                        </div>
                        <div className={styles.docMeta}>
                            <h1>{docType}</h1>
                            <p><strong>No:</strong> {docNumber}</p>
                            <p><strong>Date:</strong> {new Date(date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className={styles.addressGrid}>
                        <div className={styles.fromAddress}>
                            <h3>From:</h3>
                            <p><strong>Dalausi Juice</strong></p>
                            <p>Plot 45, Kampala Road</p>
                            <p>Kampala, Uganda</p>
                            <p>+256 702 071 497</p>
                            <p>info@dalausijuice.com</p>
                        </div>
                        <div className={styles.toAddress}>
                            <h3>Bill To:</h3>
                            <p><strong>{clientName || "Valued Client"}</strong></p>
                            {clientEmail && <p>{clientEmail}</p>}
                            {clientPhone && <p>{clientPhone}</p>}
                        </div>
                    </div>

                    <table className={styles.docTable}>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className={styles.textRight}>Qty</th>
                                <th className={styles.textRight}>Unit Price</th>
                                <th className={styles.textRight}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i}>
                                    <td>{item.description || "N/A"}</td>
                                    <td className={styles.textRight}>{item.quantity}</td>
                                    <td className={styles.textRight}>UGX {item.price.toLocaleString()}</td>
                                    <td className={styles.textRight}>UGX {(item.quantity * item.price).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className={styles.textRight}><strong>Subtotal</strong></td>
                                <td className={styles.textRight}><strong>UGX {subtotal.toLocaleString()}</strong></td>
                            </tr>
                            <tr className={styles.grandTotal}>
                                <td colSpan={3} className={styles.textRight}><strong>Total Amount Due</strong></td>
                                <td className={styles.textRight}><strong>UGX {subtotal.toLocaleString()}</strong></td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className={styles.docFooter}>
                        <div className={styles.paymentInfo}>
                            <h3>Payment Method</h3>
                            <p>MTN Mobile Money: +256 702 071 497</p>
                            <p>Account Name: Dalausi Juice</p>
                        </div>
                        <div className={styles.thanks}>
                            <p>Thank you for your business!</p>
                            <div className={styles.signatureLine}>Authorized Signature</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.pageHeader}>
                <h1>Document Generator</h1>
                <div className={styles.typeSelector}>
                    {(["Quotation", "Invoice", "Receipt"] as DocumentType[]).map((type) => (
                        <button
                            key={type}
                            className={`${styles.typeBtn} ${docType === type ? styles.active : ""}`}
                            onClick={() => setDocType(type)}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </header>

            <div className={styles.editor}>
                <section className={styles.section}>
                    <h3>Basic Information</h3>
                    <div className={styles.inputGrid}>
                        <div className={styles.inputGroup}>
                            <label>Client Name</label>
                            <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Full Name" />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Client Email</label>
                            <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email Address" />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Client Phone</label>
                            <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Phone Number" />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>{docType} Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3>Items & Services</h3>
                        <button onClick={addItem} className={styles.addItemBtn}>+ Add Item</button>
                    </div>
                    <div className={styles.itemsList}>
                        {items.map((item, index) => (
                            <div key={index} className={styles.itemRow}>
                                <div className={styles.itemDesc}>
                                    <input
                                        value={item.description}
                                        onChange={(e) => updateItem(index, "description", e.target.value)}
                                        placeholder="Description of service/product"
                                    />
                                </div>
                                <div className={styles.itemQty}>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                                        placeholder="Qty"
                                    />
                                </div>
                                <div className={styles.itemPrice}>
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => updateItem(index, "price", parseFloat(e.target.value) || 0)}
                                        placeholder="Price (UGX)"
                                    />
                                </div>
                                <button onClick={() => removeItem(index)} className={styles.removeBtn}>×</button>
                            </div>
                        ))}
                    </div>
                    <div className={styles.summary}>
                        <p>Subtotal: <strong>UGX {subtotal.toLocaleString()}</strong></p>
                    </div>
                </section>

                <div className={styles.actions}>
                    <button onClick={() => setIsPreview(true)} className={styles.previewBtn}>Preview & Print</button>
                </div>
            </div>
        </div>
    );
}
