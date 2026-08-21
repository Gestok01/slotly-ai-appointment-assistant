import { desc } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
import { appointments } from "../../../db/schema";
import { validateAppointmentDateTime } from "../../../lib/appointment-datetime";

export async function GET() {
  try { await ensureDatabase(); return Response.json({ appointments: await getDb().select().from(appointments).orderBy(desc(appointments.createdAt)) }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load appointments" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const body = await request.json() as { service?: string; date?: string; time?: string; name?: string; email?: string; notes?: string };
    if (![body.service, body.date, body.time, body.name, body.email].every((v) => v?.trim())) return Response.json({ error: "All booking details are required." }, { status: 400 });
    if (!body.email?.includes("@")) return Response.json({ error: "Please enter a valid email." }, { status: 400 });
    const dateTime = validateAppointmentDateTime(body.date!, body.time!);
    if (!dateTime.valid) return Response.json({ error: dateTime.message }, { status: 400 });
    const reference = `SL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [appointment] = await getDb().insert(appointments).values({ reference, customerName: body.name!.trim(), email: body.email.trim(), service: body.service!.trim(), appointmentDate: dateTime.date, appointmentTime: dateTime.time!, notes: body.notes?.trim() ?? "", createdAt: new Date().toISOString() }).returning();
    return Response.json({ appointment }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to create appointment" }, { status: 500 }); }
}
