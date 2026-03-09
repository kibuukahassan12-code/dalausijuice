
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const newPassword = "Dalausi123";
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`Resetting password for 'admin' to '${newPassword}'...`);

    // Update User table (used by admin login)
    const user = await prisma.user.update({
        where: { username: "admin" },
        data: { password: hashedPassword },
    });

    console.log("✅ User table updated.");

    // Also verify it immediately
    const verification = await bcrypt.compare(newPassword, user.password);
    if (verification) {
        console.log("✅ Verification successful: Password is now linked to the hash.");
    } else {
        console.error("❌ Verification failed immediately after update.");
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
