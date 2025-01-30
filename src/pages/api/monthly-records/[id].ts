import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/monthly-records/[id]
 * Obtiene un MonthlyRecord concreto, validando que sea del usuario.
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
        SELECT id, userId, yearId, month, grossSalary, netSalary, createdAt, updatedAt
        FROM MonthlyRecords
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
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * PUT /api/monthly-records/[id]
 * Actualiza un MonthlyRecord si pertenece al usuario.
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

        const body = await request.json();
        let { yearId, month, grossSalary, netSalary } = body;

        const { rows } = await db.execute({
            sql: "SELECT 1 FROM MonthlyRecords WHERE id = ? AND userId = ? LIMIT 1",
            args: [id, userId],
        });
        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found."), { status: 404 });
        }

        if (yearId) {
            const { rows: yearRows } = await db.execute({
                sql: "SELECT 1 FROM Years WHERE id = ? AND userId = ? LIMIT 1",
                args: [yearId, userId],
            });
            if (yearRows.length === 0) {
                return res(JSON.stringify("yearId not found or doesn't belong to user."), { status: 400 });
            }
        }

        const updates: string[] = [];
        const args: any[] = [];
        if (typeof yearId !== "undefined") {
            updates.push("yearId = ?");
            args.push(yearId);
        }
        if (typeof month !== "undefined") {
            updates.push("month = ?");
            args.push(month);
        }
        if (typeof grossSalary !== "undefined") {
            updates.push("grossSalary = ?");
            args.push(grossSalary);
        }
        if (typeof netSalary !== "undefined") {
            updates.push("netSalary = ?");
            args.push(netSalary);
        }

        if (updates.length === 0) {
            return res(JSON.stringify("No fields to update."), { status: 400 });
        }

        const now = new Date().toISOString();
        updates.push("updatedAt = ?");
        args.push(now);

        const sqlUpdate = `
      UPDATE MonthlyRecords
      SET ${updates.join(", ")}
      WHERE id = ? AND userId = ?
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
 * DELETE /api/monthly-records/[id]
 * Elimina un MonthlyRecord si pertenece al usuario.
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
            sql: "SELECT 1 FROM MonthlyRecords WHERE id = ? AND userId = ? LIMIT 1",
            args: [id, userId],
        });

        if (!rows || rows.length === 0) {
            return res(JSON.stringify("Not found."), { status: 404 });
        }

        await db.execute({
            sql: "DELETE FROM MonthlyRecords WHERE id = ? AND userId = ?",
            args: [id, userId],
        });

        return res(JSON.stringify("Deleted."), { status: 204 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
