'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './Carousel.module.css';

const images = [
    '/images/hero-carousel-event1.png',
    '/images/hero-carousel-event2.png',
    '/images/car1.jpg',
    '/images/car3.jpg',
    '/images/car4.jpg',
    '/images/car5.jpg',
    '/images/car6.jpg',
    '/images/car7.jpg',
    '/images/car8.jpg',
    '/images/car9.jpg',
    '/images/car10.jpg',
    '/images/dianna.jpg',
];

export default function Carousel() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 4000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.carousel}>
            {images.map((src, index) => (
                <div
                    key={src}
                    className={`${styles.slide} ${index === currentIndex ? styles.active : ''}`}
                >
                    <Image
                        src={src}
                        alt={`Slide ${index + 1}`}
                        fill
                        priority={index === 0}
                        className={styles.image}
                        sizes="100vw"
                    />
                </div>
            ))}
            <div className={styles.overlay}></div>
        </div>
    );
}
