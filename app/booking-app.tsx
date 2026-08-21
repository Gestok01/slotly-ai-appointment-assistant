"use client";

import { FormEvent, useState } from "react";

type Appointment = { id: number; reference: string; customerName: string; email: string; service: string; appointmentDate: string; appointmentTime: string; notes: string; status: "confirmed" | "completed" | "cancelled"; createdAt: string };
type Draft = { service: string; date: string; time: string; name: string; email: string; notes: string };
type Message = { id: string; role: "assistant" | "user"; text: string };
type Usage = { inputTokens: number; outputTokens: number; model: string | null; source: "ai" | "fallback" };
const blank: Draft = { service: "", date: "", time: "", name: "", email: "", notes: "" };
const services = ["General consultation", "Dental check-up", "Physiotherapy", "Nutrition consultation"];

export function BookingApp() {
  const [view, setView] = useState<"book" | "admin">("book");
  const [draft, setDraft] = useState<Draft>(blank);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ id: "hello", role: "assistant", text: "Hi! I’m Slotly. Tell me what you’d like to book, and I’ll handle the details." }]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [notice, setNotice] = useState("");
  const [usage, setUsage] = useState<Usage>({ inputTokens: 0, outputTokens: 0, model: null, source: "fallback" });

  async function loadAppointments() {
    const response = await fetch("/api/appointments");
    if (response.ok) setAppointments((await response.json()).appointments);
  }
  const complete = Object.entries(draft).filter(([key]) => key !== "notes").every(([, value]) => value);

  function openAdmin() {
    setView("admin");
    void loadAppointments();
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    setThinking(true);
    setMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", text }]);
    const response = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, draft }) });
    const data = await response.json() as { fields?: Draft; reply?: string; source?: "ai" | "fallback"; model?: string | null; usage?: { inputTokens: number; outputTokens: number }; error?: string };
    if (response.ok && data.fields && data.reply && data.usage && data.source) {
      setDraft(data.fields);
      setUsage((current) => ({ inputTokens: current.inputTokens + data.usage!.inputTokens, outputTokens: current.outputTokens + data.usage!.outputTokens, model: data.model ?? current.model, source: data.source! }));
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", text: data.reply! }]);
    } else setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", text: data.error ?? "I couldn’t process that. Please try again." }]);
    setThinking(false);
  }

  async function confirm() {
    if (!complete) return;
    setBusy(true); setNotice("");
    const response = await fetch("/api/appointments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json();
    if (response.ok) {
      setMessages((items) => [...items, { id: crypto.randomUUID(), role: "assistant", text: `Booked! Your confirmation is ${data.appointment.reference}.` }]);
      setNotice(`Appointment ${data.appointment.reference} confirmed`); setDraft(blank);
    } else setNotice(data.error ?? "Could not create the appointment.");
    setBusy(false);
  }

  async function updateStatus(id: number, status: Appointment["status"]) {
    const response = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) await loadAppointments();
  }

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="#"><span className="brand-mark">S</span><span>slotly</span></a>
      <nav className="switcher" aria-label="Application views"><button className={view === "book" ? "active" : ""} onClick={() => setView("book")}>Book</button><button className={view === "admin" ? "active" : ""} onClick={openAdmin}>Admin</button></nav>
      <div className="availability"><span /> Live availability</div>
    </header>
    {view === "book" ? <section className="booking-layout">
      <div className="intro"><p className="eyebrow">AI APPOINTMENT ASSISTANT</p><h1>Booking time,<br /><em>made human.</em></h1><p className="lede">No forms. No phone tag. Just tell Slotly what you need and find a time that fits.</p><div className="trust"><div className="faces"><span>MK</span><span>AR</span><span>JS</span></div><p><strong>4.9 out of 5</strong><br />from 2,000+ bookings</p></div></div>
      <div className="chat-card">
        <div className="chat-head"><div><span className="bot-avatar">S</span><div><strong>Slotly assistant</strong><small>{usage.source === "ai" ? `${usage.model} · AI live` : "Reliable fallback mode"}</small></div></div><span className="secure">Secure</span></div>
        <div className="messages" aria-live="polite">{messages.map((message) => <div key={message.id} className={`message ${message.role}`}>{message.text}</div>)}
          {messages.length === 1 && <div className="chips">{services.map((service) => <button key={service} onClick={() => setInput(service)}>{service}</button>)}</div>}
          {complete && <div className="summary"><span>READY TO BOOK</span><strong>{draft.service}</strong><p>{draft.date} · {draft.time}<br />{draft.name} · {draft.email}</p><button onClick={confirm} disabled={busy}>{busy ? "Confirming…" : "Confirm appointment"}</button></div>}
          {notice && <p className="notice">{notice}</p>}
          {thinking && <div className="message assistant thinking">Understanding your request…</div>}
        </div>
        <form className="composer" onSubmit={send}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message…" aria-label="Message Slotly" disabled={thinking} /><button aria-label="Send message" disabled={thinking}>↑</button></form><p className="hint">Session usage: {usage.inputTokens} input + {usage.outputTokens} output tokens · {usage.source === "ai" ? "live AI" : "fallback"}</p>
      </div>
    </section> : <Admin appointments={appointments} updateStatus={updateStatus} />}
    <footer><span>© 2026 Slotly</span><span>Private by design · Powered by conversational scheduling</span></footer>
  </main>;
}

function Admin({ appointments, updateStatus }: { appointments: Appointment[]; updateStatus: (id: number, status: Appointment["status"]) => void }) {
  return <section className="admin-page"><div className="admin-title"><div><p className="eyebrow">OPERATIONS</p><h1>Appointments</h1><p>Review, complete, or cancel every booking from one calm workspace.</p></div></div>
    <div className="stats"><article><span>All bookings</span><strong>{appointments.length}</strong></article><article><span>Confirmed</span><strong>{appointments.filter((a) => a.status === "confirmed").length}</strong></article><article><span>Completed</span><strong>{appointments.filter((a) => a.status === "completed").length}</strong></article></div>
    <div className="table-wrap"><table><thead><tr><th>Guest</th><th>Service</th><th>Date & time</th><th>Reference</th><th>Status</th><th>Action</th></tr></thead><tbody>{appointments.map((a) => <tr key={a.id}><td><strong>{a.customerName}</strong><small>{a.email}</small></td><td>{a.service}</td><td>{a.appointmentDate}<small>{a.appointmentTime}</small></td><td><code>{a.reference}</code></td><td><span className={`status ${a.status}`}>{a.status}</span></td><td><select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value as Appointment["status"])}><option value="confirmed">Confirmed</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></td></tr>)}{!appointments.length && <tr><td colSpan={6} className="empty">No appointments yet. Book one from the chat to see it here.</td></tr>}</tbody></table></div>
  </section>;
}
