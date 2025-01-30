import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { res } from "@/utils/api";

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email, password } = await request.json();
        if (!email || !password) {
            return res(JSON.stringify({ error: "Missing fields" }), { status: 400 });
        }

        const result = await db.execute({
            sql: "SELECT * FROM Users WHERE email = ?",
            args: [email],
        });
        const user = result.rows.length > 0 ? result.rows[0] : null;
        if (!user) {
            return res(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
        }

        if (typeof user.password !== "string") {
            return res(JSON.stringify({ error: "Invalid user password" }), { status: 400 });
        }

        const valid = bcrypt.compare(password, user.password);
        if (!valid) {
            return res(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
        return res(JSON.stringify({ token }), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify({ error: "Server Error" }), { status: 500 });
    }
};
