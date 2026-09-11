# Collabro: audit record

What a full code audit (2026-11) found, what was done about each item, what the end-to-end run uncovered later, and
what is still open. Read this before "fixing" something that looks wrong: it may be a deliberate decision (section 4),
and before assuming something is safe: check section 3 first. Architecture and rules are in [CONTEXT.md](CONTEXT.md).

Status: **Fixed** = changed and covered by a test (named). **Open** = known, not done. **Decision** = chosen on
purpose, see section 4.

## 1. Findings and their status

### Critical

| ID | Finding | Status | Where |
|---|---|---|---|
| C1 | Real DB/Gmail/JWT secrets committed in `application-dev.properties` | **Fixed**. Moved to gitignored `backend/.env`; secrets purged from all git history and force-pushed; the owner rotated them. Old clones and forks may still hold the old values. | `ConfigFilesTest` |
| C2 | JWT secret had a public hardcoded fallback | **Fixed**. No default; app refuses to start without `JWT_SECRET`. | `ConfigFilesTest` |
| C3 | Approving the first join request failed (team had no status/owner/members) | **Fixed** | `RequestServiceTest`, e2e §4 |
| C4 | `Profile` equals matched every profile, so membership checks/removals hit the wrong person | **Fixed** (equality by id) | `RequestServiceTest`, `ProjectServiceTest` |
| C5 | Tasks, files and chat open to any signed-in user (IDOR) | **Fixed** via `ProjectAccessService` | `ProjectAccessServiceTest`, `TaskServiceTest`, `ChatServiceTest`, `ProjectFileServiceTest`, e2e §5 |
| C6 | OTP account takeover: unlimited guesses, codes usable for the wrong purpose, no rate limit | **Fixed** (5 guesses, purpose-bound, constant-time compare, 60 s cooldown, one live code). The cooldown had a bypass found later, see E3. | `PasswordServiceTest`, e2e §9 |
| C7 | Refresh tokens never validated, plaintext, not rotated; refresh token usable as access token | **Fixed** (typed JWTs, hashed, rotated, replay detection) | `JwtTokenProviderTest`, `JwtAuthenticationFilterTest`, `RefreshTokenServiceTest`, e2e §10 |

### High

