import { APPOINTMENT_TIME_ZONE, currentAppointmentContext, validateAppointmentDateTime } from "../../../lib/appointment-datetime";

type Draft = { service: string; date: string; time: string; name: string; email: string; notes: string };

function nextQuestion(draft: Draft) {
  if (!draft.service) return "What type of appointment would you like?";
  if (!draft.date) return "What date works best for you?";
  if (!draft.time) return "What time would you prefer?";
  if (!draft.name) return "Great. What name should I put on the booking?";
  if (!draft.email) return "And what email should receive the confirmation?";
  return "Everything looks ready. Review the details and confirm your booking.";
}

function fallbackExtract(message: string, current: Draft): Draft {
  const next = { ...current };
  const services = ["General consultation", "Dental check-up", "Physiotherapy", "Nutrition consultation"];
  const expectedField = !current.service
    ? "service"
    : !current.date
      ? "date"
      : !current.time
        ? "time"
        : !current.name
          ? "name"
          : !current.email
            ? "email"
            : null;
  const email = message.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0];
  const date = message.match(/\b20\d{2}-\d{2}-\d{2}\b/)?.[0] ?? message.match(/\b\d{1,2}[\/-]\d{1,2}[\/-]20\d{2}\b/)?.[0] ?? message.match(/\b(?:today|tomorrow)\b/i)?.[0];
  const time = message.match(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i)?.[0];
  const service = services.find((item) => message.toLowerCase().includes(item.split(" ")[0].toLowerCase()));

  if (email) next.email = email;
  if (date) next.date = date;
  if (time) next.time = time.toUpperCase();
  if (service) next.service = service;

  if (expectedField === "service" && !service) next.service = message;
  else if (expectedField === "date" && !date) next.date = message;
  else if (expectedField === "time" && !time) next.time = message;
  else if (expectedField === "name" && !email && !date && !time && !service) next.name = message;
  else if (expectedField === "email" && !email) next.email = message;

  return next;
}

function enforceDateTimeGuardrail(fields: Draft) {
  if (!fields.date) return { fields, reply: null };
  const result = validateAppointmentDateTime(fields.date, fields.time || undefined);
  if (result.valid) return { fields: { ...fields, date: result.date, time: result.time ?? fields.time }, reply: null };
  if (result.reason === "invalid-date" || result.reason === "past-date") {
    return { fields: { ...fields, date: "", time: "" }, reply: result.message };
  }
  return { fields: { ...fields, time: "" }, reply: result.message };
}

export async function POST(request: Request) {
  const { message, draft } = await request.json() as { message?: string; draft?: Draft };
  if (!message?.trim() || !draft) return Response.json({ error: "Message and booking draft are required." }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  if (!apiKey) {
    const guarded = enforceDateTimeGuardrail(fallbackExtract(message.trim(), draft));
    return Response.json({ fields: guarded.fields, reply: guarded.reply ?? nextQuestion(guarded.fields), source: "fallback", model: null, usage: { inputTokens: 0, outputTokens: 0 } });
  }

  try {
    const current = currentAppointmentContext();
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        instructions: `You extract appointment details. Preserve existing values unless the user clearly replaces them. Never invent missing data. The current date is ${current.date} and the current time is ${current.time} in ${APPOINTMENT_TIME_ZONE}. Normalize dates to YYYY-MM-DD and times to HH:mm. Never accept a date or time that has already passed. Return only the requested JSON.`,
        input: JSON.stringify({ currentBooking: draft, userMessage: message.trim(), currentDate: current.date, currentTime: current.time, timeZone: APPOINTMENT_TIME_ZONE }),
        text: { format: { type: "json_schema", name: "appointment_turn", strict: true, schema: { type: "object", additionalProperties: false, properties: { service: { type: "string" }, date: { type: "string" }, time: { type: "string" }, name: { type: "string" }, email: { type: "string" }, notes: { type: "string" }, reply: { type: "string" } }, required: ["service", "date", "time", "name", "email", "notes", "reply"] } } },
      }),
    });
    if (!response.ok) throw new Error(`Model request failed with ${response.status}`);
    const result = await response.json() as { model?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }>; usage?: { input_tokens?: number; output_tokens?: number } };
    const outputText = result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("Model returned no structured output");
    const parsed = JSON.parse(outputText) as Draft & { reply: string };
    const fields: Draft = { service: parsed.service, date: parsed.date, time: parsed.time, name: parsed.name, email: parsed.email, notes: parsed.notes };
    const guarded = enforceDateTimeGuardrail(fields);
    return Response.json({ fields: guarded.fields, reply: guarded.reply ?? (parsed.reply || nextQuestion(guarded.fields)), source: "ai", model: result.model ?? model, usage: { inputTokens: result.usage?.input_tokens ?? 0, outputTokens: result.usage?.output_tokens ?? 0 } });
  } catch (error) {
    console.error("[api/chat] OpenAI extraction failed", {
      error: error instanceof Error ? error.message : String(error),
      model,
      hasApiKey: Boolean(apiKey),
    });
    const guarded = enforceDateTimeGuardrail(fallbackExtract(message.trim(), draft));
    return Response.json({ fields: guarded.fields, reply: guarded.reply ?? nextQuestion(guarded.fields), source: "fallback", model: null, usage: { inputTokens: 0, outputTokens: 0 } });
  }
}
