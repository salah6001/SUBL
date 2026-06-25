# ONEX - Stress Detection Module

This module is the heart of the ONEX platform: it lets a desktop agent collect
privacy-safe keyboard metrics from the user, runs them through an external
machine-learning model, and persists the resulting stress readings so the
dashboard, alerts, and historical reports can use them.

## Architecture at a Glance

```
Desktop Agent  ──HTTP──▶  ONEX API  ──HTTP──▶  Python ML Service
     ▲                       │                       │
     │                       │ persists              │ predicts
     │                       ▼                       │
     │                  PostgreSQL                   │
     │                  (devices, sessions,          │
     │                   keyboard_metrics,           │
     │                   stress_readings)            │
     │                       │                       │
     └───── SignalR ◀────────┘                       │
            (real-time alerts when high stress is detected)
```

The flow is:

1. The user logs in normally and the agent receives a JWT.
2. The agent registers its machine (`POST /devices`) and gets back a `deviceId`.
3. The agent starts a session (`POST /stress-sessions/start`) and gets back a `sessionId`.
4. Every N seconds the agent computes aggregated keyboard metrics (no key text - only timing/pattern features) and sends them via `POST /stress-sessions/{id}/metrics`.
5. The handler calls the Python ML service, builds a `StressReading`, updates session aggregates, and raises a `StressReadingCreatedDomainEvent`.
6. If the reading is `High` or `Critical`, a `HighStressDetectedDomainEvent` is also raised. The notification handler picks it up and sends an in-app + push alert via the existing notification system (and SignalR).
7. The agent shows the user feedback. The web dashboard reads `/stress/current`, `/stress/readings`, `/stress/trends`, and `/stress-sessions` for charts and history.

## Files Added

### Domain Layer (`src/Domain/StressDetection/`)

| File | Purpose |
|------|---------|
| `DevicePlatform.cs` | Enum: Windows / MacOS / Linux |
| `SessionStatus.cs` | Enum: Active / Paused / Completed / Abandoned |
| `StressLevel.cs` | Enum: Low / Moderate / High / Critical |
| `Device.cs` | A registered desktop agent (factory + revoke/reactivate) |
| `DeviceRegisteredDomainEvent.cs` | Raised when a new device registers |
| `DeviceRevokedDomainEvent.cs` | Raised when a device is revoked |
| `DeviceErrors.cs` | Domain errors for device operations |
| `StressSession.cs` | A monitoring session with aggregates (avg/peak score) |
| `SessionStartedDomainEvent.cs` | Raised when a session starts |
| `SessionEndedDomainEvent.cs` | Raised when a session ends or is abandoned |
| `StressSessionErrors.cs` | Domain errors for session operations |
| `KeyboardMetrics.cs` | One batch of aggregated, privacy-safe keyboard features |
| `StressReading.cs` | ML model output, score + level + confidence |
| `StressReadingCreatedDomainEvent.cs` | Raised on every new reading |
| `HighStressDetectedDomainEvent.cs` | Raised only when level >= High - notification handlers listen to this |
| `StressReadingErrors.cs` | Domain errors for ML pipeline failures |

### Application Layer (`src/Application/StressDetection/`)

#### Common DTOs (`Common/`)

- `DeviceResponses.cs` - `DeviceResponse`
- `SessionResponses.cs` - `SessionResponse`, `SessionDetailResponse`
- `StressReadingResponses.cs` - `StressReadingResponse`, `SubmitMetricsResponse`, `StressTrendPoint`, `CurrentStressResponse`

#### Devices (CQRS)

- `Devices/RegisterDevice/` - command + validator + handler. Idempotent on fingerprint.
- `Devices/RevokeDevice/` - command + handler.
- `Devices/GetMyDevices/` - query + handler.

#### Sessions (CQRS)

