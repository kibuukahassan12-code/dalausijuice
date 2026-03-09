import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";
import Carousel from "@/components/Carousel/Carousel";
import DeliveryImage from "@/components/DeliveryImage";
import GalleryImage from "@/components/GalleryImage";
import ClientLogosCarousel from "@/components/ClientLogosCarousel/ClientLogosCarousel";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <Carousel />
          <div className="container">
            <div className={styles.heroContent}>
              <div className={styles.heroText}>
                <h1 className={styles.title}>
                  Uganda&apos;s Standard for{" "}
                  <span className={styles.orangeText}>
                    <span className={styles.waveText}>Fresh Juice</span>
                  </span>
                </h1>
                <p className={styles.description}>
                  Experience the authentic taste of Uganda&apos;s finest fruits.
                  Hand-picked, freshly squeezed, and delivered straight to your door.
                </p>
                <div className={styles.ctaGroup}>
                  <Link href="/daily-menu" className="btn btn-primary">
                    Order Fresh Juice
                  </Link>
                  <a href="tel:+256702071497" className={`btn btn-outline ${styles.talkToUsBtn}`}>
                    <span className={styles.talkToUsText}>TALK TO US</span>
                    <span className={styles.talkToUsPhone}>+256 702 071 497</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals Bar */}
        <section className={styles.trustBar}>
          <div className="container">
            <div className={styles.trustGrid}>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>✓</span>
                <span>100% Natural</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>✓</span>
                <span>No Added Sugar</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>✓</span>
                <span>Straight from the Fruit</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>✓</span>
                <span>Made Fresh Daily</span>
              </div>
            </div>
          </div>
        </section>

        {/* Vision, Mission & CEO Message */}
        <section className={styles.visionMissionSection}>
          <div className="container">
            <h2 className="section-title">
              Our <span>Purpose</span>
            </h2>
            <div className={styles.visionMissionGrid}>
              <div className={styles.visionCard}>
                <h3>Vision</h3>
                <p>To be Uganda&apos;s leading brand for fresh, natural juice—bringing the taste of hand-picked fruits to every home and event.</p>
              </div>
              <div className={styles.missionCard}>
                <h3>Mission</h3>
                <p>To deliver 100% natural, preservative-free juice straight from the fruit—supporting local farmers, nourishing our community, and setting the standard for freshness.</p>
              </div>
            </div>
            <div className={styles.ceoBlock}>
              <div className={styles.ceoImage}>
                <Image
                  src="/images/ceo-dalausi-lutale.png"
                  alt="Mr. Dalausi Lutale, CEO - Dalausi Juice"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  style={{ objectFit: "cover" }}
                  priority={false}
                />
              </div>
              <div className={styles.ceoContent}>
                <h3>A Message from Our CEO</h3>
                <p className={styles.ceoMessage}>
                  At Dalausi Juice, we believe in one simple thing: fresh fruit speaks for itself. Every bottle we make comes straight from the fruit—no additives, no preservatives, just the authentic taste of Uganda&apos;s finest harvests.
                </p>
                <p className={styles.ceoMessage}>
                  Our vision is to bring that freshness to every home, every event, and every moment that matters. Thank you for trusting us with yours.
                </p>
                <p className={styles.ceoName}>— Mr. Dalausi Lutale</p>
                <p className={styles.ceoTitle}>Founder & CEO, Dalausi Juice</p>
              </div>
            </div>
            <div className={styles.ceoBlock} style={{ marginTop: "4rem" }}>
              <div className={styles.ceoImage}>
                <Image
                  src="/images/director-ssentamu-najib.png"
                  alt="Mr. Ssentamu Najib, Director & Co-founder - Dalausi Juice"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  style={{ objectFit: "cover" }}
                  priority={false}
                />
              </div>
              <div className={styles.ceoContent}>
                <h3>A Message from Our Director</h3>
                <p className={styles.ceoMessage}>
                  Quality and innovation drive everything we do at Dalausi Juice. As we continue to grow, our commitment remains unwavering: to deliver excellence in every bottle while supporting our local farming community and creating lasting value for our customers.
                </p>
                <p className={styles.ceoMessage}>
                  Together with our team, we&apos;re building a brand that stands for authenticity, sustainability, and the pure joy that comes from nature&apos;s finest offerings. We&apos;re honored to serve you.
                </p>
                <p className={styles.ceoName}>— Mr. Ssentamu Najib</p>
                <p className={styles.ceoTitle}>Director & Co-founder, Dalausi Juice</p>
              </div>
            </div>
          </div>
        </section>

        {/* Best Sellers */}
        <section className={styles.products}>
          <div className="container">
            <div className={styles.productsIntro}>
              <h2 className="section-title">
                Signature <span>Juices</span>
              </h2>
              <p style={{ color: "var(--color-gray-800)", fontSize: "1.1rem" }}>
                Straight from the fruit. Made daily in Uganda.
              </p>
            </div>

            <div className={styles.productsGrid}>
              <ProductCard
                id="2"
                name="Mango"
                description="1 Litre"
                price="UGX 10,000"
                unitPrice={10000}
                image="/images/mango_signature.png"
              />
              <ProductCard
                id="1"
                name="Mango cocktail"
                description="1 Litre"
                price="UGX 10,000"
                unitPrice={10000}
                image="/images/mango_cocktail.png"
              />
              <ProductCard
                id="5"
                name="Milk meld"
                description="1 Litre"
                price="UGX 10,000"
                unitPrice={10000}
                image="/images/milk_meld.png"
              />
              <ProductCard
                id="13"
                name="Mango passion"
                description="1 Litre"
                price="UGX 10,000"
                unitPrice={10000}
                image="/images/mango_passion.png"
              />
              <ProductCard
                id="14"
                name="Passion cocktail"
                description="1 Litre"
                price="UGX 10,000"
                unitPrice={10000}
                image="/images/passion_cocktail_home.png"
              />
              <ProductCard
                id="10"
                name="Beetroot cocktail"
                description="1 Litre"
                price="UGX 10,000"
                unitPrice={10000}
                image="/images/beetroot_cocktail.png"
              />
            </div>
            <div style={{ textAlign: "center", marginTop: "3rem" }}>
              <Link href="/daily-menu" className="btn btn-outline">
                View All Juices
              </Link>
            </div>
          </div>
        </section>

        {/* NEW: Dalausi Experience Section */}
        <section className={styles.experienceSection}>
          <div className="container">
            <h2 className="section-title">
              Interactive <span>Experiences</span>
            </h2>
            <div className={styles.expGrid}>
              {/* Build Your Box */}
              <div className={styles.expCard}>
                <span className={styles.expTag}>Personalized Retail</span>
                <span className={styles.expIcon}>📦</span>
                <h3>Build-Your-Box</h3>
                <p>Don't settle for one. Curate your own custom 6 or 12-pack box of fresh flavors. We pack it choice by choice, fresh for you.</p>
                <Link href="/daily-menu#build-your-box" className={styles.expLink}>
                  Start Designing →
                </Link>
              </div>

              {/* Instant Quote */}
              <div className={styles.expCard}>
                <span className={styles.expTag}>Event Planning</span>
                <span className={styles.expIcon}>📑</span>
                <h3>Instant Catering Quote</h3>
                <p>Planning a wedding or corporate launch? Get a professional, volume-priced quote for your guests in under 60 seconds.</p>
                <Link href="/events-packages#quote-calculator" className={styles.expLink}>
                  Get Direct Quote →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Why Dalausi */}
        <section className={styles.whySection}>
          <div className="container">
            <h2 className="section-title" style={{ color: "white" }}>
              Why <span>Dalausi?</span>
            </h2>
            <div className={styles.whyGrid}>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon}>🥤</div>
                <h3>Straight from the Fruit</h3>
                <p>We press daily to lock in nutrients and flavor.</p>
              </div>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon}>🌱</div>
                <h3>Locally Sourced Fruits</h3>
                <p>Supporting Ugandan farmers with every bottle.</p>
              </div>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon}>🏆</div>
                <h3>Strict Quality Standards</h3>
                <p>Hygiene and freshness you can trust.</p>
              </div>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon}>💪</div>
                <h3>Nutrition-First Recipes</h3>
                <p>Real fruit. Real health benefits.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Story */}
        <section className={styles.processSection}>
          <div className="container">
            <h2 className="section-title">
              From Farm to <span>Bottle</span>
            </h2>
            <div className={styles.processGrid}>
              <div className={styles.processStep}>
                <div className={styles.processNumber}>1</div>
                <h3>Sourced from Trusted Farmers</h3>
                <p>We partner with local farms for the freshest fruits.</p>
              </div>
              <div className={styles.processStep}>
                <div className={styles.processNumber}>2</div>
                <h3>Pressed Daily</h3>
                <p>Preserving nutrients and natural flavors.</p>
              </div>
              <div className={styles.processStep}>
                <div className={styles.processNumber}>3</div>
                <h3>Delivered Fresh</h3>
                <p>From our kitchen to your door, same day.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Lifestyle Section */}
        <section className={styles.lifestyle}>
          <div className={styles.lifestyleOverlay}>
            <div className="container">
              <div className={styles.lifestyleContent}>
                <h2>Fuel Your Day the Healthy Way</h2>
                <p>Fresh juice for your morning routine, gym session, or office break.</p>
                <Link href="/daily-menu" className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
                  Discover the Dalausi Lifestyle
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className={styles.socialProof}>
          <div className="container">
            <h2 className="section-title">
              Trusted by <span>Thousands</span>
            </h2>
            <div className={styles.testimonialGrid}>
              <div className={styles.testimonial}>
                <p className={styles.quote}>"The freshest juice in Kampala. My family orders weekly!"</p>
                <p className={styles.author}>— Sarah M., Kampala</p>
              </div>
              <div className={styles.testimonial}>
                <p className={styles.quote}>"Perfect for post-workout recovery. Love the mango nectar."</p>
                <p className={styles.author}>— James K., Fitness Enthusiast</p>
              </div>
              <div className={styles.testimonial}>
                <p className={styles.quote}>"Trusted supplier for our hotel breakfast buffet."</p>
                <p className={styles.author}>— Grand Hotel, Entebbe</p>
              </div>
            </div>
          </div>
        </section>

        {/* Clients Portfolio */}
        <ClientLogosCarousel />

        {/* Delivery Info */}
        <section className={styles.deliverySection}>
          <div className="container">
            <h2 className="section-title">
              Fast <span>Delivery</span>
            </h2>
            <div className={styles.deliveryGrid}>
              <div className={styles.deliveryCard}>
                <h3>📍 Delivery Zones</h3>
                <p>Kampala • Entebbe • Wakiso</p>
                <div className={styles.deliveryImagePlaceholder}>
                  <DeliveryImage
                    src="/images/placeholder-delivery-zones.jpg"
                    alt="Dalausi Juice delivery team covering Kampala, Entebbe, and Wakiso"
                  />
                </div>
              </div>
              <div className={styles.deliveryCard}>
                <h3>⚡ Same-Day Delivery</h3>
                <p>Order before 2 PM for same-day delivery</p>
                <div className={styles.deliveryImagePlaceholder}>
                  <DeliveryImage
                    src="/images/placeholder-same-day.jpg"
                    alt="Dalausi Juice delivery team ready for same-day service"
                  />
                </div>
              </div>
              <div className={styles.deliveryCard}>
                <h3>🏪 Store Pickup</h3>
                <p>Collect at Wandegeya Bombo Rd,<br />Aisha Kasule building, Opp Post Bank</p>
                <div className={styles.deliveryImagePlaceholder}>
                  <DeliveryImage
                    src="/images/placeholder-store-pickup.jpg"
                    alt="Dalausi Juice delivery motorcycle for store pickup"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section */}
        <section className={styles.gallery}>
          <div className="container">
            <h2 className="section-title">
              Our <span>Gallery</span>
            </h2>
            <div className={styles.galleryGrid}>
              <div className={styles.galleryItem}>
                <GalleryImage
                  src="/images/gallery-1.png"
                  alt="Dalausi Juice Bar Display"
                />
              </div>
              <div className={styles.galleryItem}>
                <GalleryImage
                  src="/images/gallery-2.png"
                  alt="Dalausi Juice Event Setup"
                />
              </div>
              <div className={styles.galleryItem}>
                <GalleryImage
                  src="/images/gallery-3.png"
                  alt="Dalausi Juice Bar with Fresh Fruits"
                />
              </div>
              <div className={styles.galleryItem}>
                <GalleryImage
                  src="/images/gallery-4.png"
                  alt="Dalausi Juice Outdoor Event"
                />
              </div>
              <div className={styles.galleryItem}>
                <GalleryImage
                  src="/images/gallery-5.png"
                  alt="Dalausi Juice Display Station"
                />
              </div>
              <div className={styles.galleryItem}>
                <GalleryImage
                  src="/images/gallery-6.png"
                  alt="Dalausi Juice Event Display"
                />
              </div>
            </div>
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <Link href="/gallery" className={styles.gallerySplashBtn}>
                View Gallery
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.finalCta}>
          <div className="container">
            <div className={styles.ctaBox}>
              <h2>Fresh Juice, Delivered Daily.</h2>
              <p>Experience the Dalausi difference today.</p>
              <div className={styles.ctaButtons}>
                <Link href="/daily-menu" className="btn btn-primary" style={{ fontSize: "1.2rem", padding: "1rem 3rem" }}>
                  Order Now
                </Link>
                <Link href="/daily-menu" className="btn btn-outline" style={{ fontSize: "1.2rem", padding: "1rem 3rem" }}>
                  View Menu
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
