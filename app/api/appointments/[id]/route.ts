import { eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../../db";
import { appointments } from "../../../../db/schema";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await ensureDatabase();
  const { id } = await params;
  const body = await request.json() as { status?: "confirmed" | "completed" | "cancelled" };
  if (!body.status || !["confirmed", "completed", "cancelled"].includes(body.status)) return Response.json({ error: "Invalid status" }, { status: 400 });
  const [appointment] = await getDb().update(appointments).set({ status: body.status }).where(eq(appointments.id, Number(id))).returning();
  return appointment ? Response.json({ appointment }) : Response.json({ error: "Not found" }, { status: 404 });
}