- `Sessions/StartSession/` - command + validator + handler. Enforces "one active session per user".
- `Sessions/EndSession/` - command + handler.
- `Sessions/PauseSession/` - command + handler.
- `Sessions/ResumeSession/` - command + handler.
- `Sessions/GetActiveSession/` - query + handler.
- `Sessions/GetSessions/` - query + handler (paginated).
- `Sessions/GetSessionById/` - query + handler (with readings).

#### Stress Pipeline (CQRS)

- `Stress/SubmitMetrics/` - command + validator + handler. **The entrypoint that calls the ML service.**
- `Stress/GetCurrentStress/` - query + handler.
- `Stress/GetReadings/` - query + handler (paginated, optional session filter).
- `Stress/GetTrends/` - query + validator + handler (Minute/Hour/Day/Week buckets).

#### Event Handlers (`EventHandlers/`)

- `HighStressDetectedNotificationHandler.cs` - sends an alert via the existing notification pipeline whenever the model produces a High or Critical reading. Uses the seeded `stress.high_detected` notification type.

#### Abstractions

- `Application/Abstractions/StressDetection/IStressDetectionService.cs` - port for the ML service. Has `PredictAsync` and `IsHealthyAsync`.
- `Application/Abstractions/Repositories/IDeviceRepository.cs`
- `Application/Abstractions/Repositories/IStressSessionRepository.cs`
- `Application/Abstractions/Repositories/IStressReadingRepository.cs` (also defines `StressTrendBucket`)

### Infrastructure Layer (`src/Infrastructure/StressDetection/`)

- `Configurations/DeviceConfiguration.cs` - EF mapping. Unique index on `(user_id, fingerprint)`.
- `Configurations/StressSessionConfiguration.cs` - EF mapping. Filtered index that makes "find active session" O(log n).
- `Configurations/KeyboardMetricsConfiguration.cs` - EF mapping.
- `Configurations/StressReadingConfiguration.cs` - EF mapping. Indexed for time-series queries.
- `Repositories/DeviceRepository.cs`
- `Repositories/StressSessionRepository.cs`
- `Repositories/StressReadingRepository.cs` - the trends method buckets in memory; replace with `date_trunc` if you need to scale.
- `StressDetectionSettings.cs` - bound from `appsettings.json` section `StressDetection`.
- `StressDetectionHttpService.cs` - the HTTP client that talks to the Python ML service.
- `BackgroundServices/AbandonedSessionCleanupService.cs` - every 5 minutes, marks sessions whose last activity is older than 15 minutes as `Abandoned`.
- `StressDetectionServiceCollectionExtensions.cs` - registers everything above.

### Web.Api Layer

#### New tags (`src/Web.Api/Endpoints/Tags.cs`)
- `Tags.Devices`, `Tags.StressSessions`, `Tags.Stress`

#### New endpoints

| Verb | Route | Endpoint File |
|------|-------|---------------|
| POST | `/devices` | `Endpoints/Devices/RegisterDevice.cs` |
| GET  | `/devices` | `Endpoints/Devices/GetMyDevices.cs` |
| DELETE | `/devices/{id}` | `Endpoints/Devices/RevokeDevice.cs` |
| POST | `/stress-sessions/start` | `Endpoints/StressSessions/StartSession.cs` |
| POST | `/stress-sessions/{id}/end` | `Endpoints/StressSessions/EndSession.cs` |
| POST | `/stress-sessions/{id}/pause` | `Endpoints/StressSessions/PauseSession.cs` |
| POST | `/stress-sessions/{id}/resume` | `Endpoints/StressSessions/ResumeSession.cs` |
| GET  | `/stress-sessions/active` | `Endpoints/StressSessions/GetActiveSession.cs` |
| GET  | `/stress-sessions` | `Endpoints/StressSessions/GetSessions.cs` |
| GET  | `/stress-sessions/{id}` | `Endpoints/StressSessions/GetSessionById.cs` |
| POST | `/stress-sessions/{id}/metrics` | `Endpoints/Stress/SubmitMetrics.cs` |
| GET  | `/stress/current` | `Endpoints/Stress/GetCurrentStress.cs` |
| GET  | `/stress/readings` | `Endpoints/Stress/GetReadings.cs` |
| GET  | `/stress/trends` | `Endpoints/Stress/GetTrends.cs` |

