import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import bcrypt from "bcryptjs";
import { res } from "@/utils/api";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return res(JSON.stringify({ error: "Missing fields" }), { status: 400 });
        }

        const hashed = await bcrypt.hash(password, 10);
        const now = new Date().toISOString();

        await db.execute({
            sql: `INSERT INTO Users (email, password, createdAt, updatedAt)
              VALUES (?, ?, ?, ?)`,
            args: [email, hashed, now, now],
        });

        return res(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
};
