import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function diagnoseLogin() {
    console.log("=== DIAGNOSING ADMIN LOGIN ===\n");
    
    // Check if user exists
    const user = await prisma.user.findUnique({
        where: { username: "admin" },
    });
    
    if (!user) {
        console.error("❌ Admin user NOT found in database!");
        console.log("Creating admin user...");
        
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const newUser = await prisma.user.create({
            data: {
                username: "admin",
                password: hashedPassword,
                name: "Administrator",
            },
        });
        console.log("✅ Admin user created:", newUser.username);
    } else {
        console.log("✅ Admin user found:", user.username);
        console.log("   Name:", user.name);
        console.log("   Password hash exists:", user.password ? "Yes" : "No");
        
        // Test password verification
        const testPassword = "Dalausi123";
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`   Password '${testPassword}' valid:`, isValid);
        
        if (!isValid) {
            console.log("\n🔄 Resetting password to 'admin123'...");
            const newHash = await bcrypt.hash("admin123", 10);
            await prisma.user.update({
                where: { username: "admin" },
                data: { password: newHash },
            });
            console.log("✅ Password reset to 'admin123'");
        }
    }
    
    // List all users
    console.log("\n=== ALL USERS ===");
    const allUsers = await prisma.user.findMany();
    allUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.name})`);
    });
    
    console.log("\n=== DONE ===");
}

diagnoseLogin()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
