import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    <div className={`${styles.column} ${styles.aboutColumn}`}>
                        <h3>Dalausi Juice</h3>
                        <p className={styles.contactInfo}>
                            Uganda's leading fresh juice company. Straight from the fruit to your bottle.
                        </p>
                    </div>

                    <div className={styles.column}>
                        <h3>Quick Links</h3>
                        <nav className={styles.links}>
                            <Link href="/" className={styles.link}>Home</Link>
                            <Link href="/daily-menu" className={styles.link}>Daily Menu</Link>
                            <Link href="/events-packages" className={styles.link}>Events Packages</Link>
                            <Link href="/gallery" className={styles.link}>Gallery</Link>
                            <Link href="/contact" className={styles.link}>Contact</Link>
                        </nav>
                    </div>

                    <div className={styles.column}>
                        <h3>Contact Us</h3>
                        <div className={styles.contactInfo}>
                            <p>Wandegeya Bombo Rd,<br />Aisha Kasule building,<br />opp Eco Bank</p>
                            <p>+256 702 071 497</p>
                            <p>+256 776 071 497</p>
                            <p>info@dalausijuice.com</p>
                        </div>
                        <div className={styles.socialLinks}>
                            <a href="https://facebook.com/dalausijuice" target="_blank" rel="noopener noreferrer">FB</a>
                            <a href="https://instagram.com/dalausijuice" target="_blank" rel="noopener noreferrer">IG</a>
                            <a href="https://tiktok.com/@dalausijuice" target="_blank" rel="noopener noreferrer">TT</a>
                            <a href="https://youtube.com/@dalausijuice" target="_blank" rel="noopener noreferrer">YT</a>
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
