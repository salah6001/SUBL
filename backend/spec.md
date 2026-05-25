# Docker Critical Problems Spec

This document lists every critical issue that prevents `docker-compose up` from working correctly on Linux.
Each fix is described precisely so it can be applied mechanically, in order.

---

## ISSUE 1 — Postgres starts before it is ready; migrations always crash on first run

**Severity:** CRITICAL — always fails  
**Files:** `docker-compose.yml`

### What is wrong

`web-api` `depends_on` only waits for the postgres *container* to start, not for
postgres to be ready to accept connections. `ApplyMigrations()` in `Program.cs` calls
`dbContext.Database.Migrate()` with no retry logic the moment the app boots. Postgres
needs several seconds to initialize its data directory after the container starts.
Result: the web-api container crashes with `Connection refused` every time postgres
data is empty (first run, fresh volume, CI, etc.).

### Exact fix

**Step 1** — Add a `healthcheck` block to the `postgres` service in `docker-compose.yml`.

Current (lines 20–30):
```yaml
  postgres:
    image: postgres:17
    container_name: postgres
    environment:
      - POSTGRES_DB=clean-architecture
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - ./.containers/db:/var/lib/postgresql/data
    ports:
      - 5432:5432
```

Replace with:
```yaml
  postgres:
    image: postgres:17
    container_name: postgres
    environment:
      - POSTGRES_DB=clean-architecture
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - ./.containers/db:/var/lib/postgresql/data
    ports:
      - 5432:5432
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d clean-architecture"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
```

**Step 2** — Change `web-api` `depends_on` in `docker-compose.yml` to wait for the healthy condition.

Current (lines 16–18):
```yaml
    depends_on:
      - postgres
      - mailpit
```

Replace with:
```yaml
    depends_on:
      postgres:
        condition: service_healthy
      mailpit:
        condition: service_started
```

---

## ISSUE 2 — `docker-compose.override.yml` uses Windows-only `${APPDATA}` — always merged, breaks Linux

**Severity:** CRITICAL — makes the web-api container start with wrong/broken configuration on any Linux host  
**Files:** `docker-compose.override.yml`

### What is wrong

Docker Compose **automatically** merges `docker-compose.yml` and
`docker-compose.override.yml` every time `docker-compose up` is run. There is no
opt-in step — the override is always applied.

The override file was written for Visual Studio on Windows. It contains two
platform-specific problems:

**Problem A — `${APPDATA}` does not exist on Linux:**
```yaml
volumes:
  - ${APPDATA}/Microsoft/UserSecrets:/root/.microsoft/usersecrets:ro
  - ${APPDATA}/ASP.NET/Https:/root/.aspnet/https:ro
```
`APPDATA` is a Windows environment variable. On Linux it is unset (empty string).
Docker Compose substitutes it as an empty string, producing source paths
`/Microsoft/UserSecrets` and `/ASP.NET/Https` on the Linux host. Docker creates
those directories (owned by root) and mounts them empty. User Secrets are never
loaded, and the HTTPS certificate directory is always empty.

**Problem B — `ASPNETCORE_HTTPS_PORTS` with no certificate:**
```yaml
environment:
  - ASPNETCORE_HTTPS_PORTS=8081
```
This tells ASP.NET Core to bind an HTTPS endpoint on port 8081. But the certificate
that should back it comes from the `${APPDATA}/ASP.NET/Https` volume — which is
empty on Linux (see Problem A). ASP.NET Core will log a certificate error for
HTTPS. The app survives only because `ASPNETCORE_URLS=http://+:8080` (set in
`docker-compose.yml`) takes precedence over `ASPNETCORE_HTTPS_PORTS`, so the HTTPS
bind is skipped. However, the intent is broken and the behaviour depends on this
undocumented precedence rule.

**Problem C — `ASPNETCORE_HTTP_PORTS` conflicts with `ASPNETCORE_URLS`:**
```yaml
environment:
  - ASPNETCORE_HTTP_PORTS=8080
```
`docker-compose.yml` already sets `ASPNETCORE_URLS=http://+:8080`. Setting
`ASPNETCORE_HTTP_PORTS` alongside `ASPNETCORE_URLS` is explicitly unsupported.
`ASPNETCORE_URLS` wins, making `ASPNETCORE_HTTP_PORTS` silently ignored — but
the redundancy creates confusion and the behavior could change across .NET versions.

