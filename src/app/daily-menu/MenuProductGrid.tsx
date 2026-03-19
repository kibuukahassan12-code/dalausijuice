"use client";

import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard/ProductCard";

// Restored flavor images (used when product has no imageUrl from admin)
const FLAVOR_IMAGES: Record<string, string> = {
    "Mango cocktail": "/images/mango_cocktail.png",
    "Mango": "/images/mango_bottle.png",
    "Coconut cocktail": "/images/coconut_cocktail_new.png",
    "Avocado mix": "/images/avocado_milk_mix.png",
    "Milk meld": "/images/milk_meld.png",
    "Orange": "/images/citrus_combo_new.png",
    "Orange Juice": "/images/citrus_combo_new.png",
    "Citrus combo": "/images/citrus_combo_new.png",
    "Citrus Combo": "/images/citrus_combo_new.png",
    "Sugarcane and ginger": "/images/sugarcane_ginger.png",
    "Guava": "/images/guava_juice_new.png",
    "Beetroot cocktail": "/images/beetroot_cocktail.png",
    "Mulondo coffee mix": "/images/mulondo_juice.png",
    "Passion": "/images/passion_juice.png",
    "Mango passion": "/images/mango_passion_new.png",
    "Passion cocktail": "/images/passion_cocktail_new.png",
    "Pineapple and mint": "/images/pineapple_mint.png",
    "Soursop": "/images/soursop_juice.png",
    "Watermelon": "/images/watermelon_juice.png",
};

function getImageForFlavor(name: string, imageUrl?: string | null): string {
    if (imageUrl) return imageUrl;
    return FLAVOR_IMAGES[name] ?? "/images/dalausi-logo.png";
}

type Product = {
    id: string;
    name: string;
    description: string;
    price: string;
    image: string;
    unitPrice: number;
};

export default function MenuProductGrid() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [menuStatus, setMenuStatus] = useState("OPEN");

    useEffect(() => {
        async function fetchMenu() {
            try {
                // 1. Check if menu is globally open/closed
                const statusRes = await fetch("/api/admin/settings?key=daily_menu_status", { cache: "no-store" });
                const statusData = await statusRes.json();
                const currentStatus = statusData.value || "OPEN";
                setMenuStatus(currentStatus);

                if (currentStatus === "CLOSED") {
                    setLoading(false);
                    return;
                }

                // 2. If Open, fetch products (API returns only showOnMenu=true products when menu=true)
                const res = await fetch("/api/admin/products?menu=true", { cache: "no-store" });
                const data = await res.json();
                
                // 3. Map API products - only products with eye (showOnMenu=true) are returned
                let apiProducts: Product[] = [];
                if (res.ok && Array.isArray(data)) {
                    apiProducts = data.map((p: { id: string; name: string; unitPrice: number; imageUrl?: string | null }) => ({
                        id: p.id,
                        name: p.name,
                        description: "1 Litre",
                        price: `UGX ${Number(p.unitPrice).toLocaleString()}`,
                        image: getImageForFlavor(p.name, p.imageUrl),
                        unitPrice: p.unitPrice
                    }));
                }
                
                setProducts(apiProducts);
            } catch (err) {
                console.error("Failed to load menu", err);
                setProducts([]);
            } finally {
                setLoading(false);
            }
        }
        fetchMenu();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-gray-800)" }}>
                Loading menu…
            </div>
        );
    }

    if (menuStatus === "CLOSED") {
        return (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-red-600)", fontWeight: "bold", fontSize: "1.2rem" }}>
                We are closed for orders. Try again later.
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-gray-800)" }}>
                No flavors on the menu right now. Try again later, our valued customer.
            </div>
        );
    }

    return (
        <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }}>
                {products.map((product) => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>
        </>
    );
}
