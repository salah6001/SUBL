# Building & shipping the Subl desktop agent

The agent is a Python (PySide6) app. We ship it as a **one-file executable per
OS** built with PyInstaller and published on **GitHub Releases**. The user
dashboard shows a **Download agent** button that links to the latest release.

## How a user gets it (the "Step 1" flow)
1. On the dashboard, click **Download agent** (auto-labelled for their OS).
2. Run the downloaded file and sign in with their Subl account.
3. The agent registers the device; it then appears in the dashboard's
   "Data Source" bar, where they **claim** it. Done.

## Local one-file build
From `desktop-agent/`:

```bash
python -m pip install -r requirements.txt pyinstaller

# Windows (no console window):
pyinstaller --onefile --windowed --name subl-agent \
  --collect-all PySide6 --collect-all pynput __main__.py

# macOS / Linux:
pyinstaller --onefile --name subl-agent \
  --collect-all PySide6 --collect-all pynput __main__.py
```

The binary lands in `dist/` (`dist/subl-agent.exe` on Windows, `dist/subl-agent`
otherwise).

## Automated releases (all three OSes)
`.github/workflows/agent-release.yml` builds Windows, macOS and Linux binaries
and attaches them to a GitHub Release. Trigger it by pushing a tag:

```bash
git tag agent-v1.0.0
git push origin agent-v1.0.0
```

Assets are published as `subl-agent-windows.exe`, `subl-agent-macos`,
`subl-agent-linux`.

## Configuration
The agent reads these environment variables (see
`subl_agent/infrastructure/config/settings.py`):

- `SUBL_API_URL` — backend base URL (default `http://localhost:5000`). **Set
  this to your deployed API** for real use.
- `SUBL_EMAIL` / `SUBL_PASSWORD` — optional pre-fill for headless/automated runs.
- `SUBL_BATCH_INTERVAL` — seconds between metric batches (default 300).

The dashboard button's target is configurable via the frontend build arg
`VITE_AGENT_RELEASES_URL` (defaults to the repo's GitHub releases/latest page).

## Notes
- **Code signing** is not configured. On Windows users may see a SmartScreen
  prompt ("More info → Run anyway"); on macOS, right-click → Open the first
  time. For production, add signing/notarization (see Option D in the shipping
  discussion).
- The existing `Dockerfile` builds a **headless** image for servers/kiosks; it
  is not the employee-download path.
