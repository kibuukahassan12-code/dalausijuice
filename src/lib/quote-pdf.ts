import jsPDF from "jspdf";

/**
 * Branded Dalausi Juice Provisional Catering Quote PDF
 * Modeled after the event DocumentTemplate layout:
 *   - Header with logo + title
 *   - Client/event details block
 *   - Professional table with dark header
 *   - Summary with subtotal, service fee, grand total bar
 *   - Footer with terms, contact info, payment info, signature
 *   - Bottom branded bar
 */

interface QuoteLineItem {
    description: string;
    total: number;
}

interface QuotePDFData {
    guests: number;
    items: QuoteLineItem[];
    subtotal: number;
    serviceFee: number;
    grandTotal: number;
    date: string;
}

// Dalausi brand colors
const PLUM = [62, 28, 51] as const;       // #3E1C33
const ORANGE = [252, 92, 6] as const;    // #fc5c06
const WHITE = [255, 255, 255] as const;
const DARK = [30, 41, 59] as const;       // #1e293b
const GRAY = [100, 116, 139] as const;    // #64748b
const LIGHT_GRAY = [226, 232, 240] as const; // #e2e8f0
const TABLE_HOVER = [248, 250, 252] as const; // #f8fafc

function loadLogoAsBase64(): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.9));
            } else {
                resolve("");
            }
        };
        img.onerror = () => resolve("");
        img.src = "/images/dalausi-logo.jpg";
    });
}

