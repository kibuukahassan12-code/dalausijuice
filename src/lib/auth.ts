import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || "default_auth_secret_dalausi_juice_2024"
);

export async function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
}

export async function encrypt(payload: any) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(SECRET);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, SECRET, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (error) {
        return null;
    }
}
