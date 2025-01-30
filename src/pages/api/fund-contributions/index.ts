import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/fund-contributions
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
        SELECT fc.id, fc.monthlyRecordId, fc.fundId, fc.percentageOfInvestment, fc.createdAt, fc.updatedAt
        FROM FundContributions fc
        WHERE
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = fc.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Funds f WHERE f.id = fc.fundId) = ?
      `,
            args: [userId, userId],
        });

        return res(JSON.stringify(rows), { status: 200 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * POST /api/fund-contributions
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const body = await request.json();
        const { monthlyRecordId, fundId, percentageOfInvestment } = body || {};
        if (!monthlyRecordId || !fundId) {
            return res(JSON.stringify("Missing monthlyRecordId or fundId"), { status: 400 });
        }

        const mrCheck = await db.execute({
            sql: "SELECT 1 FROM MonthlyRecords WHERE id = ? AND userId = ? LIMIT 1",
            args: [monthlyRecordId, userId],
        });
        if (!mrCheck.rows || mrCheck.rows.length === 0) {
            return res(JSON.stringify("Invalid monthlyRecordId or not yours"), { status: 400 });
        }

        const fundCheck = await db.execute({
            sql: "SELECT 1 FROM Funds WHERE id = ? AND userId = ? LIMIT 1",
            args: [fundId, userId],
        });
        if (!fundCheck.rows || fundCheck.rows.length === 0) {
            return res(JSON.stringify("Invalid fundId or not yours"), { status: 400 });
        }

        const now = new Date().toISOString();
        await db.execute({
            sql: `
        INSERT INTO FundContributions (monthlyRecordId, fundId, percentageOfInvestment, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?)
      `,
            args: [monthlyRecordId, fundId, percentageOfInvestment ?? 0, now, now],
        });

        return res(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
