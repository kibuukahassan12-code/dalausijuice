import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "Dalausi Juice | Straight from the Fruit",
  description: "Uganda's leading fresh juice company.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

import CartButton from "@/components/CartButton/CartButton";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <CartProvider>
          {children}
          <CartButton />
        </CartProvider>
      </body>
    </html>
  );
}
