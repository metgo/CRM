# Automations

Background automations for the CRM: when a record is saved, the server can schedule work (emails, counter updates, status changes, tasks) and run it later at the right time, with no cron and no user action.

Built so far: **payment reminders (rules 1–4)** and **task notifications (rules 18–19)**. The pipeline is generic, so other rules plug in the same way (see [Adding a rule](#adding-a-rule)).

> Dashboard alerts (`lib/mc/alerts.ts`) are separate. They're worked out in the browser each time the page loads, only display, and don't use anything in this folder. The one link: switching a rule off on the Automations page hides its alerts **and** stops its background actions.

---

## How it works

```
 User saves a record
        │
        ▼
 PUT/POST/DELETE /api/mc/[coll]          lib/mc/server/handler.ts
        │  1. save the row
        │  2. publishRecordEvent()       events.ts
        ▼
 ┌──────────────────────────────┐
 │  pg-boss (tables in Postgres,│      boss.ts
 │  schema "pgboss")            │
 │   • record-event             │
 │   • payment-reminder         │
 └──────────────┬───────────────┘
                │ polled every few seconds
                ▼
 Worker (inside the Next server)         worker.ts, started by /instrumentation.ts
        │
        ├─ record-event     → dispatchRecordEvent()   subscribers.ts
        │                        ├─ payments → onPaymentEvent()   payments.ts
        │                        └─ tasks    → onTaskEvent()      tasks.ts
        │                               └─ send now (rule 18) and/or queue jobs for future dates
        │
        ├─ payment-reminder → runPaymentJob()          payments.ts
        └─ task-reminder    → runTaskJob()             tasks.ts
                                 ├─ reload the record, re-check the conditions
                                 ├─ runOnce()  (dedupe via automation_log)   log.ts
                                 └─ send email / bump counter / create task
```

There are two kinds of trigger:

1. **A save** (event-driven). Every create, update or delete through the generic mc API puts a `record-event` job on the queue. The API responds straight away, and the worker handles the event a few seconds later.
2. **The clock** (scheduled). When handling an event, a subscriber can queue jobs with a `startAfter` date, like `setTimeout`, except it's stored in Postgres and survives restarts.

Every scheduled job **reloads the record when it runs** and checks its conditions again. If the record was paid, deleted, or had its date moved, the job does nothing. The save decides what *could* happen, and the record's state when the job runs decides what *does*.

---

## Payment reminders (rules 1–4)

Saving a payment (on create, or when `due` or `status` changes) queues up to five jobs, each at **09:00 Israel time**:

| When | Rule | Runs only if | Action | Recipient |
|---|---|---|---|---|
| due − 7 days | 1 | status = `planned` | "Issue the invoice" email | org superadmins |
| due date | 2 | status ∈ `invoiced`, `late`, `debt` | Reminder email (Hebrew), `reminders + 1` | billing contact |
| due + 7 / 14 / 21 | 3 | same as rule 2 | Overdue reminder, `reminders + 1` | billing contact, cc owner |
| `reminders ≥ debtAfter` (default 3) | 4 | not paid | status → `debt`, urgent "Collect debt" task, email | task → owner; email → superadmins |

- **Past steps are skipped.** A payment saved with a due date in the past doesn't send the reminders it "missed".
- **No billing contact** (no active, linked contact with an email): the reminder is logged as `skipped` and the owner gets a "reminder not sent, add a contact" email.
- **Raising the reminder count by hand** to `debtAfter` or more fires rule 4 immediately.
- **Marking the payment paid** turns every remaining job into a no-op.

### Who receives what

- **"Finance" / "manager"** means the organization's `superadmin` profiles, since there are no other roles.
- **Owner** means `clients.owner`.
- **Billing contact** means an active contact whose `links` include the client, with an email. If there are several, the preference is: a link role that reads as billing or finance (`כספים`, `גזבר`, `חשבונות`, `billing`, `finance`…), then `is_primary`, then decision maker, then the oldest. See `billingContact()` in `lookup.ts`.

---

## Task notifications (rules 18–19)

| When | Rule | Runs only if | Action | Recipient |
|---|---|---|---|---|
| Immediately, when a task is created with an assignee or its assignee changes | 18 | task not done, and you didn't assign it to yourself | "New task assigned to you" email | the new assignee |
| due − 1 day, 09:00 | 19 | task not done | "Due tomorrow" email | current assignee |
| due date, 09:00 | 19 | task not done | "Due today" email | current assignee |
| due + 1, then **every day** at 09:00 | 19 | task not done (stops after 30 days overdue) | "N days overdue" email | current assignee |

- Rule 18 needs no schedule. It sends straight from the save event.
- Rule 19's reminders go to whoever is assigned **when the reminder runs**, so reassigning a task moves its future reminders to the new person.
- A task saved when it's **already overdue** starts its daily chain today; the reminders it "missed" aren't sent.
- The overdue chain works by each overdue job queuing the next day's job. Marking the task done ends it.
- A task with no assignee gets no reminders, but its jobs stay queued, so assigning someone later picks them up.

---

## Files

| File | What it does |
|---|---|
| `/instrumentation.ts` | Next runs it once when the server starts. Starts the worker unless `AUTOMATIONS_WORKER=off`. |
| `boss.ts` | pg-boss singleton; creates the queues. **Every queue must be registered here.** |
| `events.ts` | `publishRecordEvent()`, called by the API handler. Works out the changed fields and queues the event. Never throws. |
| `subscribers.ts` | Which listeners run for which collection, like `addEventListener`. |
| `worker.ts` | Connects each queue to its handler. |
| `payments.ts` | Rules 1–4: scheduling, running jobs, debt escalation. |
| `tasks.ts` | Rules 18–19: assignment email, due and overdue reminders. |
| `emails.ts` | Email templates (internal ones in Hebrew and English, client-facing in Hebrew RTL). |
| `lookup.ts` | DB lookups: is the rule on, `debtAfter`, org name, client, managers, owner, billing contact. |
| `log.ts` | `runOnce()`: the send-once guard built on `automation_log`. |
| `time.ts` | Timezone helpers ("today" and "09:00" in `AUTOMATIONS_TZ`, DST-safe). |
| `seed.ts` | Copies the template rules to an organization (called at signup). |

Related changes outside this folder:

- `lib/mc/server/handler.ts`: publishes events after create, update and delete. `organizationId` is ignored in request bodies.
- `lib/auth/index.ts`: seeds the rules for new organizations.
- `lib/email/send.ts`: `sendEmail()` supports `cc`.
- `lib/db/migrations/1789600000000-AutomationsPerOrgAndLog.ts`: see [Database](#database).

---

## Database

### `automations` (rule on/off, one set per organization)
- Rows with `organization_id IS NULL` are the **template** (the 24 seeded rules).
- Each organization has its own copy, made by the migration for existing orgs and by `seedOrgAutomations()` at signup.
- `n` is unique per organization. The Automations page toggles `on`.

### `automation_log` (what the worker did)
| Column | Meaning |
|---|---|
| `rule`, `coll`, `record_id` | Which rule acted on which record |
| `channel` | `email`, `task`, … |
| `dedupe_key` | Unique per organization, e.g. `payment:<id>:r3:14:2026-09-29` |
| `status` | `sent` or `skipped` |
| `detail` | JSON: recipients, skip reason, created task id, … |

**How send-once works** (`runOnce()` in `log.ts`):
1. Insert the log row. If the `dedupe_key` already exists, stop, because it's already been done.
2. Perform the action.
3. On success, record the status and detail. On error, delete the row and rethrow, so pg-boss retries and the retry can claim it again.

### `pgboss.*`
pg-boss creates and migrates its own schema on startup, so it needs no TypeORM migration. Useful query:

```sql
select name, state, data->>'rule' rule, data->>'offset' step, start_after
from pgboss.job
where name = 'payment-reminder'
order by start_after;
```

---

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `AUTOMATIONS_CLIENT_EMAILS` | *(off)* | Set to `on` to actually email clients. While off, client reminders are logged as `skipped` and the counter doesn't go up. Emails to your own team always send. |
| `AUTOMATIONS_TZ` | `Asia/Jerusalem` | Timezone for "today" and the 09:00 send time. |
| `AUTOMATIONS_WORKER` | *(on)* | Set to `off` to run a container without the worker. |
| `MAILCHIMP_TRANSACTIONAL_API_KEY` | — | If unset, every email prints to the console instead of sending. Recommended for local dev. |
| `APP_URL` | — | Base URL for links in emails. |
| `DB_*` | — | pg-boss uses the same database as TypeORM. |

---

## Running it

### Locally
```bash
yarn migration:run
yarn dev            # look for "[automations] worker started"
```
Comment out `MAILCHIMP_TRANSACTIONAL_API_KEY` in `.env.local` so emails print to the terminal instead of reaching real contacts.

**Jobs only run while the app is running.** A job whose time passes while `yarn dev` is stopped runs as soon as the app starts again. In production the server is always up, so jobs run on time.

### Deploying to a new environment
1. Run `yarn migration:run` **before** deploying the code.
2. Set `APP_URL`, `MAILCHIMP_*`, and start with `AUTOMATIONS_CLIENT_EMAILS` unset (off).
3. Deploy. The worker starts with the app.
4. Make sure clients have a linked contact with an email, ideally with the role `כספים`.
5. Turn on `AUTOMATIONS_CLIENT_EMAILS=on` once the Hebrew email copy is approved.

Running several containers is safe: pg-boss locks each job, so exactly one worker runs it.

---

## Known limitations

- **Existing records aren't scheduled.** Jobs are only queued when a record is saved through the API. Payments that existed before this went live get picked up the next time someone edits them.
- **Direct DB edits don't trigger anything.** SQL and admin tools bypass the API, so no event is sent.
- **An event can be lost if the queue write fails.** The row is saved first and the event queued second; a failure is logged, not surfaced to the user.
- **`debtAfter` is global**, read from `mc_settings` (`id = 'main'`), not set per organization.
- **The dashboard's "Create task" button** on a debt alert can duplicate the task rule 4 already created.

A planned **daily sweep** (a recurring pg-boss schedule) would fix the first three by finding records that should have jobs and don't.

---

## Adding a rule

Use the existing rules as templates. `tasks.ts` is the smallest: `notifyAssigned()` shows a rule that fires on save, and `scheduleTaskJobs()` / `runTaskJob()` show scheduled and repeating jobs.

1. **Create `lib/automations/<collection>.ts`** exporting a subscriber `on<Thing>Event(e: RecordEvent)`.
2. **Register it** in `subscribers.ts`, e.g. `contracts: [onContractEvent]`.
3. **If it needs scheduled jobs:** add a queue name to `QUEUES` and a `createQueue()` call in `boss.ts`, then a `boss.work()` handler in `worker.ts`. For jobs scheduled more than 14 days ahead, set `retentionSeconds`, because pg-boss deletes waiting jobs after 14 days by default.
4. **Add the email template** to `emails.ts`.

Rules for subscribers and job handlers:
- **They must be safe to run twice.** pg-boss retries on error, so wrap every outbound action in `runOnce()` with a stable `dedupe_key`.
- **Reload the record in scheduled jobs.** Don't trust the data captured when the job was queued.
- **Check `isRuleOn()`** so the Automations page toggle is respected.
- **Write through repositories, not the API handler**, so the worker's own writes don't fire new events and loop.
