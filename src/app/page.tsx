import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Hero Section */}
        <section style={{
          padding: "4rem 2rem",
          background: "linear-gradient(135deg, var(--color-off-white) 0%, #fff0e6 100%)",
          overflow: "hidden"
        }}>
          <div style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "4rem",
            alignItems: "center"
          }}>
            <div style={{ paddingBottom: "2rem" }}>
              <span style={{
                color: "var(--color-green)",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "0.5rem",
                display: "block"
              }}>
                100% Natural Goodness
              </span>
              <h1 style={{
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                marginBottom: "1.5rem",
                color: "var(--color-plum)",
                fontFamily: "var(--font-outfit)",
                fontWeight: 900,
                lineHeight: 1.1
              }}>
                Refresh Your Life with <br />
                <span style={{ color: "var(--color-orange)" }}>Real Fruit Juice</span>
              </h1>
              <p style={{
                fontSize: "1.125rem",
                color: "var(--color-gray-800)",
                marginBottom: "2.5rem",
                lineHeight: 1.6,
                maxWidth: "500px"
              }}>
                Experience the authentic taste of Uganda's finest fruits.
                Hand-picked, freshly squeezed, and delivered straight to your door.
              </p>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link href="/menu" style={{
                  display: "inline-block",
                  backgroundColor: "var(--color-orange)",
                  color: "white",
                  padding: "1rem 2.5rem",
                  borderRadius: "9999px",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  transition: "transform 0.2s"
                }}>
                  Order Now
                </Link>
                <Link href="#about" style={{
                  display: "inline-block",
                  backgroundColor: "white",
                  color: "var(--color-plum)",
                  padding: "1rem 2.5rem",
                  borderRadius: "9999px",
                  fontWeight: "bold",
                  fontSize: "1.1rem",
                  border: "2px solid var(--color-plum)"
                }}>
                  Learn More
                </Link>
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "120%",
                height: "120%",
                background: "radial-gradient(circle, rgba(244, 140, 6, 0.2) 0%, rgba(255,255,255,0) 70%)",
                zIndex: 0
              }} />
              <Image
                src="/images/hero_splash.png"
                alt="Fresh Juice Splash"
                width={600}
                height={600}
                style={{ position: "relative", zIndex: 1, width: "100%", height: "auto" }}
                priority
              />
            </div>
          </div>
        </section>

        {/* Why Dalausi? Section */}
        <section style={{ padding: "6rem 2rem", background: "var(--color-plum)", color: "white" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
            <h2 style={{
              fontSize: "2.5rem",
              fontFamily: "var(--font-outfit)",
              marginBottom: "3rem",
              color: "var(--color-orange)"
            }}>Why Choose Dalausi?</h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "3rem"
            }}>
              <div style={{ padding: "2rem", background: "rgba(255,255,255,0.05)", borderRadius: "1rem" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-green)" }}>100% Natural</h3>
                <p style={{ lineHeight: "1.6", color: "#e5e5e5" }}>
                  No added sugars, no preservatives, no artificial flavors. Just the pure, unadulterated taste of nature.
                </p>
              </div>
              <div style={{ padding: "2rem", background: "rgba(255,255,255,0.05)", borderRadius: "1rem" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-green)" }}>Farm to Bottle</h3>
                <p style={{ lineHeight: "1.6", color: "#e5e5e5" }}>
                  We source directly from local Ugandan farmers, ensuring the freshest produce supports our community.
                </p>
              </div>
              <div style={{ padding: "2rem", background: "rgba(255,255,255,0.05)", borderRadius: "1rem" }}>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-green)" }}>Freshly Squeezed</h3>
                <p style={{ lineHeight: "1.6", color: "#e5e5e5" }}>
                  Pressed daily in small batches to maintain maximum nutrient density and flavor profile.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section style={{ padding: "6rem 2rem", background: "white" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: "4rem" }}>
              <h2 style={{
                fontSize: "2.5rem",
                color: "var(--color-plum)",
                fontFamily: "var(--font-outfit)",
                marginBottom: "1rem"
              }}>Customer Favorites</h2>
              <p style={{ color: "var(--color-gray-800)" }}>Made fresh daily. No preservatives, just pure juice.</p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem"
            }}>
              <ProductCard
                id="1"
                name="Classic Orange"
                description="100% pure extracted orange juice. High in Vitamin C and bursting with citrus flavor."
                price="UGX 5,000"
                image="/images/orange_bottle.png"
              />
              <ProductCard
                id="2"
                name="Mango Nectar"
                description="Rich, thick, and sweet. Made from the finest ripened mangoes."
                price="UGX 6,000"
                image="/images/mango_bottle.png"
              />
              <ProductCard
                id="3"
                name="Passion Twist"
                description="Tangy passion fruit blended for a refreshing kick."
                price="UGX 5,500"
                image="/images/hero_splash.png"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