### Exact fix

**Replace the entire contents of `docker-compose.override.yml`** with a Linux-safe
version that keeps only the environment variable that actually matters (development
environment name) and drops all Windows-specific paths and redundant port variables:

```yaml
services:
  web-api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
```

> **Note:** If HTTPS for local development is genuinely needed later, it should be
> set up with a proper certificate volume path that works cross-platform (e.g., using
> a bind mount to a local `certs/` folder checked into the project, or by using
> `docker secrets`). Do not use `${APPDATA}` for cross-platform Docker setups.

---

## ISSUE 3 — `seq` service is not in `web-api` `depends_on`; early startup logs are lost

**Severity:** IMPORTANT — does not crash the container but causes missing logs during startup  
**Files:** `docker-compose.yml`

### What is wrong

`web-api` configures Serilog with a Seq sink at `http://seq:80` (via the env var
`Serilog__WriteTo__1__Args__ServerUrl=http://seq:80`). Serilog initialises this sink
immediately when `UseSerilog()` runs, before `depends_on` ordering takes effect
for services not listed there.

Because `seq` is not in `web-api` `depends_on`, Docker Compose may start `web-api`
before the Seq container is listening. Serilog does not crash — it queues messages
and retries — but all log output from application startup (migrations, DI
registration, seeding) is silently dropped or arrives out of order in the Seq UI.
In practice, this makes debugging startup failures much harder.

### Exact fix

Add `seq` to `web-api` `depends_on` in `docker-compose.yml`.

After applying Issue 1's fix, the `depends_on` block already looks like:
```yaml
    depends_on:
      postgres:
        condition: service_healthy
      mailpit:
        condition: service_started
```

Add seq:
```yaml
    depends_on:
      postgres:
        condition: service_healthy
      mailpit:
        condition: service_started
      seq:
        condition: service_started
```

---

## Summary table

| # | File | Problem | Breaks Docker? |
|---|------|---------|---------------|
| 1 | `docker-compose.yml` | No postgres healthcheck; migrations crash before DB is ready | **YES — always on first run** |
| 2 | `docker-compose.override.yml` | Windows-only `${APPDATA}` paths + conflicting port env vars; auto-merged on Linux | **YES — wrong configuration always applied** |
| 3 | `docker-compose.yml` | `seq` missing from `depends_on`; startup logs silently dropped | Partial — startup logging broken |

---

## Context: Docker Compose version and Dockerfile version

### Docker Compose version

The `docker-compose.yml` file has **no `version:` key at the top**. That is intentional
and correct — it means the file uses the **Compose Specification**, which is what
Docker Compose v2 (the `docker compose` plugin) understands. All fixes in this document
use Compose Specification syntax.

Minimum required Docker version to apply these fixes: **Docker Engine 20.10+ with
Docker Compose v2.x** (ships with Docker Desktop on Windows/Mac and is the default
on modern Linux installs). The `condition: service_healthy` syntax in `depends_on`
is fully supported by the Compose Specification and does not require any version
declaration in the file.

There is no "Dockerfile version" — all Dockerfiles use the same instruction syntax
regardless of Docker Engine version. The multi-stage Dockerfile in this project
(`src/Web.Api/Dockerfile`) uses standard syntax that has been stable for years.

### Why the postgres race condition is the definitive root cause

`depends_on: [postgres]` only means *"start the postgres container before web-api."*
It says nothing about whether postgres is **ready to accept connections inside the
container**. After the postgres container starts, postgres itself must:

1. Initialize the data directory (`/var/lib/postgresql/data`) — slow on first run
2. Run internal setup scripts (`initdb`, role creation, encoding setup)
3. Begin listening on port 5432

This takes several seconds. `web-api` starts in parallel and `ApplyMigrations()`
fires immediately (`dbContext.Database.Migrate()` with zero retry logic). The result
is always `Npgsql.NpgsqlException: Connection refused` → container crash.

