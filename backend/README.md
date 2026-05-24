# ExitusRO — Backend (Spring Boot)

Backend REST API for the ExitusRO platform. This is the first slice: authentication
only. Cases / documents / notifications endpoints will be added in subsequent
iterations.

## Stack

- Java 21
- Spring Boot 3.3
- Spring Security 6 (BCrypt-encoded passwords, strength 12)
- Spring Data JPA + Hibernate
- H2 in-memory database (data is wiped on restart, but seeded back automatically)
- JWT (HS384) stored in an HttpOnly cookie (`exitusro_jwt`) + a non-HttpOnly marker
  cookie (`auth_present`) so the SPA can detect login state without ever reading the JWT

## Running

From `backend/`:

```bash
mvn spring-boot:run
```

The server listens on `http://localhost:8080`. CORS is configured for
`http://localhost:3000` and `http://localhost:5173` with credentials enabled.

H2 console is available at `http://localhost:8080/h2-console` while the server
runs (JDBC URL: `jdbc:h2:mem:exitusro`, user `sa`, no password).

## Seeded accounts

On every startup the seeder ensures these four accounts exist. The default
password for **all** of them is `password123`.

| Role              | Email                          | Username        | Full name                          |
|-------------------|--------------------------------|-----------------|------------------------------------|
| Family            | apartinator@exitusro.ro        | apartinator     | Maria Ionescu                      |
| Doctor            | medic@exitusro.ro              | medic           | Dr. Andrei Popescu                 |
| Civil officer     | functionar@exitusro.ro         | functionar      | Elena Vasilescu (Stare Civilă)     |
| Funeral provider  | casa.funerara@exitusro.ro      | casa_funerara   | Casa Funerară Liniștea             |

## Endpoints

| Method | Path                  | Auth        | Description                                  |
|--------|-----------------------|-------------|----------------------------------------------|
| POST   | `/api/auth/login`     | public      | Body: `{email, password}`. Sets auth cookies. Returns user JSON. |
| POST   | `/api/auth/logout`    | public      | Clears auth cookies. Returns 204.            |
| GET    | `/api/auth/me`        | cookie auth | Returns the authenticated user.              |
| GET    | `/api/health`         | public      | Health check.                                |

Everything else under `/api/**` requires a valid JWT cookie and currently returns
404 (controllers not yet implemented).

## Configuration

See `src/main/resources/application.yml`. The most relevant knobs:

- `app.jwt.secret` — Base64-encoded HS384 key. Override in production via the
  `JWT_SECRET` environment variable (at least 32 raw bytes after Base64 decoding).
- `app.jwt.expiration-minutes` — token lifetime, default 240 (4h).
- `app.jwt.secure` — set to `true` once you serve the SPA over HTTPS so cookies
  are only sent on secure connections.
- `app.cors.allowed-origins` — comma-separated list of allowed front-end origins.
