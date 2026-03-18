"use client";
import { createContext, useContext, useState, useEffect } from "react";
const CartContext = createContext(null);
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("cart") : null;
    if (saved) setCart(JSON.parse(saved));
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: (p.quantity || 1) + 1 } : p
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };
  const clearCart = () => setCart([]);
  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