The `condition: service_healthy` fix makes Docker Compose block `web-api` from
starting until `pg_isready -U postgres -d clean-architecture` exits 0. No sleep
hacks, no retry loops in application code — Docker itself handles the wait.

---

## Cross-platform support: Linux and Windows together

### The core problem

`docker-compose.override.yml` is **automatically merged** by Docker Compose on every
`docker compose up` call — there is no flag to disable this. It was generated by
Visual Studio for Windows-only use, but it runs everywhere, including Linux CI and
Linux servers.

### Solution: two override files, one per platform

**Keep:** `docker-compose.override.yml` — rewritten to be cross-platform (no
Windows paths). This file is auto-merged on every platform and must be safe everywhere.

**Create:** `docker-compose.windows.yml` — new file containing only the
Windows-specific Visual Studio extras. Applied manually on Windows only.

---

### File: `docker-compose.override.yml` — KEEP, but replace contents entirely

This file stays in the repo. Its entire contents must be replaced with the
cross-platform version below. Every line in the current file is either
Windows-specific or redundant with `docker-compose.yml`, so nothing from the
current file survives.

**New contents (replace everything):**
```yaml
services:
  web-api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
```

That single line is the only value the override meaningfully adds on Linux.
(`ASPNETCORE_ENVIRONMENT=Development` is already in `docker-compose.yml` too, so
this override is fully redundant — but keeping it documents the intent and is
harmless.)

---

### File: `docker-compose.windows.yml` — CREATE this new file

Create this file at the project root (next to `docker-compose.yml`). It is
**never auto-merged**. Windows users who work in Visual Studio and need User Secrets
and dev HTTPS certificates apply it manually:

```bash
docker compose -f docker-compose.yml -f docker-compose.windows.yml up
```

**Contents of the new file:**
```yaml
services:
  web-api:
    environment:
      - ASPNETCORE_HTTPS_PORTS=8081
    volumes:
      - ${APPDATA}/Microsoft/UserSecrets:/root/.microsoft/usersecrets:ro
      - ${APPDATA}/ASP.NET/Https:/root/.aspnet/https:ro
    ports:
      - "8081"
```

Linux/Mac/CI users never touch this file. They just run `docker compose up`.

---

### Lines to DELETE forever from `docker-compose.override.yml`

Every line currently in `docker-compose.override.yml` must be deleted. Here is what
each deleted line was, and why it is gone:

| Deleted line | Why deleted |
|---|---|
| `- ASPNETCORE_HTTP_PORTS=8080` | Conflicts with `ASPNETCORE_URLS=http://+:8080` already in `docker-compose.yml`; silently ignored by ASP.NET Core; creates confusion |
| `- ASPNETCORE_HTTPS_PORTS=8081` | Requires a certificate; moved to `docker-compose.windows.yml` where the cert volume mount is also present |
| `- "8080"` (ports) | Duplicate of `5000:8080` already declared in `docker-compose.yml`; no effect |
| `- "8081"` (ports) | Paired with HTTPS port that no longer applies on Linux; moved to `docker-compose.windows.yml` |
| `- ${APPDATA}/Microsoft/UserSecrets:/root/.microsoft/usersecrets:ro` | Windows-only path; all dev values already provided by `appsettings.Development.json`; moved to `docker-compose.windows.yml` |
| `- ${APPDATA}/ASP.NET/Https:/root/.aspnet/https:ro` | Windows-only path; HTTPS not needed for Docker dev on Linux; moved to `docker-compose.windows.yml` |

### Lines to KEEP in `docker-compose.yml` — nothing changes except Issue 1 and Issue 3 fixes

Every other line in `docker-compose.yml` stays exactly as-is:
- All service definitions (`web-api`, `postgres`, `mailpit`, `seq`) — keep
- All image references — keep
- All environment variables — keep
- All port mappings — keep
- All volume declarations — keep
- `ASPNETCORE_URLS=http://+:8080` — keep (this is the correct way to configure Kestrel in Docker)
- `Serilog__WriteTo__1__Args__ServerUrl=http://seq:80` — keep (correctly overrides the Seq URL for the Docker network)

