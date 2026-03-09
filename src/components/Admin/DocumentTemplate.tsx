"use client";

import Image from "next/image";
import styles from "./DocumentTemplate.module.css";

export type DocType = "QUOTATION" | "INVOICE" | "RECEIPT";

interface DocumentItem {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Payment {
    id: string;
    amountPaid: number;
    paymentDate: string;
    paymentMethod?: {
        name: string;
    };
    reference?: string;
}

interface DocumentTemplateProps {
    type: DocType;
    docNumber: string;
    date: string;
    clientName: string;
    clientPhone: string;
    items: DocumentItem[];
    setupFee?: number;
    serviceFee?: number;
    transportFee?: number;
    subtotal?: number;
    totalAmount: number;
    amountPaid: number;
    balanceDue: number;
    eventName?: string;
    eventDate?: string;
    location?: string;
    payments?: Payment[];
    exportMode?: boolean;
}

export default function DocumentTemplate({
    type,
    docNumber,
    date,
    clientName,
    clientPhone,
    items,
    setupFee = 0,
    serviceFee = 0,
    transportFee = 0,
    subtotal,
    totalAmount,
    amountPaid,
    balanceDue,
    eventName,
    eventDate,
    location,
    payments = [],
    exportMode = false,
}: DocumentTemplateProps) {
    const isReceipt = type === "RECEIPT";
    const receiptPayments = isReceipt && payments.length > 0 ? payments : (amountPaid > 0 ? [{
        id: "single",
        amountPaid,
        paymentDate: date,
        paymentMethod: { name: "Payment" }
    }] : []);
    const safeItems = Array.isArray(items) ? items : [];
    const safeDocNumber = docNumber ?? "";
    const safeDate = date ?? "";
    const safeClientName = clientName ?? "";
    const safeClientPhone = clientPhone ?? "";
    const safeEventName = eventName ?? "";
    const safeEventDate = eventDate ?? "";
    const safeLocation = location ?? "";
    const setupNum = Number(setupFee) || 0;
    const serviceNum = Number(serviceFee) || 0;
    const transportNum = Number(transportFee) || 0;

    /* Same layout, style, format for QUOTATION | INVOICE | RECEIPT — only labels vary by type */
    const toLabel = type === "QUOTATION" ? "Quote to:" : type === "RECEIPT" ? "Receipt for:" : "Invoice to:";
    const docNumberLabel = type === "QUOTATION" ? "Quotation #" : type === "RECEIPT" ? "Receipt #" : "Invoice #";

    return (
        <div className={styles.documentPage} id="printable-document">
            {/* Top: Centered title + logo right (image style) */}
            <header className={styles.docTopHeader}>
                <div className={styles.docTopTitleWrap}>
                    <h1 className={styles.docTopTitle}>{type}</h1>
                    <p className={styles.docTopSubtitle}>
                        {type === "QUOTATION" ? "Estimate" : type === "INVOICE" ? "Accounting" : "Payment received"}
                    </p>
                    <div className={styles.docDecor} aria-hidden>
                        <span className={styles.docDecorLine} />
                        <span className={styles.docDecorLine} />
                        <span className={styles.docDecorDot} />
                        <span className={styles.docDecorDot} />
                        <span className={styles.docDecorDot} />
                    </div>
                </div>
                <div className={styles.brandBlock}>
                    {exportMode ? (
                        <img
                            src={typeof window !== "undefined" ? `${window.location.origin}/images/dalausi-logo.jpg` : "/images/dalausi-logo.jpg"}
                            alt="Dalausi Juice"
                            width={120}
                            height={120}
                            className={styles.docLogo}
                        />
                    ) : (
                        <Image
                            src="/images/dalausi-logo.jpg"
                            alt="Dalausi Juice"
                            width={120}
                            height={120}
                            className={styles.docLogo}
                        />
                    )}
                    <p className={styles.brandName}>Dalausi Juice</p>
                    <p className={styles.slogan}>Natural & Refreshing</p>
                </div>
            </header>

            {/* Same block for all: Left = To + Event details, Right = Doc #, Date */}
            <div className={styles.docInvoiceBlock}>
                <div className={styles.docToBlock}>
                    <h2 className={styles.docTypeHeading}>{type}</h2>
                    <p className={styles.docToLabel}>{toLabel}</p>
                    <p className={styles.docToName}>{safeClientName}</p>
                    <p className={styles.docToContact}>{safeClientPhone}</p>
                    <div className={styles.eventDetailsBlock}>
                        <p className={styles.eventDetailsTitle}>Event details</p>
                        <p className={styles.eventDetail}><strong>Event:</strong> {safeEventName || "—"}</p>
                        <p className={styles.eventDetail}><strong>Date:</strong> {safeEventDate || "—"}</p>
                        <p className={styles.eventDetail}><strong>Location:</strong> {safeLocation || "—"}</p>
                    </div>
                </div>
                <div className={styles.docMetaBlock}>
                    <p className={styles.docMetaRow}><strong>{docNumberLabel}</strong> {safeDocNumber}</p>
                    <p className={styles.docMetaRow}><strong>Date</strong> {safeDate}</p>
                </div>
            </div>

            {/* Table: Dark header bar, columns No. | Service Description | Price | Qty. | Total */}
            <div className={styles.docTableWrap}>
            <table className={styles.docTable}>
                <thead>
                    <tr>
                        <th className={styles.colNo}>No.</th>
                        <th className={styles.colDesc}>Service / event description</th>
                        <th className={styles.colPrice}>Price</th>
                        <th className={styles.colQty}>Qty.</th>
                        <th className={styles.colTotal}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {safeItems.map((item, i) => (
                        <tr key={i}>
                            <td className={styles.colNo}>{i + 1}</td>
                            <td className={styles.colDesc}>{item?.description ?? "—"}</td>
                            <td className={styles.colPrice}>UGX {(item?.unitPrice ?? 0).toLocaleString()}</td>
                            <td className={styles.colQty}>{item?.quantity ?? 0}</td>
                            <td className={styles.colTotal}>UGX {(item?.totalPrice ?? 0).toLocaleString()}</td>
                        </tr>
                    ))}
                    {setupNum > 0 && (
                        <tr>
                            <td className={styles.colNo}>{safeItems.length + 1}</td>
                            <td className={styles.colDesc}>Setup fee</td>
                            <td className={styles.colPrice}>UGX {setupNum.toLocaleString()}</td>
                            <td className={styles.colQty}>1</td>
                            <td className={styles.colTotal}>UGX {setupNum.toLocaleString()}</td>
                        </tr>
                    )}
                    {serviceNum > 0 && (
                        <tr>
                            <td className={styles.colNo}>{safeItems.length + (setupNum > 0 ? 2 : 1)}</td>
                            <td className={styles.colDesc}>Service fee</td>
                            <td className={styles.colPrice}>UGX {serviceNum.toLocaleString()}</td>
                            <td className={styles.colQty}>1</td>
                            <td className={styles.colTotal}>UGX {serviceNum.toLocaleString()}</td>
                        </tr>
                    )}
                    {transportNum > 0 && (
                        <tr>
                            <td className={styles.colNo}>{safeItems.length + (setupNum > 0 ? 1 : 0) + (serviceNum > 0 ? 1 : 0) + 1}</td>
                            <td className={styles.colDesc}>Transport / shipping</td>
                            <td className={styles.colPrice}>UGX {transportNum.toLocaleString()}</td>
                            <td className={styles.colQty}>1</td>
                            <td className={styles.colTotal}>UGX {transportNum.toLocaleString()}</td>
                        </tr>
                    )}
                </tbody>
            </table>
            </div>

            {/* Summary: right-aligned, then total bar */}
            <div className={styles.summaryWrap}>
                <div className={styles.summaryBlock}>
                    {subtotal != null && (
                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <span>UGX {(subtotal ?? 0).toLocaleString()}</span>
                        </div>
                    )}
                    {transportNum > 0 && (
                        <div className={styles.summaryRow}>
                            <span>Shipping / transport</span>
                            <span>UGX {transportNum.toLocaleString()}</span>
                        </div>
                    )}
                    {type === "INVOICE" && (
                        <>
                            <div className={styles.summaryRow}>
                                <span>Amount paid</span>
                                <span>UGX {(amountPaid ?? 0).toLocaleString()}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Balance due</span>
                                <span>UGX {(balanceDue ?? 0).toLocaleString()}</span>
                            </div>
                        </>
                    )}
                    {type === "RECEIPT" && receiptPayments.length > 0 && (
                        <>
                            {receiptPayments.map((p, idx) => (
                                <div key={p.id || idx} className={styles.summaryRow}>
                                    <span>Payment {receiptPayments.length > 1 ? idx + 1 : ""} {p.paymentMethod?.name ?? "Payment"}</span>
                                    <span>UGX {(p?.amountPaid ?? 0).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className={styles.summaryRow}>
                                <span>Total received</span>
                                <span>UGX {(amountPaid ?? 0).toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.totalBar}>
                    <span>TOTAL</span>
                    <span>UGX {(totalAmount ?? 0).toLocaleString()}</span>
                </div>
            </div>

            {/* Footer: Left = Terms, Questions, Payment info. Right = Signature */}
            <div className={styles.docFooterGrid}>
                <div className={styles.docFooterLeft}>
                    <div className={styles.footerBlock}>
                        <h3 className={styles.footerBlockTitle}>Terms & conditions</h3>
                        <p className={styles.footerText}>
                            Payment due as per agreement. Please quote {type} number on payment. Dalausi Juice — natural juice catering.
                        </p>
                    </div>
                    <div className={styles.footerBlock}>
                        <h3 className={styles.footerBlockTitle}>Questions</h3>
                        <p className={styles.footerText}>Email: info@dalausijuice.com</p>
                        <p className={styles.footerText}>Call: +256 702 071 497</p>
                    </div>
                    <div className={styles.footerBlock}>
                        <h3 className={styles.footerBlockTitle}>Payment info</h3>
                        <p className={styles.footerText}>MTN Mobile Money: +256 702 071 497 (Dalausi Juice)</p>
                        <p className={styles.footerText}>Airtel Money: +256 750 000 000</p>
                        <p className={styles.footerText}>Use {type} # as reference.</p>
                    </div>
                </div>
                <div className={styles.docFooterRight}>
                    <p className={styles.thanksText}>Thank you for choosing Dalausi Juice!</p>
                    <div className={styles.signatureBlock}>
                        <div className={styles.sigLine} />
                        <p className={styles.sigLabel}>Authorised sign</p>
                    </div>
                </div>
            </div>

            {/* Full-width footer bar */}
            <footer className={styles.docFooterBar}>
                <span className={styles.footerBarText}>Dalausi Juice</span>
                <span className={styles.footerBarDivider}>|</span>
                <span className={styles.footerBarText}>info@dalausijuice.com</span>
                <span className={styles.footerBarDivider}>|</span>
                <span className={styles.footerBarText}>+256 702 071 497</span>
            </footer>
        </div>
    );
}
