import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ContactForm from "./ContactForm";
import styles from "./contact.module.css";

export const metadata = {
    title: "Contact Us | Dalausi Juice",
    description: "Get in touch with Dalausi Juice. Visit our shop, call, WhatsApp, or send us a message.",
};

export default function ContactPage() {
    return (
        <div className={styles.wrapper}>
            <Header ctaOrange={true} />

            <main className={styles.main}>
                {/* Hero */}
                <section className={styles.hero}>
                    <div className={styles.heroOverlay}>
                        <div className="container">
                            <div className={styles.heroContent}>
                                <h1>Get in <span className={styles.highlight}>Touch</span></h1>
                                <p>Have questions about our juices, delivery, or event catering? We&apos;d love to hear from you.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Info Cards */}
                <section className={styles.infoSection}>
                    <div className="container">
                        <div className={styles.infoGrid}>
                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>📍</div>
                                <h3>Visit Us</h3>
                                <p>Wandegeya Bombo Rd,<br />Aisha Kasule building,<br />opp Eco Bank<br />Kampala, Uganda</p>
                            </div>
                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>📞</div>
                                <h3>Call Us</h3>
                                <p>
                                    <a href="tel:+256702071497">+256 702 071 497</a><br />
                                    <a href="tel:+256776071497">+256 776 071 497</a>
                                </p>
                            </div>
                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>✉️</div>
                                <h3>Email Us</h3>
                                <p><a href="mailto:info@dalausijuice.com">info@dalausijuice.com</a></p>
                            </div>
                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>💬</div>
                                <h3>WhatsApp</h3>
                                <p><a href="https://wa.me/256702071497" target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a></p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Business Hours */}
                <section className={styles.hoursSection}>
                    <div className="container">
                        <h2 className={styles.sectionTitle}>Business <span>Hours</span></h2>
                        <div className={styles.hoursCard}>
                            <div className={styles.hoursRow}>
                                <span>Monday – Friday</span>
                                <span>8:00 AM – 6:00 PM</span>
                            </div>
                            <div className={styles.hoursRow}>
                                <span>Saturday</span>
                                <span>9:00 AM – 4:00 PM</span>
                            </div>
                            <div className={styles.hoursRow}>
                                <span>Sunday</span>
                                <span>Closed</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact Form & Map */}
                <section className={styles.formMapSection}>
                    <div className="container">
                        <div className={styles.formMapGrid}>
                            <div className={styles.formColumn}>
                                <h2 className={styles.sectionTitle}>Send Us a <span>Message</span></h2>
                                <ContactForm />
                            </div>
                            <div className={styles.mapColumn}>
                                <h2 className={styles.sectionTitle}>Find Us on <span>Map</span></h2>
                                <div className={styles.mapWrapper}>
                                    <iframe
                                        src="https://maps.google.com/maps?q=Wandegeya+Bombo+Road+Opp+Eco+Bank+Kampala+Uganda&t=&z=16&ie=UTF8&iwloc=&output=embed"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Dalausi Juice Location - Wandegeya, Kampala"
                                    />
                                </div>
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=Wandegeya+Bombo+Road,+Aisha+Kasule+building,+Opp+Eco+Bank,+Kampala,+Uganda"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.mapLink}
                                >
                                    Open in Google Maps · Get Directions
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className={styles.faqSection}>
                    <div className="container">
                        <h2 className={styles.sectionTitle}>Frequently Asked <span>Questions</span></h2>
                        <div className={styles.faqList}>
                            <div className={styles.faqItem}>
                                <h4>What areas do you deliver to?</h4>
                                <p>We deliver to Kampala, Entebbe, and Wakiso. Order before 2 PM for same-day delivery.</p>
                            </div>
                            <div className={styles.faqItem}>
                                <h4>Can I pick up my order?</h4>
                                <p>Yes! Visit us at Wandegeya Bombo Rd, Aisha Kasule building, opp Eco Bank for store pickup.</p>
                            </div>
                            <div className={styles.faqItem}>
                                <h4>Do you cater for events?</h4>
                                <p>Absolutely. We offer juice bars, mocktails, tea service, and custom setups for weddings and corporate events. Chat us on WhatsApp for a quote.</p>
                            </div>
                            <div className={styles.faqItem}>
                                <h4>Are your juices preservative-free?</h4>
                                <p>Yes. Our juices are 100% natural with no added sugar, no preservatives—straight from the fruit.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className={styles.ctaSection}>
                    <div className="container">
                        <div className={styles.ctaBox}>
                            <h2>Ready to Order?</h2>
                            <p>Browse our daily menu or chat with us on WhatsApp for quick orders.</p>
                            <div className={styles.ctaButtons}>
                                <a href="https://wa.me/256702071497" className="btn btn-primary">Chat on WhatsApp</a>
                                <a href="/daily-menu" className="btn btn-outline" style={{ color: "white", borderColor: "white" }}>View Menu</a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
