"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import styles from "./gallery.module.css";

interface GalleryImage {
    src: string;
    alt: string;
}

interface GalleryGridProps {
    images: GalleryImage[];
}

export default function GalleryGrid({ images }: GalleryGridProps) {
    const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

    const openLightbox = useCallback((img: GalleryImage) => {
        setSelectedImage(img);
    }, []);

    const closeLightbox = useCallback(() => {
        setSelectedImage(null);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeLightbox();
        };
        if (selectedImage) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleEscape);
        }
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [selectedImage, closeLightbox]);

    return (
        <>
            <div className={styles.galleryGrid}>
                {images.map((img, index) => (
                    <div
                        key={index}
                        className={styles.galleryItem}
                        onClick={() => openLightbox(img)}
                        title="Click to view full size"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openLightbox(img);
                            }
                        }}
                    >
                        <Image
                            src={img.src}
                            alt={img.alt}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            style={{ objectFit: "cover" }}
                        />
                    </div>
                ))}
            </div>

            {selectedImage && (
                <div
                    className={styles.lightboxOverlay}
                    onClick={closeLightbox}
                    onKeyDown={(e) => e.key === "Escape" && closeLightbox()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="View image full size"
                >
                    <button
                        type="button"
                        className={styles.lightboxClose}
                        onClick={closeLightbox}
                        aria-label="Close"
                    >
                        ×
                    </button>
                    <div
                        className={styles.lightboxContent}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.lightboxImageWrapper}>
                            <Image
                                src={selectedImage.src}
                                alt={selectedImage.alt}
                                fill
                                sizes="100vw"
                                style={{ objectFit: "contain" }}
                                priority
                            />
                        </div>
                        <p className={styles.lightboxCaption}>{selectedImage.alt}</p>
                    </div>
                </div>
            )}
        </>
    );
}