export async function generateQuotePDF(data: QuotePDFData) {
    const { guests, items, subtotal, serviceFee, grandTotal, date } = data;

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();   // 210
    const pageH = pdf.internal.pageSize.getHeight();   // 297
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;

    let y = 0;

    // ─── LOAD LOGO ───
    let logoBase64 = "";
    try {
        logoBase64 = await loadLogoAsBase64();
    } catch { /* proceed without logo */ }

    // ─── HEADER BAR ───
    // Plum top line
    pdf.setFillColor(...PLUM);
    pdf.rect(0, 0, pageW, 3, "F");
    y = 3;

    // Header area
    y += 8;

    // Title (left-center)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(...PLUM);
    pdf.text("PROVISIONAL QUOTE", marginL, y + 6);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...GRAY);
    pdf.text("Catering Estimate", marginL, y + 12);

    // Decorative dots/lines (like DocumentTemplate)
    const decoY = y + 16;
    pdf.setDrawColor(...ORANGE);
    pdf.setLineWidth(0.5);
    pdf.line(marginL, decoY, marginL + 12, decoY);
    pdf.line(marginL + 14, decoY, marginL + 26, decoY);
    pdf.setFillColor(...ORANGE);
    pdf.circle(marginL + 30, decoY, 0.8, "F");
    pdf.circle(marginL + 33, decoY, 0.8, "F");
    pdf.circle(marginL + 36, decoY, 0.8, "F");

    // Logo (right side)
    if (logoBase64) {
        try {
            pdf.addImage(logoBase64, "JPEG", pageW - marginR - 25, y - 4, 25, 25);
        } catch { /* skip logo */ }
    }
    // Brand name under logo
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...PLUM);
    pdf.text("Dalausi Juice", pageW - marginR - 25, y + 23);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...ORANGE);
    pdf.text("Natural & Refreshing", pageW - marginR - 25, y + 27);

    // Header bottom border
    y += 30;
    pdf.setDrawColor(...PLUM);
    pdf.setLineWidth(0.6);
    pdf.line(marginL, y, pageW - marginR, y);

    // ─── QUOTE DETAILS BLOCK ───
    y += 8;

    // Left side: Quote type + client info
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.setTextColor(...PLUM);
    pdf.text("PROVISIONAL QUOTE", marginL, y);

    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...GRAY);
    pdf.text("PROPOSED FOR:", marginL, y);

    y += 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...DARK);
    pdf.text(`Event Catering — ${guests} Guests`, marginL, y);

    // Right side: Quote # and Date
    const rightX = pageW - marginR;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY);
    pdf.text("Quote #", rightX - 50, y - 10, { align: "left" });
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...DARK);
    pdf.text(`DQ-${Date.now().toString(36).toUpperCase()}`, rightX, y - 10, { align: "right" });

    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...GRAY);
    pdf.text("Date", rightX - 50, y - 5, { align: "left" });
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...DARK);
    pdf.text(date, rightX, y - 5, { align: "right" });

    // Event details sub-block
    y += 6;
    pdf.setDrawColor(...LIGHT_GRAY);
    pdf.setLineWidth(0.3);
    pdf.line(marginL, y, marginL + 80, y);
    y += 4;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...PLUM);
    pdf.text("EVENT DETAILS", marginL, y);
    y += 4;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...DARK);
    pdf.text(`Guests: ${guests}`, marginL, y);
    y += 4;
    pdf.text(`Serving ratio: 1.6L per guest (recommended)`, marginL, y);

    // ─── TABLE ───
    y += 10;

    // Table header (dark plum bar)
    const tableX = marginL;
    const colDescW = contentW * 0.65;
    const colTotalW = contentW * 0.35;
    const rowH = 8;

    pdf.setFillColor(...PLUM);
    pdf.rect(tableX, y, contentW, rowH, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...WHITE);
    pdf.text("NO.", tableX + 2, y + 5.5);
    pdf.text("SERVICE / ITEM DESCRIPTION", tableX + 12, y + 5.5);
    pdf.text("TOTAL (UGX)", tableX + colDescW + colTotalW - 2, y + 5.5, { align: "right" });

    y += rowH;

    // Table rows
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    items.forEach((item, i) => {
        // Alternating row background
        if (i % 2 === 1) {
            pdf.setFillColor(...TABLE_HOVER);
            pdf.rect(tableX, y, contentW, rowH, "F");
        }

        // Bottom border
        pdf.setDrawColor(...LIGHT_GRAY);
        pdf.setLineWidth(0.2);
        pdf.line(tableX, y + rowH, tableX + contentW, y + rowH);

        pdf.setTextColor(...DARK);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${i + 1}`, tableX + 4, y + 5.5, { align: "center" });
        pdf.text(item.description, tableX + 12, y + 5.5);
        pdf.setFont("helvetica", "bold");
        pdf.text(`UGX ${item.total.toLocaleString()}`, tableX + colDescW + colTotalW - 2, y + 5.5, { align: "right" });

        y += rowH;
    });

    // ─── SUMMARY ───
    y += 6;

    // Subtotal
    const summaryX = tableX + contentW * 0.5;
    const summaryW = contentW * 0.5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...GRAY);
    pdf.text("Subtotal", summaryX, y);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.text(`UGX ${subtotal.toLocaleString()}`, summaryX + summaryW, y, { align: "right" });

    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...GRAY);
    pdf.text("Service, Logistics & Setup (10%)", summaryX, y);
    pdf.setTextColor(...DARK);
    pdf.setFont("helvetica", "bold");
    pdf.text(`UGX ${serviceFee.toLocaleString()}`, summaryX + summaryW, y, { align: "right" });

    // Grand Total bar (plum background)
    y += 8;
    pdf.setFillColor(...PLUM);
    pdf.roundedRect(summaryX - 4, y - 4, summaryW + 8, 10, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...WHITE);
    pdf.text("GRAND TOTAL", summaryX, y + 2);
    pdf.text(`UGX ${grandTotal.toLocaleString()}`, summaryX + summaryW, y + 2, { align: "right" });

    // ─── DISCLAIMER ───
    y += 16;
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(7);
    pdf.setTextColor(148, 163, 184); // #94a3b8
    const disclaimerLines = pdf.splitTextToSize(
        "*This is a provisional quote based on standard event logistics. Final pricing may vary based on location, specific requirements, and seasonal availability. Contact us to confirm your booking.",
        contentW
    );
    pdf.text(disclaimerLines, marginL, y);

    // ─── FOOTER: Terms, Contact, Payment ───
    y += 14;
    pdf.setDrawColor(...LIGHT_GRAY);
    pdf.setLineWidth(0.3);
    pdf.line(marginL, y, pageW - marginR, y);
    y += 6;

    const footerLeftX = marginL;
    const footerRightX = pageW / 2 + 10;

    // Terms
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(...PLUM);
    pdf.text("TERMS & CONDITIONS", footerLeftX, y);
    y += 3.5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(...GRAY);
    pdf.text("50% deposit required to confirm booking.", footerLeftX, y);
    y += 3;
    pdf.text("Balance due 3 days before event date.", footerLeftX, y);
    y += 3;
    pdf.text("Please quote reference number on payment.", footerLeftX, y);

    // Questions
    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...PLUM);
    pdf.text("QUESTIONS", footerLeftX, y);
    y += 3.5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...GRAY);
    pdf.text("Email: info@dalausijuice.com", footerLeftX, y);
    y += 3;
    pdf.text("Call / WhatsApp: +256 702 071 497", footerLeftX, y);

    // Payment info
    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...PLUM);
    pdf.text("PAYMENT INFO", footerLeftX, y);
    y += 3.5;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...GRAY);
    pdf.text("MTN Mobile Money: +256 702 071 497 (Dalausi Juice)", footerLeftX, y);
    y += 3;
    pdf.text("Airtel Money: +256 750 000 000", footerLeftX, y);

    // Right side: Thank you + Signature
    const sigY = y - 20;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...PLUM);
    pdf.text("Thank you for choosing Dalausi Juice!", footerRightX, sigY, { align: "left" });

    // Signature line
    const sigLineY = sigY + 14;
    pdf.setDrawColor(148, 163, 184);
    pdf.setLineWidth(0.3);
    pdf.line(footerRightX + 20, sigLineY, footerRightX + 70, sigLineY);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...GRAY);
    pdf.text("Authorised sign", footerRightX + 35, sigLineY + 3);

    // ─── BOTTOM BRANDED BAR ───
    const barH = 8;
    const barY = pageH - barH;
    pdf.setFillColor(...PLUM);
    pdf.rect(0, barY, pageW, barH, "F");

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    const footerText = "Dalausi Juice  |  info@dalausijuice.com  |  +256 702 071 497  |  Wandegeya, Bombo Rd, Kampala";
    pdf.text(footerText, pageW / 2, barY + 5, { align: "center" });

    // ─── ORANGE ACCENT LINE (top of footer bar) ───
    pdf.setFillColor(...ORANGE);
    pdf.rect(0, barY - 1, pageW, 1, "F");

    // Save
    pdf.save(`Dalausi_Quote_${new Date().toISOString().split("T")[0]}.pdf`);
}
