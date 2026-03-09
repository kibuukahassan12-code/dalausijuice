"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "@/app/page.module.css";

interface GalleryImageProps {
    src: string;
    alt: string;
}

export default function GalleryImage({ src, alt }: GalleryImageProps) {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
        return (
            <div style={{
                width: "100%",
                height: "100%",
                background: "var(--color-gray-200)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-gray-400)",
                fontSize: "2rem"
            }}>
                📷
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            className={styles.galleryImg}
            onError={() => setImageError(true)}
        />
    );
}
