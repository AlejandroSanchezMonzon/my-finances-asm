import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/category-allocations
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
        SELECT ca.id, ca.monthlyRecordId, ca.categoryId, ca.percentageOfNet, ca.createdAt, ca.updatedAt
        FROM CategoryAllocations ca
        WHERE
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = ca.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Categories c WHERE c.id = ca.categoryId) = ?
      `,
            args: [userId, userId],
        });

        return res(JSON.stringify(rows), { status: 200 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * POST /api/category-allocations
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const body = await request.json();
        const { monthlyRecordId, categoryId, percentageOfNet } = body || {};

        if (!monthlyRecordId || !categoryId) {
            return res(JSON.stringify("Missing monthlyRecordId or categoryId"), { status: 400 });
        }

        const mrCheck = await db.execute({
            sql: "SELECT 1 FROM MonthlyRecords WHERE id = ? AND userId = ? LIMIT 1",
            args: [monthlyRecordId, userId],
        });
        if (!mrCheck.rows || mrCheck.rows.length === 0) {
            return res(JSON.stringify("Invalid monthlyRecordId or not yours"), { status: 400 });
        }

        const catCheck = await db.execute({
            sql: "SELECT 1 FROM Categories WHERE id = ? AND userId = ? LIMIT 1",
            args: [categoryId, userId],
        });
        if (!catCheck.rows || catCheck.rows.length === 0) {
            return res(JSON.stringify("Invalid categoryId or not yours"), { status: 400 });
        }

        const now = new Date().toISOString();
        await db.execute({
            sql: `
        INSERT INTO CategoryAllocations (monthlyRecordId, categoryId, percentageOfNet, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `,
            args: [monthlyRecordId, categoryId, percentageOfNet ?? 0, now, now],
        });

        return res(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
