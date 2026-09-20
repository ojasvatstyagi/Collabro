# Working in Collabro

Spring Boot 3.5 (Java 21) backend in `backend/`, React 18 + TypeScript + Vite frontend in `frontend/`, browser
end-to-end suite in `e2e/`.

**Read these first, they save a lot of time:**

- [`docs/CONTEXT.md`](docs/CONTEXT.md): architecture, data model, where each rule lives, auth design, conventions and
  the traps that are easy to fall into.
- [`docs/AUDIT.md`](docs/AUDIT.md): what was found and fixed, what is still open, and the decisions that were made on
  purpose (do not undo them without a reason).

## Commands

```bash
cd backend  && mvn test                      # JDK 21 required (Lombok breaks on newer JDKs); ~405 tests, H2, no credentials
cd frontend && npm test && npm run lint && npm run build     # build type-checks first
cd e2e      && npm install && npm test       # real Chrome + real backend (H2) + frontend; ~277 checks, ~5 min; needs ports 8080/5173/2525
cd e2e      && npm run serve                 # the same stack left running for use by hand: http://localhost:5173, e-mailed codes printed in the terminal
```

CI (`.github/workflows/ci.yml`) runs the three suites on every push to `main` and every pull request: backend, frontend
(lint, tests, build), then e2e. Keep them green; a failed e2e run uploads its logs and screenshots as an artifact.

Run the e2e suite when a change touches request handling, authentication, API response shapes or UI wiring: several
real bugs were invisible to green unit tests and only showed up there.

## Rules for changes

- **Do not add co-author or tool-attribution lines to commits.** Use the repository's configured git identity.
- Prefer small themed commits that each leave the build green. Never commit `.env` or any secret.
- Add a test with every fix, and check it fails on the old code before keeping it.
- Do not start the app against the developer's real MySQL to try something; use the e2e stack (`npm run serve`) or a throwaway database.
- Never return `ProfileDto` (e-mail, phone, settings) to another user: use `PublicProfileDto`.
- Membership checks go through `ProjectAccessService`; users are soft-deleted, never `userRepository.delete`.
- Frontend: API methods return `this.get<T>()` directly (the client already unwraps `{data}`); show errors with
  `errorMessage` + `toast.error`; no `any`; keep ESLint clean.
- Wrong-password style errors are 400, not 401 (the frontend signs the user out on 401).

## Environment notes

- Secrets come from `backend/.env` (gitignored, template `.env.example`) via `spring.config.import`.
- The original author's Maven and npm run through an internal Artifactory mirror whose token expires (a sudden `401`
  while resolving dependencies means refresh the token; `mvn -o` works from the local cache).
- `mvnw` is not executable and downloads Maven; use a local `mvn`.
