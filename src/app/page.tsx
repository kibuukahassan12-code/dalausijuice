"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header/Header";
import Carousel from "@/components/Carousel/Carousel";
import ProductCard from "@/components/ProductCard/ProductCard";
import ClientLogosCarousel from "@/components/ClientLogosCarousel/ClientLogosCarousel";
import Footer from "@/components/Footer/Footer";
import styles from "./page.module.css";

const featuredProducts = [
  {
    id: "passion-fruit",
    name: "Passion Fruit Juice",
    description: "Pure passion fruit goodness, freshly squeezed",
    price: "UGX 10,000",
    image: "/images/passion_juice.png",
    unitPrice: 10000,
  },
  {
    id: "mango",
    name: "Mango Juice",
    description: "Sweet and refreshing tropical mango blend",
    price: "UGX 10,000",
    image: "/images/mango_bottle.png",
    unitPrice: 10000,
  },
  {
    id: "pineapple",
    name: "Pineapple Mint Juice",
    description: "Tangy pineapple with refreshing mint",
    price: "UGX 10,000",
    image: "/images/pineapple_mint.png",
    unitPrice: 10000,
  },
  {
    id: "milk-meld",
    name: "Milk Meld",
    description: "Creamy milk blend with natural fruit flavors",
    price: "UGX 10,000",
    image: "/images/milk_meld.png",
    unitPrice: 10000,
  },
  {
    id: "watermelon",
    name: "Watermelon Juice",
    description: "Refreshing watermelon with a hint of lime",
    price: "UGX 10,000",
    image: "/images/watermelon_juice.png",
    unitPrice: 10000,
  },
  {
    id: "mixed-berry",
    name: "Mixed Berry Blast",
    description: "Antioxidant-rich blend of strawberries and blueberries",
    price: "UGX 10,000",
    image: "/images/soursop_juice.png",
    unitPrice: 10000,
  },
];

const galleryImages = [
  { src: "/images/car1.jpg", alt: "Dalausi Juice Bar Display" },
  { src: "/images/car3.jpg", alt: "Juice Bar with Fresh Fruits" },
  { src: "/images/car5.jpg", alt: "Dalausi Display Station" },
  { src: "/images/car7.jpg", alt: "Wedding Juice Catering" },
  { src: "/images/car2.png", alt: "Fresh Juice Setup" },
  { src: "/images/car4.jpg", alt: "Event Juice Service" },
];

