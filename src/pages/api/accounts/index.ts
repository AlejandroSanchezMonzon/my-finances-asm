import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/accounts
 * Lista todas las cuentas del usuario autenticado.
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
        SELECT id, userId, name, type, createdAt, updatedAt
        FROM Accounts
        WHERE userId = ?
      `,
            args: [userId],
        });

        return res(JSON.stringify(rows), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * POST /api/accounts
 * Crea una nueva cuenta asociada al usuario autenticado.
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const body = await request.json();
        const { name, type } = body || {};

        if (!name || !type) {
            return res(JSON.stringify("Missing name or type"), { status: 400 });
        }

        const now = new Date().toISOString();
        await db.execute({
            sql: `
        INSERT INTO Accounts (userId, name, type, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `,
            args: [userId, name, type, now, now],
        });

        return res(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
