import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/accounts/[id]
 * Obtiene la cuenta por su id, validando que pertenezca al usuario.
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
            return res(JSON.stringify("Missing account ID."), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: `
        SELECT id, userId, name, type, createdAt, updatedAt
        FROM Accounts
        WHERE id = ?
          AND userId = ?
        LIMIT 1
      `,
            args: [id, userId],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found"), { status: 404 });
        }

        return res(JSON.stringify(rows[0]), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * PUT /api/accounts/[id]
 * Actualiza 'name' o 'type' de la cuenta, validando que pertenezca al usuario.
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
            return res(JSON.stringify("Missing account ID."), { status: 400 });
        }

        const { rows: check } = await db.execute({
            sql: "SELECT 1 FROM Accounts WHERE id = ? AND userId = ? LIMIT 1",
            args: [id, userId],
        });

        if (!check || check.length === 0) {
            return res(JSON.stringify("Account not found or not yours"), { status: 404 });
        }

        const body = await request.json();
        const { name, type } = body || {};

        if (!name && !type) {
            return res(JSON.stringify("No fields to update"), { status: 400 });
        }

        const updates: string[] = [];
        const args: any[] = [];

        if (name) {
            updates.push("name = ?");
            args.push(name);
        }
        if (type) {
            updates.push("type = ?");
            args.push(type);
        }

        updates.push("updatedAt = ?");
        const now = new Date().toISOString();
        args.push(now);

        const sqlUpdate = `
      UPDATE Accounts
      SET ${updates.join(", ")}
      WHERE id = ?
        AND userId = ?
    `;

        args.push(id, userId);

        await db.execute({ sql: sqlUpdate, args });

        return res(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * DELETE /api/accounts/[id]
 * Elimina la cuenta si pertenece al usuario autenticado.
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
            return res(JSON.stringify("Missing account ID."), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: "SELECT 1 FROM Accounts WHERE id = ? AND userId = ? LIMIT 1",
            args: [id, userId],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Account not found."), { status: 404 });
        }

        await db.execute({
            sql: "DELETE FROM Accounts WHERE id = ? AND userId = ?",
            args: [id, userId],
        });

        return res(JSON.stringify("Account deleted."), { status: 204 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