The only changes to `docker-compose.yml` are the two described in Issue 1 (add
healthcheck + update `depends_on`) and Issue 3 (add `seq` to `depends_on`).

---

## Final state of every Docker file after all fixes

### `docker-compose.yml` — final state after all fixes applied

```yaml
services:
  web-api:
    image: ${DOCKER_REGISTRY-}webapi
    container_name: web-api
    build:
      context: .
      dockerfile: src/Web.Api/Dockerfile
    ports:
      - 5000:8080
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://+:8080
      - ConnectionStrings__Database=Host=postgres;Port=5432;Database=clean-architecture;Username=postgres;Password=postgres
      - Serilog__WriteTo__1__Args__ServerUrl=http://seq:80
      - Email__SmtpHost=mailpit
    depends_on:
      postgres:
        condition: service_healthy
      mailpit:
        condition: service_started
      seq:
        condition: service_started

  postgres:
    image: postgres:17
    container_name: postgres
    environment:
      - POSTGRES_DB=clean-architecture
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - ./.containers/db:/var/lib/postgresql/data
    ports:
      - 5432:5432
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d clean-architecture"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s

  mailpit:
    image: axllent/mailpit:latest
    container_name: mailpit
    ports:
      - 1025:1025
      - 8025:8025
    environment:
      - MP_SMTP_AUTH_ACCEPT_ANY=true
      - MP_SMTP_AUTH_ALLOW_INSECURE=true

  seq:
    image: datalust/seq:2024.3
    container_name: seq
    environment:
      - ACCEPT_EULA=Y
    ports:
      - 8081:80
```

### `docker-compose.override.yml` — final state (cross-platform)

```yaml
services:
  web-api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
```

### `docker-compose.windows.yml` — new file (Windows Visual Studio only)

```yaml
services:
  web-api:
    environment:
      - ASPNETCORE_HTTPS_PORTS=8081
    volumes:
      - ${APPDATA}/Microsoft/UserSecrets:/root/.microsoft/usersecrets:ro
      - ${APPDATA}/ASP.NET/Https:/root/.aspnet/https:ro
    ports:
      - "8081"
```

### All other Docker files — unchanged

| File | Action |
|---|---|
| `src/Web.Api/Dockerfile` | Keep as-is — correct .NET 10 multi-stage build |
| `src/Web.Api/Dockerfile (.NET 8)` | Keep as-is — alternate reference, not used by compose |
| `src/Web.Api/Dockerfile (.NET 9)` | Keep as-is — alternate reference, not used by compose |
| `.dockerignore` | Keep as-is |
| `docker-compose.dcproj` | Keep as-is — Visual Studio project metadata only |

---

## Are any project (C#) files affected?

**No. All fixes are in Docker files only.**

The C# code was reviewed for Docker-specific startup failures. Every relevant path
is already defensively written:

- `MigrationExtensions.ApplyMigrations()` — no retry logic in code, but the Docker
  healthcheck fix (Issue 1) makes this safe. The Docker layer handles the wait; the
  code does not need to change.
- `MigrationExtensions.SeedDatabaseAsync()` — already wrapped in `try/catch`. A seed
  failure logs an error and continues; the container does not crash.
- `StressDetectionHttpService` — catches both `HttpRequestException` and
  `TaskCanceledException`, returns an `IsSuccess: false` result instead of throwing.
  The container starts and runs normally even if the ML service is unreachable.
- `DatabaseSeeder` — every seed step checks `if (await _context.X.AnyAsync()) return`
  so re-running it on an already-seeded database is safe.

---

## Docker configuration gap: StressDetection URL is wrong inside a container

**Severity:** Feature broken (not a startup crash)  
**Files:** `docker-compose.yml`

### What is wrong

`appsettings.json` and `appsettings.Development.json` both set:
```json
"StressDetection": {
  "BaseUrl": "http://localhost:8000"
}
```

`docker-compose.yml` never overrides this value. Inside a Docker container,
`localhost` resolves to the container itself — not the host machine. The Python
FastAPI ML service runs on the host (outside Docker), so every call to the
stress detection endpoints will silently fail with `Connection refused`.

