import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={styles.column}>
                        <h3>Dalausi Juice</h3>
                        <p className={styles.contactInfo}>
                            Uganda's leading fresh juice company. Straight from the fruit to your bottle.
                        </p>
                    </div>

                    <div className={styles.column}>
                        <h3>Quick Links</h3>
                        <nav className={styles.links}>
                            <Link href="/" className={styles.link}>Home</Link>
                            <Link href="/menu" className={styles.link}>Menu</Link>
                            <Link href="#about" className={styles.link}>About Us</Link>
                        </nav>
                    </div>

                    <div className={styles.column}>
                        <h3>Contact Us</h3>
                        <div className={styles.contactInfo}>
                            <p>Kampala, Uganda</p>
                            <p>+256 702 071 497</p>
                            <p>info@dalausijuice.com</p>
                        </div>
                    </div>
                </div>

                <div className={styles.copyright}>
                    &copy; {new Date().getFullYear()} Dalausi Juice. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
