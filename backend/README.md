# ExitusRO – Spring Boot backend

REST API for the ExitusRO digital case-management platform (deces → certificat de mostenitor).
This service is the **server-side companion** to the React + Vite frontend that already lives at the repo root and uses Supabase for auth & storage.

The backend connects to **the same Supabase Postgres database** and validates the same Supabase Auth JWTs, so the frontend can talk to either Supabase directly (RLS) or this Spring service (server-side business logic, PDF generation, server-only operations).

---

## 1. Stack

- Java 21, Spring Boot 3.3
- Spring Web + Spring Data JPA (Hibernate 6)
- Spring Security with custom Supabase JWT filter
- PostgreSQL (via Supabase pooler)
- OpenPDF (CMCD / Certificat de deces / Adeverinta de inhumare)
- Resend (transactional email)
- springdoc-openapi (Swagger UI)

---

## 2. Project layout

```
backend/
├── pom.xml
├── .env.example
└── src/main/java/ro/exitusro/api/
    ├── ExitusRoApplication.java
    ├── audit/              # immutable audit log
    ├── cases/              # core "Dosar de deces" + state machine
    ├── common/             # enums, exceptions, hibernate types
    ├── config/             # security, OpenAPI, CORS
    ├── document/           # uploads + generated PDFs
    │   └── pdf/            # OpenPDF generators
    ├── email/              # Resend client
    ├── legal/              # /legal-library catalog
    ├── notification/       # in-app + email notifications
    ├── profile/            # user profile CRUD
    ├── role/               # multi-role (family/doctor/officer/...)
    ├── security/           # SupabaseJwtFilter, CurrentUser
    ├── storage/            # Supabase Storage REST client
    └── task/               # per-case tasks + deadline watcher (cron)
```

---

## 3. Connecting to the database — what to do

The Supabase project is already running and the schema is created by `supabase/migrations/*.sql`. **You do not need to recreate the schema.** Hibernate is configured with `ddl-auto: validate`, so it will simply check that the existing tables match the JPA entities.

### Step-by-step

