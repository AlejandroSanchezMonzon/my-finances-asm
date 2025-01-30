import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { validateAuth } from "@/utils/validations";
import { res } from "@/utils/api";

/**
 * GET /api/monthly-records
 * Lista todos los registros de `MonthlyRecords` pertenecientes al usuario autenticado.
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
        SELECT id, userId, yearId, month, grossSalary, netSalary, createdAt, updatedAt
        FROM MonthlyRecords
        WHERE userId = ?
      `,
            args: [userId],
        });

        return res(JSON.stringify(rows), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};

/**
 * POST /api/monthly-records
 * Crea un registro de MonthlyRecord para el usuario autenticado.
 */
export const POST: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);
        if (!userId) {
            return res(JSON.stringify("Not authorized"), { status: 401 });
        }

        const body = await request.json();
        const { yearId, month, grossSalary, netSalary } = body;

        if (!yearId || !month) {
            return res(JSON.stringify("Missing yearId or month"), { status: 400 });
        }


        const { rows: yearRows } = await db.execute({
            sql: "SELECT 1 FROM Years WHERE id = ? AND userId = ? LIMIT 1",
            args: [yearId, userId],
        });
        if (yearRows.length === 0) {
            return res(JSON.stringify("yearId not found or doesn't belong to user."), { status: 400 });
        }

        const now = new Date().toISOString();
        await db.execute({
            sql: `
        INSERT INTO MonthlyRecords (userId, yearId, month, grossSalary, netSalary, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            args: [userId, yearId, month, grossSalary ?? 0, netSalary ?? 0, now, now],
        });

        return res(JSON.stringify({ success: true }), { status: 201 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Server error"), { status: 500 });
    }
};
