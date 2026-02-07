import Image from 'next/image';
import styles from './ProductCard.module.css';

interface ProductCardProps {
    id: string;
    name: string;
    description: string;
    price: string;
    image: string;
}

export default function ProductCard({ id, name, description, price, image }: ProductCardProps) {
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
                <div className={styles.footer}>
                    <span className={styles.price}>{price}</span>
                    <button className={styles.addToCart}>Add to Cart</button>
                </div>
            </div>
        </div>
    );
}