1. **Open the Supabase Dashboard** for project `kqoomixehwzzpfitazlt`
   (https://supabase.com/dashboard/project/kqoomixehwzzpfitazlt).

2. Go to **Project Settings → Database → Connection string**.

3. Switch the tab to **URI** and pick **Transaction** mode (port `6543`). This is the pooled connection — recommended for any short-lived web request.

   Example connection string:

   ```
   postgresql://postgres.kqoomixehwzzpfitazlt:<DB_PASSWORD>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

4. Convert it to JDBC by prefixing with `jdbc:`:

   ```
   jdbc:postgresql://aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

5. Copy `.env.example` to `.env` (or export the variables in your shell / IDE):

   ```bash
   cd backend
   cp .env.example .env
   # then edit .env with your real values
   ```

   Required values:

   | Variable | Where to find it |
   | --- | --- |
   | `DB_URL` | Step 4 above |
   | `DB_USERNAME` | The user from the URI (e.g. `postgres.kqoomixehwzzpfitazlt`) |
   | `DB_PASSWORD` | Project Settings → Database → **Reset database password** (Supabase only shows it once) |
   | `SUPABASE_URL` | Project Settings → API → Project URL |
   | `SUPABASE_JWT_SECRET` | Project Settings → API → JWT Settings → **JWT Secret** |
   | `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` secret (server-only!) |

6. Run the app:

   ```bash
   ./mvnw spring-boot:run
   # or
   ./mvnw -DskipTests package
   java -jar target/exitusro-backend-0.1.0.jar
   ```

   You should see Hibernate connect and validate the schema. If validation fails, your local entities are out of sync with the migrations.

> **About prepared statements + the pooler.** Supabase's transaction-mode pooler does not support server-side prepared statements. We disable the prepared-statement cache with `prepareThreshold=0` in `application.yml`. Do not change that unless you switch to the **direct** (port 5432) connection, which is fine for low traffic / migrations but exhausts connections under load.

> **Direct connection alternative.** For local development you can also use the direct connection (`...supabase.co:5432`). Use it if you need things like advisory locks; remove `prepareThreshold=0`.

---

## 4. How auth works

The frontend already uses Supabase Auth. Every authenticated request from the React app sets:

```
Authorization: Bearer <supabase-jwt>
```

`SupabaseJwtFilter` validates the JWT signature using `SUPABASE_JWT_SECRET` (HS256), then loads the user's roles from the `user_roles` table. The resulting `CurrentUser` (`id`, `email`, `roles`) is available in every controller / service via `SecurityUtils.currentUser()`.

This means:

- No separate signup flow on the Spring side — Supabase Auth is the source of truth.
- The same JWT works for both Supabase RLS calls and Spring calls.
- 2FA, OTP, ROeID, etc. are handled by Supabase Auth.

---

## 5. RLS vs Spring authorization

The Supabase migration enables **Row Level Security** on every table. Those policies guard direct PostgREST calls from the browser.

This Spring backend connects with the database role (usually `postgres` or a dedicated role you create) and **bypasses RLS**. Authorization is therefore enforced in Java by `CaseAccessGuard` and per-endpoint role checks (`@PreAuthorize`, explicit `user.hasRole(...)` checks). The rules mirror the RLS policies — see `CaseAccessGuard.canView(...)` for the canonical visibility logic.

If you'd rather have Spring respect RLS, create a Postgres role with limited privileges and set the JWT claims via `SET LOCAL request.jwt.claims = ...` at the start of each transaction. That is doable but adds latency; the current design is intentional.

---

## 6. Endpoints (high-level)

All routes are prefixed with `/api/v1`. See Swagger UI at `http://localhost:8080/swagger-ui` once the app is running.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/profiles/me` | Current user profile |
| PUT | `/profiles/me` | Update own profile |
| GET | `/cases` | List cases visible to current user |
| GET | `/cases/inbox` | Inbox for doctor / civil officer (county-filtered) |
| POST | `/cases` | Family opens a new case |
| GET | `/cases/{id}` | Case detail |
| PATCH | `/cases/{id}` | Update case (only DRAFT / AWAITING_DOCTOR) |
| POST | `/cases/{id}/submit-to-doctor` | Family submits → AWAITING_DOCTOR |
| POST | `/cases/{id}/cmcd` | Doctor issues CMCD (generates PDF, transitions → CMCD_ISSUED) |
| POST | `/cases/{id}/death-certificate` | Civil officer issues death cert + burial permit (→ DEATH_CERT_ISSUED) |
| POST | `/cases/{id}/transition` | Generic state-machine transition |
| POST | `/cases/{id}/assign` | Assign a doctor / officer / notary / funeral provider |
| GET | `/cases/{caseId}/documents` | Documents for a case |
| POST | `/cases/{caseId}/documents` | Upload a document (multipart) |
| GET | `/documents/{id}/download` | Download a stored PDF |
| GET | `/cases/{caseId}/tasks` | Tasks / checklist |
| POST | `/cases/{caseId}/tasks` | Create task |
| PATCH | `/tasks/{id}/status` | Update task status |
| GET | `/notifications` | Current user's notifications |
| GET | `/notifications/unread-count` | Unread count badge |
| POST | `/notifications/{id}/read` | Mark a notification read |
| POST | `/notifications/read-all` | Mark all read |
| GET | `/audit/case/{caseId}` | Per-case audit trail |
| GET | `/audit` (admin) | Global audit log |
| GET | `/public/legal` | Legal library (no auth required) |

State machine (enforced server-side):

```
DRAFT → AWAITING_DOCTOR → CMCD_ISSUED → AWAITING_CIVIL_OFFICER
      → DEATH_CERT_ISSUED → FUNERAL_SCHEDULED → FUNERAL_COMPLETED
      → SUCCESSION_OPEN → SUCCESSION_CLOSED → ARCHIVED
```

---

## 7. Running

```bash
cd backend
./mvnw spring-boot:run
```

Health check: `GET http://localhost:8080/actuator/health`.

Swagger UI: `http://localhost:8080/swagger-ui` — click **Authorize** and paste a Supabase JWT (you can grab one from `supabase.auth.getSession()` in the browser).

---

## 8. Wiring up the frontend

In your Vite frontend add the API base URL to `.env`:

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

Then write a fetch helper that pulls the Supabase JWT from the existing session and forwards it:

```ts
import { supabase } from "@/integrations/supabase/client";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
```

Now you can call `api("/cases")`, `api("/cases", { method: "POST", body: JSON.stringify({...}) })`, etc.

---

## 9. Production notes

- Always set `SUPABASE_SERVICE_ROLE_KEY` via secret manager, never in code.
- Put the app behind TLS; the `Authorization` header carries the JWT.
- Set `CORS_ORIGINS` to your actual frontend domain(s), comma-separated.
- For real e-signatures swap the mock `signature_meta` blob for the response of certSIGN / DigiSign.
- For SMS notifications add a second branch in `NotificationService`.
- The deadline watcher runs hourly (`0 0 * * * *`). For staggered alerts switch to a job scheduler (Quartz / Temporal) and store per-task notification state.