| Finding | Status | Where |
|---|---|---|
| Reload after the 15 min access token expired logged the user out (`/auth/me` excluded from refresh) | **Fixed** | `base.test.ts`, e2e §2 |
| Owner-only UI shown to everyone (`isOwner` hardcoded) | **Fixed** (username comparison) | e2e §5 |
| "Sign out" did not sign out; delete-account cleared the wrong storage | **Fixed** | `base.test.ts`, e2e §7 |
| Profile PDF export broken (wrong token key, undefined base URL) | **Fixed** | e2e §7 |
| Profile page substituted fake data / faked successful saves and uploads | **Fixed** | e2e |
| Public search queried a non-existent field, compared proficiency alphabetically, duplicated rows | **Fixed** | `ProfileSpecificationsTest` (real H2) |
| E-mail/phone leaked via public search, team lists, project creator | **Fixed** (`PublicProfileDto`) | `ProjectDtoJsonTest`, e2e §3-4 |
| `GET /requests/{id}` returned a raw JPA entity | **Fixed** (DTO) | `RequestServiceTest`, e2e §4 |
| Authorization/validation failures returned 500 | **Fixed** (403/400/409/413) | `GlobalExceptionHandlerTest` |
| Unvalidated sort field / unbounded page size | **Fixed** | `ProjectControllerTest`, `SecurityRulesIntegrationTest` |
| File handling: path traversal, unescaped download name, any file type as a picture, no size limits | **Fixed** | `FileStorageServiceTest`, e2e §5 |
| `isRemote` / `isOpenSource` were never saved (JSON names mismatch) | **Fixed** | `ProjectDtoJsonTest`, e2e §3 |
| Account deletion cascaded into projects/messages; deleted users made their projects unloadable | **Fixed** (soft delete, `@NotFound(IGNORE)`) | `AccountDeletionIntegrationTest` |
| Avatars returned as internal paths (chat, files, tasks, requests) | **Fixed** | `ChatServiceTest`, e2e §5 |
| No brute-force protection on login | **Fixed** (2026-11-23): sliding-window limits per username+address, per username and per address; `429` + `Retry-After`; the right password is refused while locked. Counted in the database since 2026-11-23 (next row). | `LoginThrottleTest`, `AuthControllerTest`, e2e §11 |
| The login throttle lived in the memory of one instance: each instance had its own counters (so N instances allowed N times the attempts) and a restart forgot them | **Fixed** (2026-11-23): the failures are rows in `login_failures` (Flyway V6), shared by every instance and surviving restarts; the daily cleanup deletes rows older than the window. Verified with two backends on one MySQL: 3 failures on one plus 2 on the other locked both, and the lock survived a restart. | `LoginThrottleTest` (real database, incl. two instances and an exact `Retry-After`), `AccountCleanupIntegrationTest`, e2e §11 |
| User enumeration at registration (duplicate e-mail message), plus account pre-hijacking and no way to resend a code | **Fixed** (2026-11-23): a known address is answered like a new one; a pending registration's credentials are replaced by the latest registrant; `resend-registration-otp`; password always hashed and mail async so timing is level. Usernames stay visible on purpose (they are public). | `AuthControllerTest`, `PasswordServiceTest`, `EmailServiceTest`, `auth.test.ts`, e2e §12 |
| Never-verified registrations were kept forever (each held its username and e-mail, so a script could squat names) | **Fixed** (2026-11-23): a scheduled job really deletes them after 7 days (configurable), plus long-expired one-time codes. New column `users.created_at` (Flyway V2, existing rows backfilled with the migration time). | `AccountCleanupIntegrationTest`, `AccountCleanupJobTest`, `AccountCleanupSchedulingTest`, e2e §14 |
| A user who deleted their own account could never register the same username or e-mail again (409: the soft-deleted row kept the unique columns) | **Fixed** (2026-11-23): deletion renames the row to an id-derived placeholder and drops its codes; Flyway V3 does the same for accounts deleted earlier. Verified on MySQL against a database holding already-locked names. | `AccountServiceTest`, `AccountDeletionIntegrationTest`, e2e §15 |
| A deleted account's profile kept everything the person had entered (and teammates still saw the real name, bio and skills of a deleted member; the picture file stayed on disk and stayed served) | **Fixed** (2026-11-23): deletion blanks the profile (`Profile.erasePersonalData`), deletes the picture file and keeps the row for the project data that points at it. Flyway V4 does the same for profiles already deleted; their picture files are removed by the daily cleanup. Verified on MySQL against a database holding deleted profiles with data. What the person *contributed* to a project (messages, tasks, uploaded files, join-request texts) is kept on purpose. | `AccountServiceTest`, `AccountDeletionIntegrationTest`, `AccountCleanupIntegrationTest`, e2e §7 |
| History and Achievements loaded everything on every request (all projects, requests with their requesters' skills, tasks and files as entities, filtered, sorted and paged in Java, twice per History page view: list and stats; Achievements loaded every owned project, joined project, team and task just to count them) | **Fixed** (2026-11-23): Achievements use count queries only; History filters, orders, counts and limits in SQL per kind of event and merges only the rows a page needs. Measured on a busy account: 88 queries for the badges against 8 now; a page of history or the stats cost the same number of queries for a quiet and a busy account. Verified on MySQL. **Behaviour change:** History search matches what people wrote, no longer the labels the timeline adds (searching "created" or "uploaded" used to match every such event). | `HistoryServiceTest` (real database), `AchievementIntegrationTest`, e2e §16 |
| A task could never be given to the project's owner (the assignee lists held only the team, who exclude the owner), and one that was assigned to them showed as "Unassigned" in the edit form, where saving could silently clear it | **Fixed** (2026-11-23): the owner is listed first (`assigneeOptions`) in the create and edit forms. | `people.test.ts`, e2e §17 |
| New profiles were named "New User" (the columns are NOT NULL), shown everywhere and counted as filled in for the profile-completion score | **Fixed** (2026-11-23): new profiles have empty names and are shown by username (`Profile.displayName()` on the server, `utils/people.ts` in the UI); Flyway V5 clears the placeholder on existing profiles (a real "New Person" is untouched). | `ProfileDisplayNameTest`, `ProfileServiceTest`, `people.test.ts`, e2e §17 |
| No way to look at another person's profile (the "View profile" link had been removed because its route never existed) | **Fixed** (2026-11-23): `GET /api/profile/users/{username}` and a `/users/:username` page, linked from the Requests page, team lists and project creators. Public fields only. | `SecurityRulesIntegrationTest`, `ProfileControllerTest`, `profile.test.ts`, e2e §17 |
| The project workspace crashed (blank page) for a project with no level, and the Tasks tab for a task with no description: both are allowed by the API, the UI form just never sends them empty | **Fixed** (found by the e2e run, 2026-11-23): the types now say `null`, which also exposed three more places that assumed otherwise | e2e §17 |

### Medium and low

| Finding | Status |
|---|---|
| Missing validation on project/task/chat/social-link input | **Fixed** (`ProjectControllerTest`, `ChatControllerTest`, `SocialLinkControllerTest`) |
| Re-request impossible after rejection or leaving; no uniqueness on (project, requester) | **Fixed** (unique key + replace finished request) |
| N+1 on request lists | **Fixed** (`@EntityGraph`, `RequestRepositoryQueryCountTest`). |
| N+1 on the other lists (project `technologies`, request requesters' skills, project creators) and every list unbounded | **Fixed** (2026-11-23): measured 28 queries for a page of 25 against 6 for a page of 3; now constant. Lists are paged in the database with a 200-row ceiling (see CONTEXT.md section 5). | `ListPagingRepositoryTest`, `ListEndpointsPagingTest`, `paging.test.ts`, e2e §13 |
| Frontend interceptor: hung queued requests, retry loops, hard redirect | **Fixed** (`base.test.ts`) |
| Workspace actions failed silently; chat polling hammered a failing server; downloads sent no auth | **Fixed** |
| Class-level `@CrossOrigin("*")` bypassed the CORS allow-list | **Fixed** |
| Cookie `Secure`/`SameSite` guessed from the request | **Fixed** (configuration; `AuthControllerTest`) |
| `Requests` page never listed anything (response unwrapped twice) | **Fixed** (`requests.test.ts`), see E1 |
| ~39 `any` types, unused code, mock-only pages and API modules | **Fixed** (ESLint clean, build type-checks) |
| Dead entities `Post`/`Review`/`Notification`, unused Mongo dependency, unused e-mails/DTOs | **Removed** |
| E-mail send failures are only logged (registration "succeeds" with no code sent) | **Open**, and now also asynchronous. Mitigated by the Resend button; a failing SMTP server is only visible in the log. |
| 401/403 JSON bodies were built by string concatenation (an exception message with a quote or backslash made invalid JSON) and echoed Spring's internal wording | **Fixed** (2026-11-23): both handlers serialize with Jackson and send fixed messages (`Authentication is required`, `You do not have permission to do that`). `SecurityErrorHandlersTest`, `SecurityRulesIntegrationTest`, e2e §10 |
| No frontend component tests (only the API client and helpers were unit tested; the UI was covered by e2e alone) | **Fixed** (2026-11-23): React Testing Library with jest-dom; 68 component tests for ProtectedRoute, AuthProvider (session expiry), Login (validation, trimming, the 429 lock-out message), VerifyRegistration (resend cooldown), UserProfile, Requests, Teams, ProjectWorkspace and EditTaskModal (owner assignee). Each was mutation-checked by re-introducing the bug it guards. | `*.test.tsx` |
| Outdated dependencies: iText 5 (AGPL, unmaintained), three mixed-major tsparticles packages, old lucide-react; and `npm audit` reported 8 vulnerabilities (2 critical, 1 high) | **Fixed** (2026-11-23): iText -> OpenPDF 3.0.6 (LGPL/MPL; the PDF test now parses the output); Spring Boot 3.4.3 -> 3.5.16, jjwt 0.13.0, ModelMapper 3.2.8, springdoc 2.8.17, Lombok and the compiler plugin follow Boot's managed versions; tsparticles -> one consistent v4 (and the unused `tsparticles` package removed); lucide-react 0.344 -> 1.79; react-router-dom 6 -> 7 (an open-redirect advisory in `<Link>`/`useNavigate`, the only one in shipped code); Vite 8, Vitest 5, jsdom, jest-dom and the ESLint family. `npm audit`: **0 vulnerabilities**. e2e 254/254 on H2 and on a Flyway-built MySQL. | `ProfileServiceTest` (PDF), `ParticleBackground.test.tsx`, e2e §1 (a canvas is drawn) |
| The "Verify your email" page was unreadable in dark mode (black text on a dark card, the heading invisible in both themes): it used shadcn/ui colour names (`text-muted-foreground`, `bg-background`, `text-destructive`) and `brand-primary`/`brand-secondary`, none of which exist in this project's Tailwind config, and Tailwind silently drops unknown classes | **Fixed** (2026-11-24, reported by the owner): the page is rebuilt on `AuthLayout` with the project's palette and `dark:` variants; checked in screenshots in both themes and both states (form, "Verified!"). A test now fails on any colour class the config does not define. | `themeTokens.test.ts` (mutation-checked), `VerifyRegistration.test.tsx` |
| The API description (Swagger UI, `/v3/api-docs`) was open to anonymous visitors in every profile (only prod switched springdoc off, and the default profile is dev) | **Fixed** (2026-11-23): it is public only when `app.docs.public=true` (dev sets it), otherwise it needs a login. | `SecurityRulesIntegrationTest`, `DocsPublicSecurityTest`, `ConfigFilesTest` |
| **Swagger did not work at all**: springdoc 2.5.0 predates Spring Framework 6.2 (Spring Boot 3.4), so every API description request failed with `NoSuchMethodError: ControllerAdviceBean.<init>` (found while testing the access rule) | **Fixed** (2026-11-23): springdoc 2.8.4. The tests now assert the description is served (200 with an `openapi` field) and e2e §10 loads it from the real stack. | `DocsPublicSecurityTest`, e2e §10 |

## 2. Features that were mock-only and are now real

Teams ("my teams", derived from projects), History (computed), Achievements (14 computed badges), Settings
(change password, password-checked delete account), project delete and leave. All have backend tests and e2e coverage.
Not built on purpose: team invite codes/roles, 2FA, data export, leaderboards, a persisted activity log (section 4).

## 3. Found by running the real stack (end-to-end run, 2026-11-23)

Unit tests were all green when these were found, which is why the e2e suite exists.

| ID | What | Fix |
|---|---|---|
| E1 | The Requests page showed nothing, ever: `requests.ts` unwrapped `{data}` a second time. Owners could not approve or reject from the UI. Pre-existing. | `requests.ts`; `requests.test.ts` uses the real envelope |
| E2 | `.env` was never read: `spring-dotenv` 2.x silently does nothing on Spring Boot 3. Following the README would have failed at startup. | `spring.config.import=optional:file:./.env[.properties]`; dependency removed; `ConfigFilesTest` |
| E3 | The OTP resend cooldown only looked at the newest *unused* code, so burning a code (5 wrong guesses) allowed an immediate new code with 5 more guesses, unlimited, plus e-mail spam. | Cooldown measured from the newest code of any state; `PasswordServiceTest` |
| E4 | The uploaded file's *displayed* name was the client's raw string (`../../x<script>.txt`) though the stored path was sanitised. | `ProjectFileService` stores the sanitised name |
| E5 | A malformed id in a URL (`/api/tasks/undefined`) was a 500. | `MethodArgumentTypeMismatchException` -> 400 |
| E6 | The e2e script's own mistakes (matching the "APPROVED" filter tab instead of the action button, wrong button label) looked like product bugs; always read the screenshot before blaming the app. | n/a |

## 4. Decisions (do not undo without a reason)

- **Registering with an already-verified address sends the owner nothing** (no "someone tried to register" notice): it would let strangers send mail to anyone. The verify page tells people without a code to log in or reset their password instead.
- **Teams are derived, not an entity of their own**: a team is a project's member group. No invite codes or roles.
- **History and Achievements are computed on read** (in SQL, see CONTEXT.md). Nothing is stored, so they cannot disagree with the data, but
  there is also no "date earned" and no history of deleted things. A persisted log would only record from then on.
- **Account deletion is a soft delete** (user and profile `deletedAt`), never `userRepository.delete`. The row is renamed to a placeholder derived from its id so the username and e-mail can be registered again (the columns are unique). Only never-verified accounts are really deleted (AccountCleanupService).
- **`PUT /projects/{id}` is a full replace**, protected by validation (blank title and team size < 1 are rejected).
  Partial update was not added because `teamSize` and the flags are primitives.
- **Wrong password on an authenticated endpoint is 400**, because the frontend signs the user out on 401.
- **`ROLE_ADMIN` and `@EnableMethodSecurity` are reserved**: seeded but not used.
- **Flyway runs in prod only** (2026-11-23). Dev and tests keep Hibernate-built schemas so day-to-day work needs no
  migration for every experiment; `MigrationsTest` is what stops the two from drifting apart.
- **List endpoints keep returning arrays** (changing the shape would break the frontend). They are paged through
  optional `page`/`size` parameters and headers instead, and the frontend fetches every page, so the UI still shows
  everything. The gain is bounded work per request, not less data in the browser: a user with thousands of rows would
  still load them all (add real paging to that page's UI if it ever happens).
- **Chat polls** (5 s, backoff); WebSockets are on the roadmap, not built.
- **The access token lives in `localStorage`** (readable by injected script). Accepted design; the refresh token is
  HttpOnly. There is no CSP.
- **H2 for tests and the default e2e run, not MySQL**, so the owner's database is never touched. MySQL runs use a
  throwaway server (`e2e/README.md`).

## 5. Open items, roughly by importance

1. **MySQL: mostly verified, two gaps** (2026-11-23, MySQL 26.10 on a throwaway server). The full e2e suite (159/159)
   passes against MySQL, and the app boots with the **prod profile** (`ddl-auto=validate`) against the schema
   Hibernate created, so entities and tables agree; the unique key `uk_request_project_profile` and the nullable
   `profiles.user_id` are present on a fresh schema. Not covered: (a) **upgrading an existing database**: the unique key
   on `requests(project_id, profile_id)` will not apply if duplicate rows exist (Hibernate only logs it), and an old
   `profiles.user_id` stays `NOT NULL` there; (b) **case-sensitive table names**: the test server ran on macOS
   (`lower_case_table_names=2`), Linux production defaults to `0`, so a table-name case mismatch would only show there.
2. **First deploy of Flyway onto an existing database** (the baseline is *assumed*, not checked). Flyway marks a
   pre-existing schema as V1 without comparing it; Hibernate's `validate` then catches missing columns and wrong types,
   but **not** the two differences listed under item 1 (unique key, nullability). Before the first prod start against an
   old database, run:
   ```sql
   select project_id, profile_id, count(*) from requests group by 1,2 having count(*) > 1;  -- must return nothing
   show index from requests;                      -- uk_request_project_profile must exist, else:
   --   alter table requests add unique key uk_request_project_profile (project_id, profile_id);
   alter table profiles modify user_id binary(16) null;                                      -- harmless if already null
   ```
   Take a backup first. Verified on MySQL: an empty database gets V1 applied, a Hibernate-built one is baselined,
   both pass `validate`, and the e2e suite (159/159) passes on a Flyway-built schema.
3. **Major upgrades deliberately not taken** (each is a migration, not a version bump; nothing is vulnerable): Spring Boot 4 (Spring Framework 7), React 19, Tailwind 4 (config and class changes; also unlocks tailwind-merge 3), TypeScript 7, and the React Compiler lint rules (20 findings, see CONTEXT.md section 9) if the Compiler is ever adopted.
4. **Login throttling counts per client address, and behind a reverse proxy every user shares the proxy's address**: set `server.forward-headers-strategy` in production (see CONTEXT.md section 6), and only when the proxy overwrites `X-Forwarded-For`. Two instances answering at the same instant can each let one extra attempt through (the check and the insert are not one atomic step); the limits are small enough for that not to matter.

## 6. How to verify a change

```bash
cd backend  && mvn test                          # 403 tests
cd frontend && npm test && npm run lint && npm run build
cd e2e      && npm install && npm test           # ~250 checks, ~4.5 min, needs Chrome and free ports 8080/5173/2525
```

When fixing a bug, add a test that fails on the old code (revert the fix, watch it fail, restore). Several of the
bugs above were invisible to green unit tests and only the e2e run exposed them: if the change touches request
handling, auth or the UI wiring, run the e2e suite.
