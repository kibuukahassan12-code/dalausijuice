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
    "Orange": "/images/orange_juice_new.png",
    "Orange Juice": "/images/orange_juice_new.png",
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

// Featured products from hero page - these should always appear in the menu
const FEATURED_PRODUCTS = [
    {
        id: "featured-passion-fruit",
        name: "Passion Fruit Juice",
        description: "1 Litre",
        price: 10000,
        image: "/images/passion_juice.png",
    },
    {
        id: "featured-mango",
        name: "Mango Juice",
        description: "1 Litre",
        price: 10000,
        image: "/images/mango_bottle.png",
    },
    {
        id: "featured-pineapple",
        name: "Pineapple Mint Juice",
        description: "1 Litre",
        price: 10000,
        image: "/images/pineapple_mint.png",
    },
    {
        id: "featured-milk-meld",
        name: "Milk Meld",
        description: "1 Litre",
        price: 10000,
        image: "/images/milk_meld.png",
    },
    {
        id: "featured-watermelon",
        name: "Watermelon Juice",
        description: "1 Litre",
        price: 10000,
        image: "/images/watermelon_juice.png",
    },
    {
        id: "featured-soursop",
        name: "Soursop Juice",
        description: "1 Litre",
        price: 10000,
        image: "/images/soursop_juice.png",
    },
    {
        id: "featured-mango-cocktail",
        name: "Mango Cocktail",
        description: "1 Litre",
        price: 10000,
        image: "/images/mango_cocktail.png",
    },
    {
        id: "featured-coconut-cocktail",
        name: "Coconut Cocktail",
        description: "1 Litre",
        price: 10000,
        image: "/images/coconut_cocktail_new.png",
    },
    {
        id: "featured-avocado-mix",
        name: "Avocado Mix",
        description: "1 Litre",
        price: 10000,
        image: "/images/avocado_milk_mix.png",
    },
    {
        id: "featured-orange",
        name: "Orange Juice",
        description: "1 Litre",
        price: 10000,
        image: "/images/orange_juice.png",
    },
    {
        id: "featured-citrus-combo",
        name: "Citrus Combo",
        description: "1 Litre",
        price: 10000,
        image: "/images/citrus_combo_new.png",
    },
    {
        id: "featured-sugarcane-ginger",
        name: "Sugarcane and Ginger",
        description: "1 Litre",
        price: 10000,
        image: "/images/sugarcane_ginger.png",
    },
    {
        id: "featured-guava",
        name: "Guava Juice",
        description: "1 Litre",
        price: 10000,
        image: "/images/guava_juice_new.png",
    },
    {
        id: "featured-beetroot-cocktail",
        name: "Beetroot Cocktail",
        description: "1 Litre",
        price: 10000,
        image: "/images/beetroot_cocktail.png",
    },
    {
        id: "featured-mulondo-coffee",
        name: "Mulondo Coffee Mix",
        description: "1 Litre",
        price: 10000,
        image: "/images/mulondo_juice.png",
    },
    {
        id: "featured-mango-passion",
        name: "Mango Passion",
        description: "1 Litre",
        price: 10000,
        image: "/images/mango_passion_new.png",
    },
    {
        id: "featured-passion-cocktail",
        name: "Passion Cocktail",
        description: "1 Litre",
        price: 10000,
        image: "/images/passion_cocktail_new.png",
    },
];

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

                // 2. If Open, fetch products
                const res = await fetch("/api/admin/products?menu=true", { cache: "no-store" });
                const data = await res.json();
                
                // 3. Map API products
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
                
                // 4. Merge featured products with API products
                // Featured products should always appear in the menu
                const featuredProductsFormatted: Product[] = FEATURED_PRODUCTS.map(fp => ({
                    id: fp.id,
                    name: fp.name,
                    description: fp.description,
                    price: `UGX ${fp.price.toLocaleString()}`,
                    image: fp.image,
                    unitPrice: fp.price
                }));
                
                // Combine featured products with API products, avoiding duplicates by name
                const apiProductNames = new Set(apiProducts.map(p => p.name.toLowerCase()));
                const uniqueFeaturedProducts = featuredProductsFormatted.filter(
                    fp => !apiProductNames.has(fp.name.toLowerCase())
                );
                
                setProducts([...uniqueFeaturedProducts, ...apiProducts]);
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
