import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { res } from "@/utils/api";
import { validateAuth } from "@/utils/validations";
import bcrypt from "bcryptjs";

/**
 * GET: Obtener un usuario por id.
 */
export const GET: APIRoute = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const currentUserId = await validateAuth(authHeader);
        if (!currentUserId) {
            return res(JSON.stringify("Not authorized."), { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return res(JSON.stringify("Missing id."), { status: 400 });
        }

        if (Number(id) !== currentUserId) return res(JSON.stringify("Forbidden."), { status: 403 });

        const { rows } = await db.execute({
            sql: `SELECT id, email, createdAt, updatedAt
            FROM Users
            WHERE id = ?
            LIMIT 1`,
            args: [id],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("User not found."), { status: 404 });
        }

        return res(JSON.stringify(rows[0]), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Something went wrong."), { status: 500 });
    }
};

/**
 * PUT: Actualiza un usuario existente.
 */
export const PUT: APIRoute = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const currentUserId = await validateAuth(authHeader);
        if (!currentUserId) {
            return res(JSON.stringify("Not authorized."), { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return res(JSON.stringify("Missing id."), { status: 400 });
        }

        const body = await request.json();
        const { email, password } = body;
        const now = new Date().toISOString();

        if (Number(id) !== currentUserId) return res(JSON.stringify("Forbidden."), { status: 403 });

        const { rows } = await db.execute({
            sql: `SELECT 1 FROM Users WHERE id = ? LIMIT 1`,
            args: [id],
        });
        if (!rows || rows.length === 0) {
            return res(JSON.stringify("User not found."), { status: 404 });
        }

        let updateSql = `UPDATE Users SET updatedAt = ?`;
        const args: any[] = [now];

        if (email) {
            updateSql += `, email = ?`;
            args.push(email);
        }

        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            updateSql += `, password = ?`;
            args.push(hashed);
        }

        updateSql += ` WHERE id = ?`;
        args.push(id);

        await db.execute({ sql: updateSql, args });

        return res(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Something went wrong."), { status: 500 });
    }
};

/**
 * DELETE: Borra un usuario existente.
 */
export const DELETE: APIRoute = async ({ request, params }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const currentUserId = await validateAuth(authHeader);
        if (!currentUserId) {
            return res(JSON.stringify("Not authorized."), { status: 401 });
        }

        const { id } = params;
        if (!id) {
            return res(JSON.stringify("Missing id."), { status: 400 });
        }

        // if (Number(id) !== currentUserId) return res("Forbidden", 403);

        const { rows } = await db.execute({
            sql: `SELECT 1 FROM Users WHERE id = ? LIMIT 1`,
            args: [id],
        });
        if (!rows || rows.length === 0) {
            return res(JSON.stringify("User not found."), { status: 404 });
        }

        // Eliminar
        await db.execute({
            sql: `DELETE FROM Users WHERE id = ?`,
            args: [id],
        });

        return res(JSON.stringify("User deleted."), { status: 204 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Something went wrong."), { status: 500 });
    }
};
