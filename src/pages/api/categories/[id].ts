import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/categories/[id]
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
            return res(JSON.stringify("Missing id."), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: `
        SELECT id, userId, name, createdAt, updatedAt
        FROM Categories
        WHERE id = ?
          AND userId = ?
        LIMIT 1
      `,
            args: [id, userId],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found."), { status: 404 });
        }

        return res(JSON.stringify(rows[0]), { status: 200 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * PUT /api/categories/[id]
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
            return res(JSON.stringify("Missing id."), { status: 400 });
        }

        const { rows: check } = await db.execute({
            sql: "SELECT 1 FROM Categories WHERE id = ? AND userId = ? LIMIT 1",
            args: [id, userId],
        });
        if (!check || check.length === 0) {
            return res(JSON.stringify("Not found or not yours."), { status: 404 });
        }

        const body = await request.json();
        const { name } = body || {};
        if (!name) {
            return res(JSON.stringify("No fields to update."), { status: 400 });
        }

        const now = new Date().toISOString();
        await db.execute({
            sql: `
        UPDATE Categories
        SET name = ?, updatedAt = ?
        WHERE id = ?
          AND userId = ?
      `,
            args: [name, now, id, userId],
        });

        return res(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * DELETE /api/categories/[id]
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
            return res(JSON.stringify("Missing id."), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: "SELECT 1 FROM Categories WHERE id = ? AND userId = ? LIMIT 1",
            args: [id, userId],
        });
        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found."), { status: 404 });
        }

        await db.execute({
            sql: "DELETE FROM Categories WHERE id = ? AND userId = ?",
            args: [id, userId],
        });

        return res(JSON.stringify("Deleted."), { status: 204 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
