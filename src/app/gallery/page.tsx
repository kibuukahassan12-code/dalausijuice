import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import Link from "next/link";
import GalleryGrid from "./GalleryGrid";
import styles from "./gallery.module.css";

export const metadata = {
    title: "Gallery | Dalausi Juice",
    description: "Explore our juice bar setups, event displays, and fresh juice moments.",
};

const galleryImages = [
    { src: "/images/car1.jpg", alt: "Dalausi Juice Bar Display" },
    { src: "/images/car2.png", alt: "Fresh Juice Event Setup" },
    { src: "/images/car3.jpg", alt: "Juice Bar with Fresh Fruits" },
    { src: "/images/car4.jpg", alt: "Outdoor Event Juice Station" },
    { src: "/images/car5.jpg", alt: "Dalausi Display Station" },
    { src: "/images/car6.jpg", alt: "Event Juice Bar" },
    { src: "/images/car7.jpg", alt: "Wedding Juice Catering" },
    { src: "/images/car8.jpg", alt: "Corporate Event Refreshments" },
    { src: "/images/car9.jpg", alt: "Fresh Juice Bar" },
    { src: "/images/car10.jpg", alt: "Dalausi Juice Event" },
    { src: "/images/signature_welcome_photo.jpg", alt: "Signature Welcome Service" },
    { src: "/images/mocks.jpeg", alt: "Mocktails Selection" },
    { src: "/images/fruits.jpeg", alt: "Assorted Fresh Fruits Display" },
    { src: "/images/diana.jpg", alt: "VIP Event Setup" },
    { src: "/images/tea1.JPG", alt: "Tea Service" },
    { src: "/images/ffd.jpg", alt: "Table Package Setup" },
    { src: "/images/gallery-outdoor-juice-bar.png", alt: "Outdoor juice bar with Dalausi dispensers" },
    { src: "/images/gallery-traditional-marriage.png", alt: "Traditional marriage celebration" },
    { src: "/images/gallery-signature-welcome.png", alt: "Signature welcome drink presentation" },
    { src: "/images/gallery-dry-ice-presentation.png", alt: "Dry ice beverage presentation" },
    { src: "/images/gallery-anniversary-tea-service.png", alt: "25th anniversary tea and juice service" },
    { src: "/images/gallery-event-celebration.png", alt: "Festive event celebration" },
    { src: "/images/gallery-couple-signature-drink.png", alt: "Couple with signature drinks" },
    { src: "/images/gallery-elegant-juice-bar.png", alt: "Elegant juice bar with chandeliers" },
    { src: "/images/gallery-catering-table.png", alt: "Dalausi Juice catering display" },
    { src: "/images/gallery-event-setup.png", alt: "Event setup with Dalausi Juice" },
    { src: "/images/gallery-event-fog.png", alt: "Event with Dalausi Juice stand" },
    { src: "/images/gallery-outdoor-beverage-station.png", alt: "Outdoor juice bar with natural backdrop" },
    { src: "/images/gallery-collage.png", alt: "Dalausi Juice promotional collage" },
    { src: "/images/gallery-dry-ice-bowls.png", alt: "Signature drink presentation" },
    { src: "/images/gallery-eamonn-shillah-juice.png", alt: "Eamonn & Shillah juice and dessert station" },
    { src: "/images/gallery-juice-buffet.png", alt: "Lavish juice and fruit buffet" },
    { src: "/images/gallery-eamonn-shillah-display.png", alt: "Eamonn & Shillah event display" },
    { src: "/images/gallery-event-stage.png", alt: "Event stage with juice dispensers" },
    { src: "/images/gallery-fruit-carving-display.png", alt: "Fruit carvings and Dalausi Juice display" },
    { src: "/images/gallery-juice-bar-chandelier.png", alt: "Juice bar with chandeliers and black and white decor" },
    { src: "/images/gallery-tent-beverage-station.png", alt: "Outdoor beverage station under tent" },
    { src: "/images/gallery-fruit-display-branded.png", alt: "Branded fruit carving display" },
    { src: "/images/gallery-dalaus-juice-tent.png", alt: "Dalausi Juice tent event setup" },
    { src: "/images/gallery-juice-dispensers-tent.png", alt: "Juice dispensers under elegant tent" },
    { src: "/images/gallery-elaborate-fruit-carving.png", alt: "Elaborate fruit carving with Dalausi branding" },
    { src: "/images/gallery-juice-station-black-white.png", alt: "Juice station with black and white theme" },
    { src: "/images/gallery-beverage-display.png", alt: "Professional beverage display" },
    { src: "/images/gallery-event-juice-bar.png", alt: "Event juice bar setup" },
    { src: "/images/gallery-fruit-carving-dalausi.png", alt: "Fruit carving with Dalausi Juice branding" },
    { src: "/images/gallery-outdoor-juice-station.png", alt: "Outdoor juice station" },
    { src: "/images/gallery-fruit-arrangement.png", alt: "Artistic fruit arrangement" },
    { src: "/images/gallery-elegant-juice-display.png", alt: "Elegant juice display" },
    { src: "/images/gallery-juice-bar-chandeliers.png", alt: "Juice bar with crystal chandeliers" },
    { src: "/images/gallery-tent-juice-setup.png", alt: "Tent juice setup" },
    { src: "/images/gallery-event-beverage-station.png", alt: "Event beverage station" },
];

export default function GalleryPage() {
    return (
        <div className={styles.wrapper}>
            <Header ctaOrange={true} />

            <main className={styles.main}>
                {/* Hero */}
                <section className={styles.hero}>
                    <div className={styles.heroOverlay}>
                        <div className="container">
                            <div className={styles.heroContent}>
                                <h1>Our <span className={styles.highlight}>Gallery</span></h1>
                                <p>Juice bars, events, and fresh moments—see Dalausi in action.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Gallery Grid */}
                <section className={styles.gallerySection}>
                    <div className="container">
                        <p className={styles.galleryHint}>Click any image to view full size</p>
                        <GalleryGrid images={galleryImages} />
                        <div className={styles.ctaRow}>
                            <Link href="/events-packages" className="btn btn-primary">View Event Packages</Link>
                            <Link href="/contact" className="btn btn-outline">Get in Touch</Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
