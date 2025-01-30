import type { APIRoute } from "astro";
import { db } from "@/lib/turso";
import { res } from "@/utils/api";
import { validateAuth } from "@/utils/validations";

/**
 * GET: Listar todos los usuarios.
 */
export const GET: APIRoute = async ({ request }) => {
    try {
        const authHeader = request.headers.get("Authorization");
        const userId = await validateAuth(authHeader);

        if (!userId) {
            return res(JSON.stringify("Not authorized."), { status: 401 });
        }

        const { rows } = await db.execute("SELECT id, email, createdAt, updatedAt FROM Users");

        return res(JSON.stringify(rows), { status: 200 });
    } catch (error) {
        console.error(error);
        return res(JSON.stringify("Something went wrong."), { status: 500 });
    }
};
