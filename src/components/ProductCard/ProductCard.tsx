'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import styles from './ProductCard.module.css';

interface ProductCardProps {
    id: string;
    name: string;
    description: string;
    price: string;
    image: string;
    unitPrice: number;
}

export default function ProductCard({ id, name, description, price, image, unitPrice }: ProductCardProps) {
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const { addItem } = useCart();
    const totalPrice = unitPrice * quantity;

    // Format price for display
    const formatPrice = (amount: number) => {
        return `UGX ${amount.toLocaleString('en-US')}`;
    };

    const handleAddToCart = () => {
        addItem({
            productId: id,
            productName: name,
            unitPrice,
            imageUrl: image
        }, quantity);

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image
                    src={image}
                    alt={name}
                    width={200}
                    height={200}
                    className={styles.image}
                />
            </div>
            <div className={styles.content}>
                <h3 className={styles.name}>{name}</h3>
                <p className={styles.description}>{description}</p>

                <div className={styles.quantitySelector}>
                    <div className={styles.quantityControls}>
                        <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className={styles.quantityButton}
                            aria-label="Decrease quantity"
                        >
                            −
                        </button>
                        <span className={styles.quantityDisplay}>{quantity}</span>
                        <button
                            type="button"
                            onClick={() => setQuantity(quantity + 1)}
                            className={styles.quantityButton}
                            aria-label="Increase quantity"
                        >
                            +
                        </button>
                        <span className={styles.quantityText}>({quantity} item{quantity !== 1 ? 's' : ''})</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.priceContainer}>
                        <span className={styles.priceLabel}>Total:</span>
                        <span className={styles.price}>{formatPrice(totalPrice)}</span>
                    </div>
                    <button
                        onClick={handleAddToCart}
                        className={`${styles.orderButton} ${added ? styles.added : ''}`}
                    >
                        {added ? '✓ Added!' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
}
