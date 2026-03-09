"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CartItem = {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
};

type CartContextType = {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    itemCount: number;
    subtotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("dalausi_cart");
        if (savedCart) {
            setItems(JSON.parse(savedCart));
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("dalausi_cart", JSON.stringify(items));
    }, [items]);

    const addItem = (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(i => i.productId === item.productId);

            if (existingItem) {
                return currentItems.map(i =>
                    i.productId === item.productId
                        ? { ...i, quantity: i.quantity + quantity }
                        : i
                );
            }

            return [...currentItems, { ...item, quantity }];
        });
    };

    const removeItem = (productId: string) => {
        setItems(currentItems => currentItems.filter(i => i.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }

        setItems(currentItems =>
            currentItems.map(i =>
                i.productId === productId ? { ...i, quantity } : i
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            itemCount,
            subtotal
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
