import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/funds
 */
export const GET: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const { rows } = await db.execute({
            sql: `
        SELECT id, userId, name, isin, categoryType, createdAt, updatedAt
        FROM Funds
        WHERE userId = ?
      `,
            args: [userId],
        });

        return res(JSON.stringify(rows), { status: 200 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * POST /api/funds
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const body = await request.json();
        const { name, isin, categoryType } = body || {};
        if (!name || !isin || !categoryType) {
            return res(JSON.stringify("Missing fields"), { status: 400 });
        }

        const now = new Date().toISOString();
        await db.execute({
            sql: `
        INSERT INTO Funds (userId, name, isin, categoryType, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
            args: [userId, name, isin, categoryType, now, now],
        });

        return res(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
