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
| User enumeration at registration (duplicate username/e-mail messages) | **Open** (login timing leak fixed) | n/a |

### Medium and low

| Finding | Status |
|---|---|
| Missing validation on project/task/chat/social-link input | **Fixed** (`ProjectControllerTest`, `ChatControllerTest`, `SocialLinkControllerTest`) |
| Re-request impossible after rejection or leaving; no uniqueness on (project, requester) | **Fixed** (unique key + replace finished request) |
| N+1 on request lists | **Fixed** (`@EntityGraph`, `RequestRepositoryQueryCountTest`). Other lists were not measured. |
| Frontend interceptor: hung queued requests, retry loops, hard redirect | **Fixed** (`base.test.ts`) |
| Workspace actions failed silently; chat polling hammered a failing server; downloads sent no auth | **Fixed** |
| Class-level `@CrossOrigin("*")` bypassed the CORS allow-list | **Fixed** |
| Cookie `Secure`/`SameSite` guessed from the request | **Fixed** (configuration; `AuthControllerTest`) |
| `Requests` page never listed anything (response unwrapped twice) | **Fixed** (`requests.test.ts`), see E1 |
| ~39 `any` types, unused code, mock-only pages and API modules | **Fixed** (ESLint clean, build type-checks) |
| Dead entities `Post`/`Review`/`Notification`, unused Mongo dependency, unused e-mails/DTOs | **Removed** |
| E-mail send failures are only logged (registration "succeeds" with no code sent) | **Open** |
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

- **Teams are derived, not an entity of their own**: a team is a project's member group. No invite codes or roles.
- **History and Achievements are computed on read.** Nothing is stored, so they cannot disagree with the data, but
  there is also no "date earned" and no history of deleted things. A persisted log would only record from then on.
- **Account deletion is a soft delete** (user and profile `deletedAt`), never `userRepository.delete`.
- **`PUT /projects/{id}` is a full replace**, protected by validation (blank title and team size < 1 are rejected).
  Partial update was not added because `teamSize` and the flags are primitives.
- **Wrong password on an authenticated endpoint is 400**, because the frontend signs the user out on 401.
- **`ROLE_ADMIN` and `@EnableMethodSecurity` are reserved**: seeded but not used.
- **No Flyway.** The prod profile validates the schema; writing a baseline migration that could not be tested on MySQL
  was judged worse than none.
- **List endpoints are not paginated** (requests, my projects, tasks, files): changing the response shape would break
  the frontend. Only the project browse, chat, history and public search are paged.
- **Chat polls** (5 s, backoff); WebSockets are on the roadmap, not built.
- **The access token lives in `localStorage`** (readable by injected script). Accepted design; the refresh token is
  HttpOnly. There is no CSP.
- **H2 for tests and e2e, not MySQL**, so the owner's database is never touched.

## 5. Open items, roughly by importance

1. **No brute-force protection on login** (only one-time codes are limited). Add per-user/IP throttling.
2. **Run the app once against a real MySQL.** Only H2 (MySQL mode) has been exercised. On an existing database: the new
   unique key on `requests(project_id, profile_id)` will not apply if duplicates exist (Hibernate only logs it), and
   `profiles.user_id` stays `NOT NULL` there (only new schemas get the relaxed column), which does not matter for
   behaviour but differs from the entity.
3. **Schema migrations** (Flyway/Liquibase) before a real production deployment.
4. **Registration enumeration**, and **no way to resend a registration code** (and e-mail failures are invisible).
5. **Pagination** of the remaining list endpoints, and measuring N+1 on them.
6. **EditTaskModal cannot assign tasks to the project owner** (its list is the team members, who exclude the owner; the
   backend accepts the owner).
7. **New profiles are named "New User"** (a placeholder because the columns are `NOT NULL`), shown everywhere until
   the user edits their profile. Showing the username instead would be better.
8. **No public profile page** (the "View profile" link on requests was removed because the route never existed).
9. 401/403 body escaping (section 1, last row).
10. Dependencies: iText 5 (AGPL, old), three mixed-major tsparticles packages, old lucide-react.
11. Frontend component tests (React Testing Library) do not exist; the e2e suite covers the UI end to end.
12. Swagger UI is public in the dev profile.

## 6. How to verify a change

```bash
cd backend  && mvn test                          # 286 tests
cd frontend && npm test && npm run lint && npm run build
cd e2e      && npm install && npm test           # ~150 checks, ~2 min, needs Chrome and free ports 8080/5173/2525
```

When fixing a bug, add a test that fails on the old code (revert the fix, watch it fail, restore). Several of the
bugs above were invisible to green unit tests and only the e2e run exposed them: if the change touches request
handling, auth or the UI wiring, run the e2e suite.
