import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/fund-contributions/[id]
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
        SELECT fc.id, fc.monthlyRecordId, fc.fundId, fc.percentageOfInvestment, fc.createdAt, fc.updatedAt
        FROM FundContributions fc
        WHERE fc.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = fc.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Funds f WHERE f.id = fc.fundId) = ?
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
 * PUT /api/fund-contributions/[id]
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
        FROM FundContributions fc
        WHERE fc.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = fc.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Funds f WHERE f.id = fc.fundId) = ?
        LIMIT 1
      `,
            args: [id, userId, userId],
        });
        if (!check || check.length === 0) {
            return res(JSON.stringify("Not found or not yours."), { status: 404 });
        }

        const body = await request.json();
        const { monthlyRecordId, fundId, percentageOfInvestment } = body || {};

        if (monthlyRecordId) {
            const mrCheck = await db.execute({
                sql: "SELECT 1 FROM MonthlyRecords WHERE id = ? AND userId = ? LIMIT 1",
                args: [monthlyRecordId, userId],
            });
            if (!mrCheck.rows || mrCheck.rows.length === 0) {
                return res(JSON.stringify("Invalid monthlyRecordId"), { status: 400 });
            }
        }

        if (fundId) {
            const fundCheck = await db.execute({
                sql: "SELECT 1 FROM Funds WHERE id = ? AND userId = ? LIMIT 1",
                args: [fundId, userId],
            });
            if (!fundCheck.rows || fundCheck.rows.length === 0) {
                return res(JSON.stringify("Invalid fundId"), { status: 400 });
            }
        }

        const updates: string[] = [];
        const args: any[] = [];
        if (typeof monthlyRecordId !== "undefined") {
            updates.push("monthlyRecordId = ?");
            args.push(monthlyRecordId);
        }
        if (typeof fundId !== "undefined") {
            updates.push("fundId = ?");
            args.push(fundId);
        }
        if (typeof percentageOfInvestment !== "undefined") {
            updates.push("percentageOfInvestment = ?");
            args.push(percentageOfInvestment);
        }
        if (updates.length === 0) {
            return res(JSON.stringify("No fields to update."), { status: 400 });
        }

        updates.push("updatedAt = ?");
        args.push(new Date().toISOString());
        const sqlUpdate = `
      UPDATE FundContributions
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
 * DELETE /api/fund-contributions/[id]
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
        FROM FundContributions fc
        WHERE fc.id = ?
          AND
          (SELECT userId FROM MonthlyRecords mr WHERE mr.id = fc.monthlyRecordId) = ?
          AND
          (SELECT userId FROM Funds f WHERE f.id = fc.fundId) = ?
        LIMIT 1
      `,
            args: [id, userId, userId],
        });
        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found."), { status: 404 });
        }

        await db.execute({
            sql: "DELETE FROM FundContributions WHERE id = ?",
            args: [id],
        });

        return res(JSON.stringify("Deleted."), { status: 204 });
    } catch (error) {
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
