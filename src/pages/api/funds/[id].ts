import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/funds/[id]
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
            return res(JSON.stringify("Missing id"), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: `
        SELECT id, userId, name, isin, categoryType, createdAt, updatedAt
        FROM Funds
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
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * PUT /api/funds/[id]
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
            return res(JSON.stringify("Missing id"), { status: 400 });
        }

        const { rows: check } = await db.execute({
            sql: "SELECT 1 FROM Funds WHERE id = ? AND userId = ? LIMIT 1",
            args: [id, userId],
        });
        if (!check || check.length === 0) {
            return res(JSON.stringify("Not found"), { status: 404 });
        }

        const body = await request.json();
        const { name, isin, categoryType } = body || {};
        if (!name && !isin && !categoryType) {
            return res(JSON.stringify("No fields to update"), { status: 400 });
        }

        const updates: string[] = [];
        const args: any[] = [];
        if (name) {
            updates.push("name = ?");
            args.push(name);
        }
        if (isin) {
            updates.push("isin = ?");
            args.push(isin);
        }
        if (categoryType) {
            updates.push("categoryType = ?");
            args.push(categoryType);
        }

        updates.push("updatedAt = ?");
        args.push(new Date().toISOString());

        const sqlUpdate = `
      UPDATE Funds
      SET ${updates.join(", ")}
      WHERE id = ?
        AND userId = ?
    `;
        args.push(id, userId);

        await db.execute({ sql: sqlUpdate, args });

        return res(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * DELETE /api/funds/[id]
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
            return res(JSON.stringify("Missing id"), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: "SELECT 1 FROM Funds WHERE id = ? AND userId = ? LIMIT 1",
            args: [id, userId],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found"), { status: 404 });
        }

        await db.execute({
            sql: "DELETE FROM Funds WHERE id = ? AND userId = ?",
            args: [id, userId],
        });

        return res(JSON.stringify("Deleted."), { status: 204 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