export default function Home() {
  return (
    <main className={styles.main}>
      <Header />
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <Carousel />
        </div>
        
        <div className={styles.heroContainer}>
          <div className={styles.heroTopBadge}>
            100% Natural Fresh Juice
          </div>
          
          <div className={styles.heroContent}>
            <div className={styles.heroLeft}>
              <h1 className={styles.heroHeadline}>
                Straight from the <span>Fruit</span>
              </h1>
              
              <p className={styles.heroSubtitle}>
                Uganda&apos;s leading fresh juice company. Premium quality, natural, refreshing, and always delicious. 
                Delivered fresh to your doorstep across Kampala and beyond.
              </p>
              
              <div className={styles.heroCTAGroup}>
                <Link href="/daily-menu" className={styles.btnPrimary}>
                  <span>Order Now</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link href="/events-packages" className={styles.btnSecondary}>
                  Event Packages
                </Link>
              </div>
              
              <div className={styles.heroStatsRow}>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatNumber}>10K+</div>
                  <div className={styles.heroStatLabel}>Happy Customers</div>
                </div>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatNumber}>50+</div>
                  <div className={styles.heroStatLabel}>Juice Varieties</div>
                </div>
                <div className={styles.heroStat}>
                  <div className={styles.heroStatNumber}>24hr</div>
                  <div className={styles.heroStatLabel}>Fresh Delivery</div>
                </div>
              </div>
            </div>
            
            <div className={styles.heroRight}>
              <div className={styles.heroVisual}>
                <div className={styles.heroVisualBg} />
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.heroTrustBar}>
          <div className={styles.heroTrustContainer}>
            <div className={styles.heroTrustItem}>
              <span className={styles.heroTrustIcon}>✓</span>
              <span>100% Natural</span>
            </div>
            <div className={styles.heroTrustItem}>
              <span className={styles.heroTrustIcon}>✓</span>
              <span>No Preservatives</span>
            </div>
            <div className={styles.heroTrustItem}>
              <span className={styles.heroTrustIcon}>✓</span>
              <span>Fresh Daily</span>
            </div>
            <div className={styles.heroTrustItem}>
              <span className={styles.heroTrustIcon}>✓</span>
              <span>Uganda Made</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.productsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            Featured <span className={styles.highlight}>Products</span>
          </h2>
          <div className={styles.productsGrid}>
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                image={product.image}
                unitPrice={product.unitPrice}
              />
            ))}
          </div>
          <div className={styles.viewAllWrapper}>
            <Link href="/daily-menu" className={styles.viewAllButton}>
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className={styles.trustBar}>
        <div className="container">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>✓</span>
              <span>100% Natural</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>✓</span>
              <span>No Preservatives</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>✓</span>
              <span>Fresh Daily</span>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>✓</span>
              <span>Uganda Made</span>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className={styles.visionMissionSection}>
        <div className="container">
          <div className={styles.visionMissionGrid}>
            <div className={styles.visionCard}>
              <h3>Our Vision</h3>
              <p>To be Uganda&apos;s most trusted fresh juice company, bringing natural health and wellness to every home and event across the nation.</p>
            </div>
            <div className={styles.missionCard}>
              <h3>Our Mission</h3>
              <p>To produce and deliver the freshest, highest quality natural juices with exceptional service, while supporting local farmers and promoting healthy living.</p>
            </div>
          </div>

          <div className={styles.ceoBlock}>
            <div className={styles.ceoImage}>
              <Image
                src="/images/ceo-dalausi-lutale.png"
                alt="CEO Dalausi Lutale"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div className={styles.ceoContent}>
              <h3>A Message from Our CEO</h3>
              <p className={styles.ceoMessage}>
                &ldquo;At Dalausi Juice, we believe that everyone deserves access to fresh, natural, and healthy beverages. Our journey began with a simple mission - to bring the purest fruit juices straight from the farm to your glass.&rdquo;
              </p>
              <p className={styles.ceoName}>Dalausi Lutale</p>
              <p className={styles.ceoTitle}>Founder & CEO</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Dalausi */}
      <section className={styles.whySection}>
        <div className="container">
          <h2 className={styles.sectionTitle} style={{ color: 'white' }}>
            Why Choose <span style={{ color: '#f9e284' }}>Dalausi?</span>
          </h2>
          <div className={styles.whyGrid}>
            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🍊</div>
              <h3>Fresh & Natural</h3>
              <p>100% pure fruit with no added preservatives, chemicals, or artificial flavors.</p>
            </div>
            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🇺🇬</div>
              <h3>Locally Sourced</h3>
              <p>We partner with Ugandan farmers to source the freshest fruits.</p>
            </div>
            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🚚</div>
              <h3>Fast Delivery</h3>
              <p>Same-day delivery across Kampala, Entebbe, and Wakiso.</p>
            </div>
            <div className={styles.whyCard}>
              <div className={styles.whyIcon}>🎉</div>
              <h3>Event Experts</h3>
              <p>Premium juice catering for weddings and corporate events.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className={styles.processSection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Our <span className={styles.highlight}>Process</span>
          </h2>
          <div className={styles.processGrid}>
            <div className={styles.processStep}>
              <div className={styles.processNumber}>1</div>
              <h3>Select</h3>
              <p>We handpick the freshest, ripest fruits from local farms.</p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.processNumber}>2</div>
              <h3>Squeeze</h3>
              <p>Cold-press extraction preserves nutrients and natural flavors.</p>
            </div>
            <div className={styles.processStep}>
              <div className={styles.processNumber}>3</div>
              <h3>Deliver</h3>
              <p>Bottled fresh and delivered quickly to maintain peak freshness.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle Section */}
      <section className={styles.lifestyle}>
        <div className={styles.lifestyleOverlay}>
          <div className={styles.lifestyleContent}>
            <h2>More Than Just Juice</h2>
            <p>Experience the Dalausi lifestyle - vibrant, healthy, and refreshingly natural.</p>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className={styles.gallery}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            Dalausi in <span className={styles.highlight}>Action</span>
          </h2>
          <div className={styles.galleryGrid}>
            {galleryImages.map((img, index) => (
              <div key={index} className={styles.galleryItem}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className={styles.galleryImg}
                  sizes="(max-width: 768px) 100vw, 25vw"
                />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/gallery" className={styles.gallerySplashBtn}>
              View Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.socialProof}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            What Our <span className={styles.highlight}>Customers</span> Say
          </h2>
          <div className={styles.testimonialGrid}>
            <div className={styles.testimonial}>
              <p className={styles.quote}>&ldquo;The freshest juice I&apos;ve ever tasted! Dalausi made our wedding reception absolutely perfect.&rdquo;</p>
              <p className={styles.author}>— Sarah & Michael, Kampala</p>
            </div>
            <div className={styles.testimonial}>
              <p className={styles.quote}>&ldquo;We order Dalausi juice for all our office meetings. The team loves it!&rdquo;</p>
              <p className={styles.author}>— James M., Corporate Client</p>
            </div>
            <div className={styles.testimonial}>
              <p className={styles.quote}>&ldquo;Finally, a juice company that delivers on its promises. My family&apos;s favorite!&rdquo;</p>
              <p className={styles.author}>— Maria N., Entebbe</p>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Options */}
      <section className={styles.deliverySection}>
        <div className="container">
          <h2 className={styles.sectionTitle}>
            How to Get Your <span className={styles.highlight}>Juice</span>
          </h2>
          <div className={styles.deliveryGrid}>
            <div className={styles.deliveryCard}>
              <h3>🚚 Home Delivery</h3>
              <p>Same-day delivery across Kampala, Entebbe, and Wakiso.</p>
              <div className={styles.deliveryImagePlaceholder}>
                <Image src="/images/placeholder-delivery-zones.jpg" alt="Delivery zones" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <div className={styles.deliveryCard}>
              <h3>🏪 Store Pickup</h3>
              <p>Visit us at Wandegeya Bombo Rd. Order ahead and pick up.</p>
              <div className={styles.deliveryImagePlaceholder}>
                <Image src="/images/placeholder-store-pickup.jpg" alt="Store pickup" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
            <div className={styles.deliveryCard}>
              <h3>⚡ Express</h3>
              <p>Need it urgently? Express delivery within 2 hours.</p>
              <div className={styles.deliveryImagePlaceholder}>
                <Image src="/images/placeholder-same-day.jpg" alt="Express delivery" fill style={{ objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClientLogosCarousel />

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>Ready to Taste the Difference?</h2>
            <p>Experience Uganda&apos;s freshest, most natural juices. Order now and discover why thousands choose Dalausi every day.</p>
            <div className={styles.ctaButtons}>
              <Link href="/daily-menu" className="btn btn-primary">Order Now</Link>
              <Link href="/contact" className="btn btn-outline" style={{ color: 'white', borderColor: 'white' }}>Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}