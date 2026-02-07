import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    Dalausi <span>Juice</span>
                </Link>

                <nav className={styles.nav}>
                    <Link href="/" className={styles.link}>Home</Link>
                    <Link href="/menu" className={styles.link}>Menu</Link>
                    <Link href="#contact" className={styles.link}>Contact</Link>
                    <Link href="/menu" className={styles.cta}>
                        Order Now
                    </Link>
                </nav>
            </div>
        </header>
    );
}
