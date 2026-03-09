import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Image from "next/image";
import Link from "next/link";
import styles from "./events-packages.module.css";
import QuoteEngine from "@/components/QuoteEngine/QuoteEngine";

export const metadata = {
    title: "Events Packages | Dalausi Juice",
    description: "Premium juice catering for weddings, corporate events, and parties in Uganda.",
};

const packages = [
    {
        name: "Basic Table Package",
        description: "Essential Juice Service for Events",
        price: "UGX 200,000 per 20-litre jerrycan",
        features: [
            "Fresh juice served in 20-litre jerrycans",
            "Service fee applies (contact for details)",
            "Client provides tables (non-plastic) and suitable power source",
            "Recommended: 8 jerrycans (160 litres) for 100 guests (assuming water and soda are also available)",
            "Professional setup and service staff included",
            "Perfect for weddings, corporate events, and gatherings"
        ],
        image: "/images/ffd.jpg"
    },
    {
        name: "Signature Welcome",
        description: "VIP Bride & Groom Experience",
        price: "UGX 500,000",
        features: [
            "Exclusively VIP service for the special couple",
            "2 Premium signature juice glasses for Bride & Groom",
            "Cinematic dry ice presentation creating a magical moment",
            "Customized flavor selection to match your wedding theme",
            "Professional service staff for personalized attention",
            "Perfect photo opportunity for your wedding album"
        ],
        image: "/images/signature_welcome_photo.jpg"
    },
    {
        name: "Assorted Fresh Fruits",
        description: "Elegant Fruit Displays",
        price: "UGX 1,000,000 per 100 guests",
        features: [
            "Seasonally selected premium fruits from local farms",
            "Stunning artistic fruit carvings and elegant displays",
            "100% fresh, natural, and preservative-free",
            "Nutritious and refreshing addition to your event",
            "Professional fruit arrangement and presentation",
            "Perfect for health-conscious guests and dietary preferences"
        ],
        image: "/images/fruits.jpeg"
    },
    {
        name: "Mocktails",
        description: "Non-alcoholic Refreshments",
        price: "UGX 15,000 per glass",
        features: ["20 glasses minimum order", "Vibrant & colorful selection", "Freshly prepared on-site"],
        image: "/images/mocks.jpeg"
    },
    {
        name: "Tea Service",
        description: "Varied Hot Beverages",
        price: "UGX 700,000 per 100 guests",
        features: ["African, Spiced, Lemon & Black Tea", "Fresh Black Coffee included", "Service fee inclusive"],
        image: "/images/tea1.JPG"
    },
    {
        name: "Exclusive VIP Setups",
        description: "Lavish Event Decor",
        price: "Starting from UGX 10M",
        features: ["Premium floral & lighting design", "Custom juice bar stations", "Price is for setup only"],
        image: "/images/diana.jpg"
    }
];

export default function EventsPackagesPage() {
    return (
        <div className={styles.wrapper}>
            <Header ctaOrange={true} />

            <main className={styles.main}>
                {/* Hero */}
                <section className={styles.hero}>
                    <div className={styles.heroOverlay}>
                        <div className="container">
                            <div className={styles.heroContent}>
                                <h1>Make Your Event <span className={styles.highlight}>Refreshing</span></h1>
                                <p>Premium juice catering services for weddings, corporate events, and special celebrations across Uganda.</p>
                                <a href="https://wa.me/256702071497?text=hello%20dalausi%20i%20need%20to%20ask%20something" className="btn btn-primary">Book Now</a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Service Types */}
                <section className={styles.services}>
                    <div className="container">
                        <div className={styles.sectionHeader}>
                            <h2>Our Event <span>Services</span></h2>
                            <p>We provide more than just juice; we provide an experience.</p>
                        </div>

                        <div className={styles.serviceGrid}>
                            <div className={styles.serviceCard}>
                                <div className={styles.serviceIcon}>💍</div>
                                <h3>Weddings & Introductions</h3>
                                <p>Exquisite juice bars tailored to your theme and guest list.</p>
                            </div>
                            <div className={styles.serviceCard}>
                                <div className={styles.serviceIcon}>🏢</div>
                                <h3>Corporate Events</h3>
                                <p>Healthy refreshments for meetings, launches, and office parties.</p>
                            </div>
                            <div className={styles.serviceCard}>
                                <div className={styles.serviceIcon}>🎉</div>
                                <h3>Parties & Gatherings</h3>
                                <p>Fresh juice dispensers to keep the celebration vibrant.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Packages */}
                <section className={styles.packages}>
                    <div className="container">
                        <div className={styles.sectionHeader}>
                            <h2>Our <span>Packages</span></h2>
                            <p>Flexible options to fit your group size and pocket.</p>
                        </div>

                        <div className={styles.packageGridFirst}>
                            {packages.slice(0, 3).map((pkg, index) => (
                                <div key={index} className={styles.packageCard}>
                                    <div className={styles.packageImage}>
                                        <Image
                                            src={pkg.image}
                                            alt={pkg.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                            priority={pkg.name === 'Signature Welcome'}
                                        />
                                    </div>
                                    <div className={styles.packageBody}>
                                        <h3>{pkg.name}</h3>
                                        <p className={styles.description}>{pkg.description}</p>
                                        <p className={styles.price}>{pkg.price}</p>
                                        <ul className={styles.features}>
                                            {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                        <a href="https://wa.me/256702071497?text=hello%20dalausi%20i%20need%20to%20ask%20something" className={styles.packageBtn}>Inquire Now</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.packageGrid}>
                            {packages.slice(3).map((pkg, index) => (
                                <div key={index + 3} className={styles.packageCard}>
                                    <div className={styles.packageImage}>
                                        <Image
                                            src={pkg.image}
                                            alt={pkg.name}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div className={styles.packageBody}>
                                        <h3>{pkg.name}</h3>
                                        <p className={styles.description}>{pkg.description}</p>
                                        <p className={styles.price}>{pkg.price}</p>
                                        <ul className={styles.features}>
                                            {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                        <a href="https://wa.me/256702071497?text=hello%20dalausi%20i%20need%20to%20ask%20something" className={styles.packageBtn}>Inquire Now</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Custom Quote Engine */}
                <QuoteEngine />
            </main>

            <Footer />
        </div>
    );
}
