
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking for admin user...");
    const user = await prisma.user.findUnique({
        where: { username: "admin" },
    });

    if (!user) {
        console.error("❌ Admin user 'admin' NOT found in database!");
        return;
    }

    console.log("✅ Admin user found:", user.username);
    console.log("Stored Hash:", user.password);

    const password = "DalausiAdmin2024!";
    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
        console.log("✅ Password 'DalausiAdmin2024!' helps verify the hash. Login SHOULD work.");
    } else {
        console.error("❌ Password 'DalausiAdmin2024!' DOES NOT match the stored hash.");

        // Attempt to reset it
        console.log("🔄 Resetting password to 'DalausiAdmin2024!'...");
        const newHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { username: "admin" },
            data: { password: newHash }
        });
        console.log("✅ Password reset complete.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
