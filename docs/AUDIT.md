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
| No brute-force protection on login | **Fixed** (2026-11-23): sliding-window limits per username+address, per username and per address; `429` + `Retry-After`; the right password is refused while locked. In memory, see section 5 for the limits. | `LoginThrottleTest`, `AuthControllerTest`, e2e §11 |
| User enumeration at registration (duplicate e-mail message), plus account pre-hijacking and no way to resend a code | **Fixed** (2026-11-23): a known address is answered like a new one; a pending registration's credentials are replaced by the latest registrant; `resend-registration-otp`; password always hashed and mail async so timing is level. Usernames stay visible on purpose (they are public). | `AuthControllerTest`, `PasswordServiceTest`, `EmailServiceTest`, `auth.test.ts`, e2e §12 |
| Never-verified registrations were kept forever (each held its username and e-mail, so a script could squat names) | **Fixed** (2026-11-23): a scheduled job really deletes them after 7 days (configurable), plus long-expired one-time codes. New column `users.created_at` (Flyway V2, existing rows backfilled with the migration time). | `AccountCleanupIntegrationTest`, `AccountCleanupJobTest`, `AccountCleanupSchedulingTest`, e2e §14 |

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
| 401/403 JSON bodies are built by string concatenation (unescaped message) in `CustomAuthenticationEntryPoint` / `CustomAccessDeniedHandler` | **Open** |

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
- **History and Achievements are computed on read.** Nothing is stored, so they cannot disagree with the data, but
  there is also no "date earned" and no history of deleted things. A persisted log would only record from then on.
- **Account deletion is a soft delete** (user and profile `deletedAt`), never `userRepository.delete`.
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
3. **A user who deletes their own account cannot register the same username or e-mail again.** The deletion is a soft delete, the app then treats the name as free, but the unique column still holds it, so signing up fails with a `409` (checked with a throwaway test, 2026-11-23). Fix idea: on deletion rename the row (`deleted-<id>`, anonymised e-mail) so the original can be reused while projects and messages keep resolving.
4. **History and Achievements read everything on every request**: they are computed from full scans of the user's projects, requests and tasks (`HistoryService`, `AchievementService`), and only the *output* of history is paged. Fine for normal accounts; the cost grows with the account's activity.  Also unpaged: `matching/similar` and `/complementary` (limited by their queries), the project team (bounded by team size) and a user's own skills/social links.
5. **EditTaskModal cannot assign tasks to the project owner** (its list is the team members, who exclude the owner; the
   backend accepts the owner).
6. **New profiles are named "New User"** (a placeholder because the columns are `NOT NULL`), shown everywhere until
   the user edits their profile. Showing the username instead would be better.
7. **No public profile page** (the "View profile" link on requests was removed because the route never existed).
8. 401/403 body escaping (section 1, last row).
9. Dependencies: iText 5 (AGPL, old), three mixed-major tsparticles packages, old lucide-react.
10. Frontend component tests (React Testing Library) do not exist; the e2e suite covers the UI end to end.
11. Swagger UI is public in the dev profile.
12. **Login throttling is per instance and in memory** (resets on restart; behind a proxy it needs `server.forward-headers-strategy`, see CONTEXT.md section 6). Move it to a shared store before running more than one instance.

## 6. How to verify a change

```bash
cd backend  && mvn test                          # 347 tests
cd frontend && npm test && npm run lint && npm run build
cd e2e      && npm install && npm test           # ~200 checks, ~3.5 min, needs Chrome and free ports 8080/5173/2525
```

When fixing a bug, add a test that fails on the old code (revert the fix, watch it fail, restore). Several of the
bugs above were invisible to green unit tests and only the e2e run exposed them: if the change touches request
handling, auth or the UI wiring, run the e2e suite.
