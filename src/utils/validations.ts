import jwt from "jsonwebtoken";

export async function validateAuth(authHeader: string | null): Promise<number | null> {
    if (!authHeader) {
        return null;
    }

    if (!authHeader.toLowerCase().startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.slice(7).trim();

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
        throw new Error("Missing JWT_SECRET in environment variables");
    }

    try {
        const decoded = jwt.verify(token, secretKey) as { userId: number; iat: number; exp: number };

        return decoded.userId;
    } catch (err) {
        console.error("Invalid token:", err);
        return null;
    }
}
