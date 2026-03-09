import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import MenuProductGrid from "./MenuProductGrid";
import CustomBox from "@/components/CustomBox/CustomBox";
import CategorySidebar from "./CategorySidebar";
import styles from "./daily-menu.module.css";

export const metadata = {
    title: "Daily Menu | Dalausi Juice",
    description: "Browse our fresh collection of 100% natural juices made daily.",
};

export default function MenuPage() {
    return (
        <div className={styles.wrapper}>
            <Header ctaOrange={true} />

            <main className={styles.main}>
                {/* Hero - same purple top as contact, gallery, events-packages */}
                <section className={styles.hero}>
                    <div className={styles.heroOverlay}>
                        <div className="container">
                            <div className={styles.heroContent}>
                                <h1>Our <span className={styles.highlight}>Daily Menu</span></h1>
                                <p>Fresh 100% natural juices made daily. Browse our collection.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.contentSection}>
                    <div className={styles.contentInner}>
                        <CategorySidebar />

                        {/* Product Grid */}
                        <div>
                            <h2 className={styles.menuTitle}>Our Daily Menu</h2>
                            <MenuProductGrid />
                        </div>
                    </div>
                </section>

                <CustomBox />
            </main>

            <Footer />
        </div>
    );
}
