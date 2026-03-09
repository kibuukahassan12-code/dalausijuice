'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import styles from './Header.module.css';

export default function Header({ ctaOrange = false }: { ctaOrange?: boolean }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <Image
                        src="/images/dalausi-logo2.png"
                        alt="Dalausi Juice"
                        width={315}
                        height={105}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </Link>

                <nav className={styles.nav}>
                    <Link href="/" className={styles.link}>Home</Link>
                    <Link href="/daily-menu" className={styles.link}>Daily Menu</Link>
                    <Link href="/events-packages" className={styles.link}>Events & Packages</Link>
                    <Link href="/gallery" className={styles.link}>Gallery</Link>
                    <Link href="/contact" className={styles.link}>Contact</Link>
                    <Link href="/admin" className={`${styles.cta} ${ctaOrange ? styles.ctaOrange : ''}`}>
                        Admin
                    </Link>
                </nav>

                <button 
                    className={styles.mobileMenuBtn}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={mobileMenuOpen}
                >
                    <span className={`${styles.hamburger} ${mobileMenuOpen ? styles.open : ''}`}></span>
                </button>

                {mobileMenuOpen && (
                    <div className={styles.mobileMenu}>
                        <Link href="/" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Home</Link>
                        <Link href="/daily-menu" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Daily Menu</Link>
                        <Link href="/events-packages" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Events & Packages</Link>
                        <Link href="/gallery" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Gallery</Link>
                        <Link href="/contact" className={styles.mobileLink} onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                        <Link href="/admin" className={`${styles.mobileLink} ${styles.mobileCta}`} onClick={() => setMobileMenuOpen(false)}>
                            Admin
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
