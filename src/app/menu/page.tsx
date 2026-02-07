import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ProductCard from "@/components/ProductCard/ProductCard";

export const metadata = {
    title: "Menu | Dalausi Juice",
    description: "Browse our fresh collection of juices, smoothies, and detox mixes.",
};

const products = [
    {
        id: "1",
        name: "Classic Orange",
        description: "100% pure extracted orange juice. High in Vitamin C.",
        price: "UGX 5,000",
        image: "/images/orange_bottle.png",
        category: "Juices"
    },
    {
        id: "2",
        name: "Mango Nectar",
        description: "Rich, thick, and sweet. Made from the finest ripened mangoes.",
        price: "UGX 6,000",
        image: "/images/mango_bottle.png",
        category: "Juices"
    },
    {
        id: "3",
        name: "Passion Twist",
        description: "Tangy passion fruit blended for a refreshing kick.",
        price: "UGX 5,500",
        image: "/images/hero_splash.png",
        category: "Juices"
    },
    {
        id: "4",
        name: "Green Detox",
        description: "Cucumber, celery, apple, and lemon blend.",
        price: "UGX 7,000",
        image: "/images/orange_bottle.png", // Placeholder
        category: "Detox"
    },
    {
        id: "5",
        name: "Tropical Smoothie",
        description: "Pineapple, coconut, and banana blend.",
        price: "UGX 8,000",
        image: "/images/mango_bottle.png", // Placeholder
        category: "Smoothies"
    },
    {
        id: "6",
        name: "Watermelon Rush",
        description: "Sweet and hydrating fresh watermelon juice.",
        price: "UGX 5,000",
        image: "/images/hero_splash.png", // Placeholder
        category: "Juices"
    }
];

export default function MenuPage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Header />

            <main style={{ flex: 1, backgroundColor: "var(--color-off-white)" }}>
                <div style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "2rem",
                    display: "grid",
                    gridTemplateColumns: "250px 1fr",
                    gap: "3rem"
                }}>
                    {/* Sidebar */}
                    <aside style={{
                        position: "sticky",
                        top: "100px",
                        height: "fit-content",
                        background: "white",
                        padding: "1.5rem",
                        borderRadius: "1rem",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}>
                        <h2 style={{
                            fontFamily: "var(--font-outfit)",
                            color: "var(--color-plum)",
                            marginBottom: "1.5rem",
                            fontSize: "1.25rem"
                        }}>Categories</h2>

                        <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {["All", "Juices", "Smoothies", "Detox"].map((category) => (
                                <li key={category}>
                                    <button style={{
                                        border: "none",
                                        background: "none",
                                        color: category === "All" ? "var(--color-orange)" : "var(--color-gray-800)",
                                        fontWeight: category === "All" ? "700" : "500",
                                        cursor: "pointer",
                                        fontSize: "1rem",
                                        textAlign: "left",
                                        width: "100%"
                                    }}>
                                        {category}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </aside>

                    {/* Product Grid */}
                    <div>
                        <h1 style={{
                            fontFamily: "var(--font-outfit)",
                            color: "var(--color-plum)",
                            marginBottom: "2rem",
                            fontSize: "2rem"
                        }}>Our Menu</h1>

                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "2rem"
                        }}>
                            {products.map(product => (
                                <ProductCard
                                    key={product.id}
                                    {...product}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
