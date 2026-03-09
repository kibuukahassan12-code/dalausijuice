import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function fixPassword() {
    console.log("=== FIXING ADMIN PASSWORD ===\n");
    
    const plainPassword = "admin123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    console.log("New hash:", hashedPassword);
    
    // Test the hash immediately
    const testValid = await bcrypt.compare(plainPassword, hashedPassword);
    console.log("Hash test (should be true):", testValid);
    
    // Update or create the user
    const user = await prisma.user.upsert({
        where: { username: "admin" },
        update: { 
            password: hashedPassword,
            name: "Administrator"
        },
        create: {
            username: "admin",
            password: hashedPassword,
            name: "Administrator",
        },
    });
    
    console.log("\n✅ User updated/created:");
    console.log("   Username:", user.username);
    console.log("   Name:", user.name);
    console.log("   Password hash:", user.password.substring(0, 30) + "...");
    
    // Verify it was saved correctly
    const verifyUser = await prisma.user.findUnique({
        where: { username: "admin" },
    });
    
    if (verifyUser) {
        const isValid = await bcrypt.compare(plainPassword, verifyUser.password);
        console.log("\n✅ Verification from DB:", isValid);
        console.log("\n*** LOGIN WITH ***");
        console.log("Username: admin");
        console.log("Password: admin123");
        console.log("*******************");
    }
    
    await prisma.$disconnect();
}

fixPassword().catch(console.error);
