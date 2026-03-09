"use client";

import { exportToPDF } from "@/lib/pdf-utils";
import { useState } from "react";

interface ExportButtonProps {
    elementId: string;
    filename: string;
    label?: string;
}

export default function ExportButton({ elementId, filename, label = "Download PDF Report" }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        await exportToPDF(elementId, filename);
        setLoading(false);
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            style={{
                background: "var(--color-plum)",
                color: "white",
                padding: "0.6rem 1.2rem",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                border: "none",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.2s"
            }}
        >
            {loading ? "⌛ Generating..." : `📄 ${label}`}
        </button>
    );
}
