"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ClientLogosCarousel.module.css";

interface Client {
  name: string;
  logo: string;
}

const clients: Client[] = [
  { name: "NBS Television", logo: "/images/clients/nbs.png" },
  { name: "Mestil Hotel", logo: "/images/clients/mestil.jpg" },
  { name: "KCB Bank", logo: "/images/clients/kcb.png" },
  { name: "Equity Bank", logo: "/images/clients/equity.png" },
  { name: "Riham", logo: "/images/clients/riham.png" },
  { name: "Pearl FM Radio", logo: "/images/clients/pearl_fm.jpg" },
  { name: "Parliament of Uganda", logo: "/images/clients/parliament.jpg" },
];

export default function ClientLogosCarousel() {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (logoPath: string) => {
    setImageErrors((prev) => new Set(prev).add(logoPath));
  };

  return (
    <section className={styles.section}>
      <div className="container" style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h2 className={styles.title}>Our <span>Clients</span></h2>
        <p className={styles.subtitle}>Trusted by leading organizations across Uganda</p>
      </div>
      <div className={styles.marqueeWrapper}>
        <div className={styles.marquee}>
          {[...clients, ...clients].map((client, index) => (
            <div key={`${client.name}-${index}`} className={styles.logoItem}>
              {imageErrors.has(client.logo) ? (
                <div className={styles.placeholderLogo}>
                  {client.name}
                </div>
              ) : (
                <div className={styles.logoImageWrapper}>
                  <Image
                    src={client.logo}
                    alt={client.name}
                    width={120}
                    height={50}
                    style={{ objectFit: "contain" }}
                    className={styles.logoImage}
                    onError={() => handleImageError(client.logo)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
