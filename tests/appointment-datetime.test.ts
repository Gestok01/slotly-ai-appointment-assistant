import assert from "node:assert/strict";
import test from "node:test";
import { currentAppointmentContext, normalizeAppointmentDate, validateAppointmentDateTime } from "../lib/appointment-datetime.ts";

const now = new Date("2026-08-21T10:00:00.000Z"); // 15:30 in Asia/Kolkata

test("reports the current appointment date and time in Asia/Kolkata", () => {
  assert.deepEqual(currentAppointmentContext(now), { date: "2026-08-21", time: "15:30" });
});

test("normalizes relative dates", () => {
  assert.equal(normalizeAppointmentDate("today", now), "2026-08-21");
  assert.equal(normalizeAppointmentDate("tomorrow", now), "2026-08-22");
});

test("rejects a past date", () => {
  assert.deepEqual(validateAppointmentDateTime("2026-08-20", "18:00", now), {
    valid: false,
    reason: "past-date",
    message: "That date has already passed. Please choose a future appointment date.",
  });
});

test("rejects a past time when the date is today", () => {
  assert.deepEqual(validateAppointmentDateTime("today", "3 pm", now), {
    valid: false,
    reason: "past-time",
    message: "That time has already passed. Please choose a future appointment time.",
  });
});

test("accepts a future time today and a future date", () => {
  assert.deepEqual(validateAppointmentDateTime("today", "4 pm", now), { valid: true, date: "2026-08-21", time: "16:00" });
  assert.deepEqual(validateAppointmentDateTime("22/08/2026", "9:30 am", now), { valid: true, date: "2026-08-22", time: "09:30" });
});
