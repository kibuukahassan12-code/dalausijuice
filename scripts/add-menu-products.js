const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Products from the image with their prices
const productsToAdd = [
  // 10,000 UGX products
  { name: "Avocado Mix", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Omubisi (Banana juice)", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Orange Tangerine", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Guava Little Lemon", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Mango Plain", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Mango, Passion, Beetroot Little Lemon", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Mango, Passion, Coconut", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Mango, Passion, Carrots, Tangerine", unitPrice: 10000, costPerUnit: 4000 },
  
  // Right column - 10,000 UGX
  { name: "Milk Blend", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Melon Plain", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Melon, Passion & Tangerine", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Mulondo Mix", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Hibiscus Mix", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Sugarcane Mix", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Pineapple Mint", unitPrice: 10000, costPerUnit: 4000 },
  { name: "Pineapple Melon", unitPrice: 10000, costPerUnit: 4000 },
  
  // 15,000 UGX products
  { name: "Passion Plain", unitPrice: 15000, costPerUnit: 6000 },
  { name: "Passion, Carrots, Tangerine", unitPrice: 15000, costPerUnit: 6000 },
  { name: "Passion Tangerine", unitPrice: 15000, costPerUnit: 6000 },
  { name: "Passion Coconut", unitPrice: 15000, costPerUnit: 6000 },
];

async function addProducts() {
  try {
    // Get existing products
    const existingProducts = await prisma.product.findMany({
      select: { name: true }
    });
    
    const existingNames = new Set(existingProducts.map(p => p.name.toLowerCase()));
    
    console.log(`Found ${existingProducts.length} existing products`);
    
    let added = 0;
    let skipped = 0;
    
    for (const product of productsToAdd) {
      if (existingNames.has(product.name.toLowerCase())) {
        console.log(`Skipping (already exists): ${product.name}`);
        skipped++;
        continue;
      }
      
      await prisma.product.create({
        data: {
          name: product.name,
          unitPrice: product.unitPrice,
          costPerUnit: product.costPerUnit,
          imageUrl: "/images/citrus_combo_new.png",
          showOnMenu: true,
          isActive: true
        }
      });
      
      console.log(`Added: ${product.name} - UGX ${product.unitPrice.toLocaleString()}`);
      added++;
    }
    
    console.log(`\nSummary:`);
    console.log(`- Added: ${added} products`);
    console.log(`- Skipped (already exist): ${skipped} products`);
    
  } catch (error) {
    console.error("Error adding products:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addProducts();