The container **does not crash** because `StressDetectionHttpService` catches all
`HttpRequestException` and `TaskCanceledException` and returns `IsSuccess: false`.
But the entire stress detection feature is dead when running in Docker.

### Exact fix

Add one environment variable to the `web-api` service in `docker-compose.yml`:

```yaml
environment:
  - ASPNETCORE_ENVIRONMENT=Development
  - ASPNETCORE_URLS=http://+:8080
  - ConnectionStrings__Database=Host=postgres;Port=5432;Database=clean-architecture;Username=postgres;Password=postgres
  - Serilog__WriteTo__1__Args__ServerUrl=http://seq:80
  - Email__SmtpHost=mailpit
  - StressDetection__BaseUrl=http://host.docker.internal:8000   # <-- add this line
```

**`host.docker.internal`** is a special DNS name Docker provides so containers can
reach the host machine:
- Docker Desktop (Windows and Mac): works out of the box.
- Docker Engine on Linux: requires adding `extra_hosts` to the service:

```yaml
  web-api:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

Add that `extra_hosts` block to the `web-api` service in `docker-compose.yml` when
deploying on Linux without Docker Desktop. On Docker Desktop (Windows/Mac) the
`extra_hosts` block is not needed.

### No project code change needed

`StressDetectionSettings.cs`, `StressDetectionHttpService.cs`, and all `appsettings`
files stay exactly as they are. The fix is purely a Docker-level environment variable
override.

---

## Issues found only during actual runtime testing

The following issues were NOT visible from static file review. They were discovered
by actually running `docker compose build` and `docker compose up` and observing what
failed.

---

## ISSUE 5 — Postgres host port 5432 conflicts with other containers on the same machine

**Severity:** CRITICAL — postgres joins no Docker network; web-api DNS lookup crashes  
**Files:** `docker-compose.yml`

### What is wrong

`docker-compose.yml` binds postgres to host port 5432 (`5432:5432`). If any other
container on the same machine already holds port 5432 (e.g., `postgres-demo` or a
local postgres service), Docker partially starts the postgres container without
attaching it to the project network (`finel-project_default`). The result:

```
docker inspect postgres → Networks: []
```

The postgres healthcheck still passes — it runs `pg_isready` inside the container
over loopback — so `condition: service_healthy` is satisfied and web-api starts.
But web-api cannot resolve the `postgres` DNS hostname because postgres has no
network membership. DNS returns EAGAIN (errno 11), which .NET wraps as
`SocketException: Resource temporarily unavailable`, crashing the container.

This is uniquely dangerous because the healthcheck passes yet the service is
functionally unreachable.

### Exact fix

Change the postgres host port in `docker-compose.yml` from `5432` to `5433`
(or any port not already in use on the host):

```yaml
  postgres:
    ports:
      - 5433:5432   # was 5432:5432
```

Host tools (pgAdmin, DBeaver, etc.) connect on `localhost:5433`. The web-api
container always uses the Docker-internal address `postgres:5432` and is unaffected
by this change.

---

## ISSUE 6 — `web-api` has no restart policy; any transient crash is permanent

**Severity:** CRITICAL — a single transient startup failure (DNS, connection timing) kills the container  
**Files:** `docker-compose.yml`

### What is wrong

Without a `restart` policy, if web-api exits for any reason (transient DNS delay,
connection timing, etc.) Docker Compose leaves it stopped forever. The healthcheck
on postgres only ensures postgres is ready; it cannot protect against a brief DNS
hiccup during the very first milliseconds of container networking setup.

### Exact fix

Add `restart: on-failure` to the `web-api` service in `docker-compose.yml`:

```yaml
  web-api:
    ...
    restart: on-failure
    depends_on:
      ...
```

This tells Docker to restart the container automatically if it exits with a non-zero
code, covering any transient startup failures.

---

## ISSUE 7 — `.containers/db` not in `.dockerignore`; Docker build fails after first run

**Severity:** CRITICAL — `docker compose build` fails with `permission denied` after postgres has been started at least once  
**Files:** `.dockerignore`

### What is wrong

`docker-compose.yml` mounts `.containers/db` as the postgres data volume:
```yaml
volumes:
  - ./.containers/db:/var/lib/postgresql/data
