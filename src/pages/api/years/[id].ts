import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { res } from "@/utils/api";
import { validateAuth } from "@/utils/validations";

/**
 * GET /api/years/[id]
 * Obtiene un registro de la tabla Years por su `id`, validando que pertenezca al usuario autenticado.
 */
export const GET: APIRoute = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return res(JSON.stringify("Missing ID."), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: `SELECT id, userId, yearNumber, createdAt, updatedAt
            FROM Years
            WHERE id = ?
              AND userId = ?
            LIMIT 1`,
            args: [id, userId],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Year not found."), { status: 404 });
        }

        return res(JSON.stringify(rows[0]), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error."), { status: 500 });
    }
};

/**
 * PUT /api/years/[id]
 * Actualiza el `yearNumber` de un registro en Years, si pertenece al usuario autenticado.
 */
export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return res(JSON.stringify("Missing ID."), { status: 400 });
        }

        const body = await request.json();
        const { yearNumber } = body;
        if (typeof yearNumber !== "number") {
            return res(JSON.stringify("Invalid or missing yearNumber."), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: `SELECT 1
            FROM Years
            WHERE id = ?
              AND userId = ?
            LIMIT 1`,
            args: [id, userId],
        });
        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Year not found."), { status: 404 });
        }

        const now = new Date().toISOString();
        await db.execute({
            sql: `UPDATE Years
            SET yearNumber = ?,
                updatedAt = ?
            WHERE id = ?
              AND userId = ?`,
            args: [yearNumber, now, id, userId],
        });

        return res(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error."), { status: 500 });
    }
};

/**
 * DELETE /api/years/[id]
 * Elimina un registro de Years, validando que pertenece al usuario.
 */
export const DELETE: APIRoute = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return res(JSON.stringify("Missing ID."), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: `SELECT 1
            FROM Years
            WHERE id = ?
              AND userId = ?
            LIMIT 1`,
            args: [id, userId],
        });
        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Year not found."), { status: 404 });
        }

        await db.execute({
            sql: `DELETE FROM Years
            WHERE id = ?
              AND userId = ?`,
            args: [id, userId],
        });

        return res(JSON.stringify("Year deleted."), { status: 204 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error."), { status: 500 });
    }
};
