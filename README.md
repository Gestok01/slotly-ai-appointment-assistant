# Slotly - AI-Powered Appointment Booking Assistant

Slotly is a conversational appointment booking app. A customer can describe what they need in chat, complete the required details, and confirm a booking. An admin can review all bookings and move them between confirmed, completed, and cancelled states.

- Live app: https://slotly-appointment-assistant.iamsammmstyles.chatgpt.site
- GitHub: https://github.com/Gestok01/slotly-ai-appointment-assistant

## Part 1: Problem Understanding (write this yourself - no AI)

> The assignment explicitly says this 150-250 word abstract must be written without AI. Replace this note with your own words before submission. Explain the booking problem, the customer flow, and the admin flow simply. Do not submit AI-written text in this section.

Checklist: describe traditional booking friction, the customer flow, the admin flow, and the main benefit of the solution.

## Part 2: Spec & Plan (AI-assisted)

### System design

```text
Customer chat UI --+
                   +-- Next.js route handlers -- D1 database
Admin dashboard ---+
```

The client contains the conversation interface and admin workspace. Server route handlers validate requests and perform booking operations. Cloudflare D1 stores appointments so they survive sessions and deployments.

### Feature breakdown

- Conversational, step-by-step booking
- Natural text extraction for service, date, time, name, and email
- Suggested services, booking review, and explicit confirmation
- Unique human-readable booking reference
- Persistent appointment storage
- Admin list, summary counts, and status controls
- Responsive and keyboard-accessible interface

### Prompt design

The runtime uses OpenAI structured outputs when `OPENAI_API_KEY` is configured and automatically falls back to deterministic extraction if the model is unavailable. The model prompt is:

```text
You are an appointment booking assistant. Extract only information stated by the user.
Return service, date, time, name, email, and notes as structured JSON. Never invent a
missing value. Ask one concise question for the next missing required field. Before
creating a booking, show a summary and require explicit confirmation.
```

Guardrails: do not infer sensitive data, do not confirm incomplete bookings, validate email server-side, and never allow chat input to perform admin actions.

### Data model

| Field | Type | Purpose |
| --- | --- | --- |
| `id` | integer | Internal primary key |
| `reference` | unique text | Customer confirmation code |
| `customerName` | text | Booking owner |
| `email` | text | Confirmation contact |
| `service` | text | Appointment type |
| `appointmentDate` | text | Requested date |
| `appointmentTime` | text | Requested time |
| `notes` | text | Optional context |
| `status` | text | confirmed / completed / cancelled |
| `createdAt` | ISO text | Audit timestamp |

### Implementation plan

1. Build the responsive booking conversation.
2. Add extraction and field-by-field clarification.
3. Validate and persist confirmed appointments.
4. Build the admin status workflow.
5. Test validation, CRUD, and edge cases.
6. Connect the LLM structured-output route and record real token usage. (Complete)
7. Record the final voiceover demo.

## Part 3: Implementation (AI-assisted)

### Stack

- Next.js 16, React 19, and TypeScript
- Cloudflare-compatible Vinext runtime
- Drizzle ORM with Cloudflare D1
- Tailwind CSS plus custom responsive styles

The customer flow is complete from initial chat through explicit confirmation. A server-side AI route extracts structured booking fields and returns the provider's exact token counts. If no key is configured or the model call fails, a deterministic parser continues the conversation. The server rejects incomplete or invalid email data and creates a unique reference. The admin view reads the same persistent data and updates status through a dedicated endpoint.

### AI model and token usage

- Coding assistant: OpenAI Codex (use the exact model label shown in your development environment)
- Reason: strong TypeScript implementation, architecture planning, and rapid iteration
- Runtime booking model: `OPENAI_MODEL` (defaults to `gpt-4.1-mini`) with structured JSON output
- Reliability mode: deterministic parser fallback, consuming **0 model tokens**
- Exact session usage: displayed beneath the chat composer as input and output token totals

After recording the final demo, copy the displayed model ID and exact input/output totals into this section. Never estimate token usage.

### Local development

```bash
npm install
npm run db:generate
npm run dev
```

Runtime variables:

- `OPENAI_API_KEY`: server-side API key; never expose it to the browser or commit it
- `OPENAI_MODEL`: optional model override; defaults to `gpt-4.1-mini`

## Part 4: Edge Cases

| Edge case | Expected behavior |
| --- | --- |
| Empty message | Send is ignored |
| Missing field | Assistant asks for the next missing field |
| Invalid email | Server rejects the booking |
| Duplicate reference | Unique database index prevents collision |
| Ambiguous date | Kept for user confirmation; future normalizer should use locale/timezone |
| Past date | Future availability service should reject before confirmation |
| Unsupported service | Accepted as free text in MVP; production should use a service catalog |
| Double confirmation | Button is disabled while the request runs |
| Booking not found | Update API returns 404 |
| Invalid admin status | Update API returns 400 |
| Database unavailable | API returns an error without fabricating success |
| Mobile viewport | Interface collapses to one column |
| LLM unavailable | Deterministic fallback keeps booking functional |

## Submission checklist

- [ ] Replace Part 1 with your own 150-250 word abstract
- [x] Add the final GitHub repository URL
- [ ] Record exact model and token usage if runtime AI is enabled
- [ ] Run the production build
- [ ] Record a voiceover demo no longer than five minutes

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the recording outline.
