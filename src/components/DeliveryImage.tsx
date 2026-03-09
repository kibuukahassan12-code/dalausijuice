"use client";

import Image from "next/image";
import { useState } from "react";

interface DeliveryImageProps {
    src: string;
    alt: string;
}

export default function DeliveryImage({ src, alt }: DeliveryImageProps) {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
        return (
            <div style={{
                width: "100%",
                height: "200px",
                background: "var(--color-gray-200)",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-gray-400)",
                fontSize: "3rem"
            }}>
                📷
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={300}
            height={200}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
            onError={() => setImageError(true)}
        />
    );
}
