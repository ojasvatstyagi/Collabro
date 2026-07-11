# End-to-end tests

A real browser (Chrome) drives the real frontend against the real backend. The backend runs on an **in-memory H2
database** and mails to a **local in-process SMTP sink**, so nothing touches your MySQL and no e-mail is sent.
The one-time codes the backend e-mails are read back from the sink, exactly as a user would read them.

```bash
cd e2e
npm install        # once: installs puppeteer-core (it uses your installed Chrome, it does not download one)
npm test           # starts everything, runs ~150 checks, stops everything. Exit code 0 = all passed
```

## Requirements

- Java 21 and Maven on the `PATH` (`MVN=./path/to/mvn` if yours is elsewhere; `MVN_ARGS=-o` runs Maven offline)
- Node 18+ and `npm install` done in `frontend/` (the dev server is started for you)
- Google Chrome or Chromium (`CHROME_PATH=/path/to/chrome` if it is not in a standard location)
- Ports **8080** (backend; the Vite dev server proxies `/api` there), **5173** (frontend) and **2525** (mail sink,
  override with `E2E_SMTP_PORT`) free. The runner refuses to start if one is taken.

It takes about two minutes. One check waits 11.5 s on purpose: refresh-token replay is only rejected after the
10-second grace window for concurrent tabs.

## What it covers

| # | Area | What is checked |
|---|------|-----------------|
| 1 | Registration and login (UI) | form, e-mailed code, verify page, login, redirect for signed-in users |
| 2 | Sessions | reload with an **expired access token** stays signed in; no redirect loop for visitors |
| 3 | Projects and public data | Remote/Open source flags round-trip, validation, page-size cap, sort whitelist, search without contact details |
| 4 | Join flow (UI) | Explore, details dialog, join, Requests page, "Add to team", Teams page, roles |
| 5 | Authorization | a non-member is refused on tasks, chat and files; assignee rules; file download rules; hostile file names; picture upload rules; path traversal |
| 6 | History and Achievements (UI) | timeline content, filters, stats, badge progress |
| 7 | Settings (UI) | change password, sign out, leave project, re-apply, delete account (wrong password refused), deleted member does not break the project |
| 8 | Rejection and deletion (UI) | re-apply after rejection, owner-only delete, stored files removed from disk |
| 9 | One-time codes | guess limit, burned codes, resend cooldown cannot be bypassed, no user enumeration, reset ends old sessions |
| 10 | Tokens | refresh rotation, replay detection, refresh token is not a Bearer token, logout revokes, 415/405 instead of 500 |

## Files

- `run.mjs`: starts the sink, backend and frontend, waits until they answer, runs the suite, always cleans up.
- `suite.mjs`: the checks. Add new ones inside `runSuite`, using `check(name, ok, detail)`; `step(...)` turns a
  thrown error into a failed check instead of aborting the run.
- `smtp-sink.mjs`: the in-memory mail server.
- Output: `logs/` (backend and frontend logs), `shots/` (screenshots of key pages), `results.json`. All git-ignored.

## Limits

- It exercises the application against H2 in MySQL mode, not MySQL itself. Dialect-specific behaviour (for
  example the `ddl-auto=update` changes on an existing database) needs a run against a real MySQL.
- The suite creates users `alice_e2e`, `bob_e2e`, ... in the throwaway database only.
