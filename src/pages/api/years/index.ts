import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { res } from "@/utils/api";
import { validateAuth } from "@/utils/validations";

/**
 * GET /api/years
 * Retorna todos los registros de la tabla `Years` para el usuario autenticado.
 */
export const GET: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);

        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const { rows } = await db.execute({
            sql: `SELECT id, userId, yearNumber, createdAt, updatedAt
            FROM Years
            WHERE userId = ?`,
            args: [userId],
        });

        return res(JSON.stringify(rows), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error."), { status: 500 });
    }
};

/**
 * POST /api/years
 * Crea un nuevo registro en `Years` para el usuario autenticado.
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);

        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const body = await request.json();
        const { yearNumber } = body;

        if (!yearNumber) {
            return res(JSON.stringify("Missing yearNumber"), { status: 400 });
        }

        const now = new Date().toISOString();

        await db.execute({
            sql: `INSERT INTO Years (userId, yearNumber, createdAt, updatedAt)
            VALUES (?, ?, ?, ?)`,
            args: [userId, yearNumber, now, now],
        });

        return res(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error."), { status: 500 });
    }
};
