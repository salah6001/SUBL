# Subl — Workplace Wellbeing & Stress Monitoring

Subl is a privacy-first platform that helps organisations understand and support
their team's wellbeing. It estimates a person's stress level from **how** they
type — the rhythm and timing of their keystrokes — **never what** they type. No
words, passwords or message content are ever captured or stored.

Employees get a personal dashboard with their stress trends, self‑assessments,
habits and a wellbeing assistant. Administrators get an aggregated, department‑level
view to spot burnout risk early — without ever seeing an individual's keystrokes.

---

## Table of contents

1. [What's in the box](#whats-in-the-box)
2. [How it works](#how-it-works)
3. [Repository structure](#repository-structure)
4. [Prerequisites — install Docker](#prerequisites--install-docker)
5. [Run it (one command)](#run-it-one-command)
6. [Where to go once it's running](#where-to-go-once-its-running)
7. [Sample logins](#sample-logins)
8. [Everyday commands](#everyday-commands)
9. [Optional configuration](#optional-configuration)
10. [Troubleshooting](#troubleshooting)

---

## What's in the box

Subl runs as a small set of cooperating services, all started by a single
`docker-compose.yml` at the root of this repository:

| Service           | What it does                                                       | URL / Port |
|-------------------|-------------------------------------------------------------------|------------|
| **web-api**       | Core backend API (.NET) — auth, data, analytics, notifications    | http://localhost:5000 |
| **frontend-user** | Employee dashboard (React)                                        | http://localhost:3002 |
| **frontend-admin**| Administrator dashboard (React)                                   | http://localhost:3001 |
| **ml-service**    | Python service that turns keystroke timing into a stress score    | http://localhost:8000 |
| **chatbot**       | Wellbeing assistant the employee can chat with                    | http://localhost:5005 |
| **desktop-agent** | Background agent that measures keystroke *timing* (never content) | — |
| **postgres**      | Database                                                          | localhost:5433 |
| **mailpit**       | Catches outgoing emails so you can read them in a browser (dev)   | http://localhost:8025 |
| **seq**           | Structured application logs (dev)                                 | http://localhost:8081 |

## How it works

1. The **desktop agent** runs on a computer and measures *typing dynamics* —
   how long keys are held, the gaps between them, correction frequency — in short
   batches. It never records the actual keys.
2. Those anonymous timing features are sent to the **API**, which forwards them to
   the **ML service**. The model returns a stress score (0–100).
3. The score is stored and shown to the employee on their **dashboard**, and rolled
   up (anonymously, by department) for **administrators**.
4. When stress rises, Subl can notify the person in‑app, by email, browser push,
   or Slack.

## Repository structure

```
.
├── docker-compose.yml      # Starts the whole stack
├── api/                    # .NET Web API (core backend)
├── ml-service/             # Python ML model (keystroke dynamics → stress)
├── chatbot/                # Wellbeing assistant
├── desktop-agent/          # Keystroke-timing capture agent
├── frontend/
│   ├── admin-dashboard/    # Administrator web app (React)
│   ├── user-dashboard/     # Employee web app (React)
│   └── landing-page/       # Marketing / landing site
└── docs/                   # Documentation & design assets
```

---

## Prerequisites — install Docker

You only need **Docker Desktop** (it bundles everything else). It's free for
personal and small‑business use.

1. Go to **https://www.docker.com/products/docker-desktop/**.
2. Download the installer for your operating system (Windows, macOS or Linux).
3. Run the installer and accept the defaults, then start **Docker Desktop**.
4. Verify it's working — open a terminal (PowerShell on Windows, Terminal on
   macOS/Linux) and run:

   ```bash
   docker --version
   ```

   If you see a version number, you're ready.

> **Linux note:** the *desktop‑agent* reads keyboard‑timing from the host's input
> devices, which only works on Linux. On Windows/macOS every other service runs
> normally — you can simply ignore the agent, or remove it from `docker-compose.yml`.

---

## Run it (one command)

From the folder that contains this README, run:

```bash
docker compose up -d --build
```

That's it. Docker downloads the needed images and builds the services. The first
run takes a few minutes; later runs are much faster.

The database starts **empty and seeds itself automatically** on the first launch
with a few sample accounts (see below).

To check that everything is up:

```bash
docker compose ps
```

## Where to go once it's running

Open these in your browser:

- **Employee dashboard** → http://localhost:3002
- **Administrator dashboard** → http://localhost:3001
- **Email inbox (dev)** → http://localhost:8025  (any email the app "sends" appears here)
- **Application logs (dev)** → http://localhost:8081

## Sample logins

The seeded accounts you can sign in with:

| Role          | Email                | Password     |
|---------------|----------------------|--------------|
| Administrator | `admin@onex.com`     | `Admin@123!` |
| Manager       | `manager@onex.com`   | `Admin@123!` |
| Employee      | `user@company.com`   | `User@123!`  |

You can also create a brand‑new employee account from the sign‑up screen on the
employee dashboard.

---

## Everyday commands

```bash
# See running services and their status
docker compose ps

# Follow the logs of one service (Ctrl+C to stop watching)
docker compose logs -f web-api

# Stop everything (keeps your data)
docker compose down

# Stop everything and wipe the database (start fresh)
docker compose down -v

# Rebuild and restart a single service after changing its code
docker compose up -d --build frontend-user
```

## Optional configuration

- **Slack alerts:** to post notifications to a Slack channel, create an
  [incoming webhook](https://api.slack.com/messaging/webhooks) and set it before
  starting:

  ```bash
  export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXX/YYY/ZZZ"
  docker compose up -d
  ```

- **Chatbot:** the chatbot reads its API key from `chatbot/.env` (not committed).
  Add that file if you want the assistant enabled.

## Troubleshooting

- **A port is already in use** → another program is using one of the ports above.
  Stop it, or change the left‑hand port number in `docker-compose.yml`.
- **The dashboards load but show no data** → give the API a few seconds on first
  start (it seeds the database), then refresh.
- **Start completely fresh** → `docker compose down -v && docker compose up -d --build`.