All endpoints use `RequireAuthorization()` (JWT) and are auto-registered via the existing `AddEndpoints` reflection scan.

### Wiring

- `IApplicationDbContext` extended with `Devices`, `StressSessions`, `KeyboardMetrics`, `StressReadings`.
- `ApplicationDbContext` extended with the same DbSets.
- `Infrastructure/DependencyInjection.cs` now calls `.AddStressDetectionServices(configuration)`.
- `appsettings.json` and `appsettings.Development.json` got a new `"StressDetection"` section.

## Configuration

In `appsettings.json` (already added):

```json
"StressDetection": {
  "BaseUrl": "http://localhost:8000",
  "ApiKey": "",
  "TimeoutSeconds": 10,
  "PredictPath": "/predict",
  "HealthPath": "/health"
}
```

## Database Migration

A new EF migration must be generated to add the four tables. From the
solution root:

```bash
dotnet ef migrations add AddStressDetectionModule \
  --project src/Infrastructure \
  --startup-project src/Web.Api \
  --context ApplicationDbContext

dotnet ef database update \
  --project src/Infrastructure \
  --startup-project src/Web.Api \
  --context ApplicationDbContext
```

This will create:

- `public.devices`
- `public.stress_sessions`
- `public.keyboard_metrics`
- `public.stress_readings`

with the indexes defined in the configuration files.

## Python ML Service Contract

The .NET service expects a FastAPI/Flask service that exposes:

### `POST /predict`

Request body (snake_case):

```json
{
  "keystroke_count": 312,
  "backspace_count": 18,
  "avg_dwell_time_ms": 95.4,
  "avg_flight_time_ms": 142.1,
  "dwell_time_std_dev": 22.7,
  "flight_time_std_dev": 38.2,
  "typing_speed_wpm": 64.3,
  "error_rate": 0.058,
  "avg_pause_length_ms": 850.0,
  "pause_count": 7
}
```

Response body:

```json
{
  "score": 0.72,
  "confidence": 0.91,
  "model_version": "stress-detector-v1.0.0",
  "metadata": null
}
```

- `score` MUST be in `[0.0, 1.0]` (clamped server-side).
- `confidence` MUST be in `[0.0, 1.0]`.
- `metadata` is an optional opaque string (typically a JSON string with feature importances).

### `GET /health`

Returns 200 OK if the service is up. Used by `IStressDetectionService.IsHealthyAsync`.

## Stress-Level Thresholds

`StressReading.ClassifyLevel` uses these cutoffs (in `Domain/StressDetection/StressReading.cs`):

| Score range | Level |
|-------------|-------|
| `[0.00, 0.30)` | Low |
| `[0.30, 0.60)` | Moderate |
| `[0.60, 0.85)` | High |
| `[0.85, 1.00]` | Critical |

Adjust them once you have real-world data without changing any caller.

## Permissions

The `SystemModule` enum already includes `StressData = 10` and
`StressAnalysis = 11`. The seeder generates the four standard actions
(Read, Create, Update, Delete) for each, so no schema change is required.

By default the endpoints just require authentication. To gate them on
specific permissions later, use the existing `HasPermission` extension on
the route builder:

```csharp
.HasPermission("STRESSDATA:READ")
```

## What's NOT Done (Out of Scope for This Change)

- The actual Python model service - the .NET side is ready and the contract is fixed, but you still need to ship a Python service that returns predictions in the documented format.
- Email and Push notification channels are still stubs (separate from this module). High-stress alerts will go out as in-app + SignalR notifications immediately. They will also create an email/push delivery record once those channels are implemented.
- Subscription/plan limits are not enforced (e.g. cap on sessions/day) - the subscriptions module itself doesn't have an Application layer yet.
- Tests are not added - the project's existing testing approach is architecture-tests-only, so this PR follows that same convention.
