import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/monthly-balances/[id]
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
            sql: `
        SELECT mb.id, mb.monthlyRecordId, mb.accountId, mb.balance, mb.createdAt, mb.updatedAt
        FROM MonthlyBalances mb
        WHERE mb.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = mb.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Accounts a WHERE a.id = mb.accountId) = ?
        LIMIT 1
      `,
            args: [id, userId, userId],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found."), { status: 404 });
        }

        return res(JSON.stringify(rows[0]), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server Error"), { status: 500 });
    }
};

/**
 * PUT /api/monthly-balances/[id]
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

        const body = await request.json() || {};
        const { monthlyRecordId, accountId, balance } = body;

        const { rows: check } = await db.execute({
            sql: `
        SELECT 1
        FROM MonthlyBalances mb
        WHERE mb.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = mb.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Accounts a WHERE a.id = mb.accountId) = ?
        LIMIT 1
      `,
            args: [id, userId, userId],
        });
        if (!check || check.length === 0) {
            return res(JSON.stringify("Not found or not yours."), { status: 404 });
        }

        if (monthlyRecordId) {
            const { rows: mrCheck } = await db.execute({
                sql: "SELECT 1 FROM MonthlyRecords WHERE id = ? AND userId = ? LIMIT 1",
                args: [monthlyRecordId, userId],
            });
            if (!mrCheck || mrCheck.length === 0) {
                return res(JSON.stringify("monthlyRecordId not found or not yours"), { status: 400 });
            }
        }

        if (accountId) {
            const { rows: accCheck } = await db.execute({
                sql: "SELECT 1 FROM Accounts WHERE id = ? AND userId = ? LIMIT 1",
                args: [accountId, userId],
            });
            if (!accCheck || accCheck.length === 0) {
                return res(JSON.stringify("accountId not found or not yours"), { status: 400 });
            }
        }

        const updates: string[] = [];
        const args: any[] = [];
        if (typeof monthlyRecordId !== "undefined") {
            updates.push("monthlyRecordId = ?");
            args.push(monthlyRecordId);
        }
        if (typeof accountId !== "undefined") {
            updates.push("accountId = ?");
            args.push(accountId);
        }
        if (typeof balance !== "undefined") {
            updates.push("balance = ?");
            args.push(balance);
        }

        if (updates.length === 0) {
            return res(JSON.stringify("No fields to update."), { status: 400 });
        }

        const now = new Date().toISOString();
        updates.push("updatedAt = ?");
        args.push(now);

        const sqlUpdate = `
      UPDATE MonthlyBalances
      SET ${updates.join(", ")}
      WHERE id = ?
    `;
        args.push(id);

        await db.execute({ sql: sqlUpdate, args });

        return res(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server Error"), { status: 500 });
    }
};

/**
 * DELETE /api/monthly-balances/[id]
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
            sql: `
        SELECT 1
        FROM MonthlyBalances mb
        WHERE mb.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = mb.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Accounts a WHERE a.id = mb.accountId) = ?
        LIMIT 1
      `,
            args: [id, userId, userId],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found."), { status: 404 });
        }

        await db.execute({
            sql: "DELETE FROM MonthlyBalances WHERE id = ?",
            args: [id],
        });

        return res(JSON.stringify("Deleted."), { status: 204 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server Error"), { status: 500 });
    }
};