```

Docker creates `.containers/db` owned by `root` when postgres starts for the first
time. On the next `docker compose build`, Docker sends the entire project directory
as the build context. When it reaches `.containers/db`, it fails:

```
error from sender: open /home/.../finel-project/.containers/db: permission denied
```

The build process (running as the current user) cannot read a root-owned directory,
so the entire image build fails.

### Exact fix

Add `**/.containers` to `.dockerignore`:

```
**/.containers
```

The postgres data directory has no business being inside the Docker build context.
Adding it to `.dockerignore` excludes it from the context transfer entirely.

---

## ISSUE 8 — Missing EF Core migration for Stress Detection entities; EF Core 10 throws at startup

**Severity:** CRITICAL — app crashes on every startup before migrations can run  
**Files:** `src/Infrastructure/DependencyInjection.cs` (workaround applied), then a new migration file must be generated

### What is wrong

Four stress detection entities are registered in `ApplicationDbContext`:
```csharp
public DbSet<Device> Devices { get; set; }
public DbSet<StressSession> StressSessions { get; set; }
public DbSet<KeyboardMetrics> KeyboardMetrics { get; set; }
public DbSet<StressReading> StressReadings { get; set; }
```

No migration was ever generated for these entities. The model snapshot (generated
by the last migration, `20260106115614_AddCatalogProposalsAndLeadsModules`) does not
include them. EF Core 10 introduced a new strict check: if the current model differs
from the snapshot, it throws `InvalidOperationException: PendingModelChangesWarning`
before running any migrations. The app crashes before the database is touched.

Symptoms visible in the logs:
```
System.InvalidOperationException: An error was generated for warning
'Microsoft.EntityFrameworkCore.Migrations.PendingModelChangesWarning':
The model for context 'ApplicationDbContext' has pending changes.
Add a new migration before updating the database.
```

After startup, the `AbandonedSessionCleanupService` background service also errors:
```
SqlState: 42P01 — relation "public.stress_sessions" does not exist
```

### Workaround applied (allows the app to start)

`src/Infrastructure/DependencyInjection.cs` — both `AddDbContext` calls now suppress
the warning so migrations can proceed:

```csharp
services.AddDbContext<ApplicationDbContext>(
    options => options
        .UseNpgsql(...)
        .UseSnakeCaseNamingConvention()
        .ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning)));
```

`using Microsoft.EntityFrameworkCore.Diagnostics;` was also added to the top of the
file.

**This is a workaround only.** The `stress_sessions`, `devices`, `keyboard_metrics`,
and `stress_readings` tables are still never created, so all stress detection
endpoints fail at runtime with `relation does not exist`.

### Proper fix (requires dotnet SDK)

Generate the missing migration on a machine with the dotnet SDK and `dotnet-ef` tool:

```bash
dotnet tool install --global dotnet-ef   # if not already installed
dotnet ef migrations add AddStressDetectionTables \
  --context ApplicationDbContext \
  --project src/Infrastructure \
  --startup-project src/Web.Api
```

This generates a new migration file under
`src/Infrastructure/Database/Migrations/` and updates the model snapshot. Once the
migration exists, the `ConfigureWarnings` suppression in `DependencyInjection.cs`
can be removed, restoring strict mode.

---

## Complete list of files changed across all issues

| File | Change type | Why |
|---|---|---|
| `docker-compose.yml` | Modified | Healthcheck, depends_on conditions, seq dependency, StressDetection URL, extra_hosts, postgres port 5433, restart: on-failure |
| `docker-compose.override.yml` | Replaced entirely | Remove Windows-only paths and conflicting env vars |
| `docker-compose.windows.yml` | Created | Extracted Windows Visual Studio config into opt-in file |
| `.dockerignore` | Modified | Add `.containers` to exclude root-owned postgres data dir from build context |
| `src/Infrastructure/DependencyInjection.cs` | Modified | Suppress EF Core 10 PendingModelChangesWarning so app can start while migration is pending |
| `src/Infrastructure/Database/Migrations/` | **TODO** | Generate `AddStressDetectionTables` migration with `dotnet ef migrations add` — requires dotnet SDK |
