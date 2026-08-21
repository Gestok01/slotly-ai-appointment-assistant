export const APPOINTMENT_TIME_ZONE = "Asia/Kolkata";

type ValidationReason = "invalid-date" | "past-date" | "invalid-time" | "past-time";

type ValidationResult =
  | { valid: true; date: string; time?: string }
  | { valid: false; reason: ValidationReason; message: string };

function zonedNow(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APPOINTMENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute") };
}

function formatDate(year: number, month: number, day: number) {
  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
}

function validCalendarDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function currentAppointmentContext(now = new Date()) {
  const current = zonedNow(now);
  return { date: formatDate(current.year, current.month, current.day), time: `${current.hour.toString().padStart(2, "0")}:${current.minute.toString().padStart(2, "0")}` };
}

export function normalizeAppointmentDate(input: string, now = new Date()) {
  const value = input.trim().toLowerCase();
  const current = zonedNow(now);
  if (value === "today") return formatDate(current.year, current.month, current.day);
  if (value === "tomorrow") {
    const tomorrow = new Date(Date.UTC(current.year, current.month - 1, current.day + 1));
    return formatDate(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate());
  }

  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const local = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  const year = Number(iso?.[1] ?? local?.[3]);
  const month = Number(iso?.[2] ?? local?.[2]);
  const day = Number(iso?.[3] ?? local?.[1]);
  if (!year || !validCalendarDate(year, month, day)) return null;
  return formatDate(year, month, day);
}

export function normalizeAppointmentTime(input: string) {
  const match = input.trim().toLowerCase().replaceAll(".", "").match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const period = match[3];
  if (minute > 59 || (period ? hour < 1 || hour > 12 : hour > 23)) return null;
  if (period === "am" && hour === 12) hour = 0;
  if (period === "pm" && hour !== 12) hour += 12;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function validateAppointmentDateTime(dateInput: string, timeInput?: string, now = new Date()): ValidationResult {
  const date = normalizeAppointmentDate(dateInput, now);
  if (!date) return { valid: false, reason: "invalid-date", message: "Please enter a valid appointment date." };

  const current = zonedNow(now);
  const today = formatDate(current.year, current.month, current.day);
  if (date < today) return { valid: false, reason: "past-date", message: "That date has already passed. Please choose a future appointment date." };
  if (!timeInput) return { valid: true, date };

  const time = normalizeAppointmentTime(timeInput);
  if (!time) return { valid: false, reason: "invalid-time", message: "Please enter a valid appointment time." };
  if (date === today) {
    const [hour, minute] = time.split(":").map(Number);
    if (hour * 60 + minute <= current.hour * 60 + current.minute) {
      return { valid: false, reason: "past-time", message: "That time has already passed. Please choose a future appointment time." };
    }
  }
  return { valid: true, date, time };
}
