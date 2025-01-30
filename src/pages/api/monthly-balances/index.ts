import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/monthly-balances
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
        SELECT mb.id, mb.monthlyRecordId, mb.accountId, mb.balance, mb.createdAt, mb.updatedAt
        FROM MonthlyBalances mb
        WHERE
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = mb.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Accounts a WHERE a.id = mb.accountId) = ?
      `,
            args: [userId, userId],
        });

        return res(JSON.stringify(rows), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server Error"), { status: 500 });
    }
};

/**
 * POST /api/monthly-balances
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const { monthlyRecordId, accountId, balance } = await request.json() || {};

        if (!monthlyRecordId || !accountId) {
            return res(JSON.stringify("Missing monthlyRecordId or accountId."), { status: 400 });
        }

        const { rows: mrCheck } = await db.execute({
            sql: "SELECT 1 FROM MonthlyRecords WHERE id = ? AND userId = ? LIMIT 1",
            args: [monthlyRecordId, userId],
        });
        if (!mrCheck || mrCheck.length === 0) {
            return res(JSON.stringify("monthlyRecordId not found or not yours"), { status: 400 });
        }

        const { rows: accCheck } = await db.execute({
            sql: "SELECT 1 FROM Accounts WHERE id = ? AND userId = ? LIMIT 1",
            args: [accountId, userId],
        });
        if (!accCheck || accCheck.length === 0) {
            return res(JSON.stringify("accountId not found or not yours"), { status: 400 });
        }

        const now = new Date().toISOString();
        await db.execute({
            sql: `
        INSERT INTO MonthlyBalances (monthlyRecordId, accountId, balance, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `,
            args: [monthlyRecordId, accountId, balance ?? 0, now, now],
        });

        return res(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server Error"), { status: 500 });
    }
};
