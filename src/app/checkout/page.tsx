"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./checkout.module.css";
import Image from "next/image";

export default function CheckoutPage() {
    const router = useRouter();
    const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
    const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [transportFee, setTransportFee] = useState(5000);

    // Payment State
    const [phoneNumber, setPhoneNumber] = useState("");
    const [provider, setProvider] = useState<"MTN" | "AIRTEL">("MTN");
    const [paymentStep, setPaymentStep] = useState<"details" | "processing" | "success">("details");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);
    const [transactionId, setTransactionId] = useState<string | null>(null);
    const [pollingCount, setPollingCount] = useState(0);

    const finalTotal = subtotal + (orderType === "delivery" ? transportFee : 0);

    // Auto-detect provider from phone number
    const handlePhoneChange = (phone: string) => {
        setPhoneNumber(phone);
        const cleaned = phone.replace(/[\s-]/g, '');
        if (cleaned.startsWith('25677') || cleaned.startsWith('25678') || cleaned.startsWith('25670')) {
            setProvider("MTN");
        } else if (cleaned.startsWith('25671') || cleaned.startsWith('25675')) {
            setProvider("AIRTEL");
        }
    };

    // Polling for verification
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (paymentStep === "processing" && transactionId) {
            intervalId = setInterval(async () => {
                setPollingCount(prev => {
                    if (prev >= 60) {
                        setError("Payment verification timed out. Please contact support.");
                        setLoading(false);
                        setPaymentStep("details");
                        setPollingCount(0); // Reset polling count for next attempt
                        if (intervalId) clearInterval(intervalId);
                        return prev;
                    }
                    return prev + 1;
                });

                try {
                    const verifyRes = await fetch("/api/payments/verify", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ transaction_id: transactionId })
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.status === "successful") {
                        setOrderData({ orderNumber: verifyData.order_id });
                        setPaymentStep("success");
                        clearCart();
                        if (intervalId) clearInterval(intervalId);
                    } else if (verifyData.status === "failed" || verifyData.status === "expired") {
                        setError("Payment failed or was rejected.");
                        setLoading(false);
                        setPaymentStep("details");
                        setPollingCount(0); // Reset polling count for next attempt
                        if (intervalId) clearInterval(intervalId);
                    }
                } catch (err) {
                    console.error("Polling error:", err);
                }
            }, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [paymentStep, transactionId, clearCart]);

    const handleSubmitOrder = async () => {
        // Validate phone number
        const phoneRegex = /^(07[0-9]|25677|25678|25670|25671|25675)[0-9]{7}$/;
        if (!phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''))) {
            setError("Please enter a valid phone number");
            return;
        }

        // Validate delivery address
        if (orderType === "delivery" && !deliveryAddress.trim()) {
            setError("Please enter a delivery address");
            return;
        }

        // Validate cart
        if (items.length === 0) {
            setError("Your cart is empty");
            return;
        }

        setLoading(true);
        setError("");

        try {
            // 1. Create Order First (before payment)
            const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const res = await fetch("/api/customer/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })),
                    orderType,
                    transportFee: orderType === "delivery" ? transportFee : 0,
                    deliveryAddress: orderType === "delivery" ? deliveryAddress : null,
                    paymentMethod: "mobile_money",
                    phoneNumber,
                    provider
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to create order");
                setLoading(false);
                return;
            }

            setOrderData(data.order);

            // 2. Initiate MoneyUnify Payment
            const initiateRes = await fetch("/api/payments/mobile-money", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: phoneNumber,
                    amount: finalTotal,
                    orderId: data.order.orderNumber
                })
            });

            const initiateData = await initiateRes.json();

            if (!initiateRes.ok) {
                setError(initiateData.error || "Failed to initiate payment");
                setLoading(false);
                return;
            }

            setTransactionId(initiateData.transaction_id);
            setPaymentStep("processing");

        } catch (err) {
            setError("Network error. Please try again.");
            setLoading(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className={styles.wrapper}>
                <Header />
                <main className={styles.main}>
                    <div className="container">
                        <div className={styles.emptyCart}>
                            <h1>Your Cart is Empty</h1>
                            <p>Add some delicious juices to get started!</p>
                            <a href="/daily-menu" className={styles.shopBtn}>Browse Menu</a>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.main}>
                <div className="container">
                    <h1 className={styles.pageTitle}>Checkout</h1>

                    <div className={styles.checkoutGrid}>
                        {/* Cart Items */}
                        <div className={styles.cartSection}>
                            <h2>Your Order</h2>
                            <div className={styles.cartItems}>
                                {items.map((item: any) => (
                                    <div key={item.productId} className={styles.cartItem}>
                                        <div className={styles.itemImage}>
                                            <Image
                                                src={item.imageUrl || "/images/dalausi-logo.png"}
                                                alt={item.productName}
                                                width={80}
                                                height={80}
                                            />
                                        </div>
                                        <div className={styles.itemDetails}>
                                            <h3>{item.productName}</h3>
                                            <p>UGX {item.unitPrice.toLocaleString()} per litre</p>
                                        </div>
                                        <div className={styles.itemQuantity}>
                                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                                        </div>
                                        <div className={styles.itemTotal}>
                                            <p>UGX {(item.unitPrice * item.quantity).toLocaleString()}</p>
                                        </div>
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => removeItem(item.productId)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div className={styles.summarySection}>
                            <h2>Complete Payment</h2>

                            {paymentStep === "success" ? (
                                <div className={styles.successMessage}>
                                    <div className={styles.successIcon}>✓</div>
                                    <h3>Order Confirmed!</h3>
                                    <p>Order Number: <strong>{orderData?.orderNumber}</strong></p>
                                    <p>Total Paid: <strong>UGX {finalTotal.toLocaleString()}</strong></p>

                                    <div className={styles.paymentSummary}>
                                        <p>📱 Payment sent to: {provider === "MTN" ? "MTN MoMo" : "Airtel Money"}</p>
                                        <p>📞 Phone: {phoneNumber}</p>
                                    </div>

                                    <p>You will receive a confirmation SMS shortly.</p>
                                    <a href="/daily-menu" className={styles.shopBtn}>Order More</a>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.orderTypeSelector}>
                                        <button
                                            className={orderType === "delivery" ? styles.active : ""}
                                            onClick={() => setOrderType("delivery")}
                                        >
                                            🚚 Delivery
                                        </button>
                                        <button
                                            className={orderType === "pickup" ? styles.active : ""}
                                            onClick={() => setOrderType("pickup")}
                                        >
                                            🏪 Pickup
                                        </button>
                                    </div>

                                    {orderType === "delivery" && (
                                        <div className={styles.deliveryForm}>
                                            <label>Delivery Address</label>
                                            <textarea
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="Enter your delivery address..."
                                                rows={3}
                                            />
                                        </div>
                                    )}

                                    <div className={styles.paymentForm}>
                                        <h3>Mobile Money Payment</h3>

                                        {paymentStep === "processing" && (
                                            <div className={styles.processingMessage}>
                                                <p>Please approve the payment on your phone.</p>
                                                <p className={styles.small}>Waiting for confirmation... ({pollingCount}s)</p>
                                            </div>
                                        )}

                                        <div className={styles.providerButtons}>
                                            <button
                                                className={`${styles.providerBtn} ${provider === "MTN" ? styles.active : ""}`}
                                                onClick={() => setProvider("MTN")}
                                                disabled={paymentStep === "processing"}
                                            >
                                                🟡 MTN MoMo
                                            </button>
                                            <button
                                                className={`${styles.providerBtn} ${provider === "AIRTEL" ? styles.active : ""}`}
                                                onClick={() => setProvider("AIRTEL")}
                                                disabled={paymentStep === "processing"}
                                            >
                                                🔴 Airtel Money
                                            </button>
                                        </div>

                                        <div className={styles.phoneInput}>
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                placeholder="07XXXXXXXX or 256XXXXXXXXX"
                                                disabled={paymentStep === "processing"}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.priceBreakdown}>
                                        <div className={styles.priceRow}>
                                            <span>Subtotal</span>
                                            <span>UGX {subtotal.toLocaleString()}</span>
                                        </div>
                                        {orderType === "delivery" && (
                                            <div className={styles.priceRow}>
                                                <span>Delivery</span>
                                                <span>UGX {transportFee.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className={`${styles.priceRow} ${styles.total}`}>
                                            <span>Total</span>
                                            <span>UGX {finalTotal.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {error && <div className={styles.error}>{error}</div>}

                                    <button
                                        className={styles.checkoutBtn}
                                        onClick={handleSubmitOrder}
                                        disabled={loading || paymentStep === "processing"}
                                    >
                                        {loading ? "Initializing..." : paymentStep === "processing" ? "Waiting for Approval" : `Pay UGX ${finalTotal.toLocaleString()}`}
                                    </button>

                                    <p className={styles.paymentNote}>
                                        By paying, you authorize the payment of UGX {finalTotal.toLocaleString()} to Dalausi Juice via {provider === "MTN" ? "MTN MoMo" : "Airtel Money"}.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

