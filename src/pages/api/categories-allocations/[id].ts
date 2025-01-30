import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/category-allocations/[id]
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
            return res(JSON.stringify("Missing ID"), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: `
        SELECT ca.id, ca.monthlyRecordId, ca.categoryId, ca.percentageOfNet, ca.createdAt, ca.updatedAt
        FROM CategoryAllocations ca
        WHERE ca.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = ca.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Categories c WHERE c.id = ca.categoryId) = ?
        LIMIT 1
      `,
            args: [id, userId, userId],
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
 * PUT /api/category-allocations/[id]
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
            return res(JSON.stringify("Missing ID"), { status: 400 });
        }

        const { rows: check } = await db.execute({
            sql: `
        SELECT 1
        FROM CategoryAllocations ca
        WHERE ca.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = ca.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Categories c WHERE c.id = ca.categoryId) = ?
        LIMIT 1
      `,
            args: [id, userId, userId],
        });
        if (!check || check.length === 0) {
            return res(JSON.stringify("Not found or not yours."), { status: 404 });
        }

        const body = await request.json();
        const { monthlyRecordId, categoryId, percentageOfNet } = body || {};
        if (monthlyRecordId) {
            const mrCheck = await db.execute({
                sql: "SELECT 1 FROM MonthlyRecords WHERE id = ? AND userId = ? LIMIT 1",
                args: [monthlyRecordId, userId],
            });
            if (!mrCheck.rows || mrCheck.rows.length === 0) {
                return res(JSON.stringify("Invalid monthlyRecordId"), { status: 400 });
            }
        }

        if (categoryId) {
            const catCheck = await db.execute({
                sql: "SELECT 1 FROM Categories WHERE id = ? AND userId = ? LIMIT 1",
                args: [categoryId, userId],
            });
            if (!catCheck.rows || catCheck.rows.length === 0) {
                return res(JSON.stringify("Invalid categoryId"), { status: 400 });
            }
        }

        const updates: string[] = [];
        const args: any[] = [];
        if (typeof monthlyRecordId !== "undefined") {
            updates.push("monthlyRecordId = ?");
            args.push(monthlyRecordId);
        }
        if (typeof categoryId !== "undefined") {
            updates.push("categoryId = ?");
            args.push(categoryId);
        }
        if (typeof percentageOfNet !== "undefined") {
            updates.push("percentageOfNet = ?");
            args.push(percentageOfNet);
        }
        if (updates.length === 0) {
            return res(JSON.stringify("No fields to update."), { status: 400 });
        }

        updates.push("updatedAt = ?");
        args.push(new Date().toISOString());
        const sqlUpdate = `
      UPDATE CategoryAllocations
      SET ${updates.join(", ")}
      WHERE id = ?
    `;
        args.push(id);

        await db.execute({ sql: sqlUpdate, args });

        return res(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * DELETE /api/category-allocations/[id]
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
            return res(JSON.stringify("Missing ID"), { status: 400 });
        }

        const { rows } = await db.execute({
            sql: `
        SELECT 1
        FROM CategoryAllocations ca
        WHERE ca.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = ca.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Categories c WHERE c.id = ca.categoryId) = ?
        LIMIT 1
      `,
            args: [id, userId, userId],
        });
        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found."), { status: 404 });
        }

        await db.execute({
            sql: "DELETE FROM CategoryAllocations WHERE id = ?",
            args: [id],
        });

        return res(JSON.stringify("Deleted."), { status: 204 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
