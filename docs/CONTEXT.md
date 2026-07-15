# Collabro: context map

A reference for anyone (human or AI session) changing this repository. It describes how the system fits together,
where things live, and the non-obvious rules that are easy to break. For what was found and fixed, and what is still
open, see [AUDIT.md](AUDIT.md). For setup and running, see the root [README](../README.md).

Last verified against the code: 2026-11-23 (backend 305 tests, frontend 32 tests, e2e 159 checks, all passing).

## 1. What it is

A project-collaboration platform. People post project ideas, others find them and ask to join, the owner approves,
and the approved people form the project's team, which gets tasks, chat and file sharing.

```
Browser ── React SPA (Vite dev server :5173) ──/api proxy──> Spring Boot REST API (:8080) ──> MySQL
                │                                                  │
                │  access token (JS memory + localStorage)         ├─ local disk (uploads)
                └─ refresh token (HttpOnly cookie)                 └─ SMTP (Gmail) for one-time codes
```

| Layer | Stack |
|---|---|
| Backend | Java **21**, Spring Boot 3.4.3, Spring Security (stateless JWT), Spring Data JPA/Hibernate, MySQL, jjwt 0.12.5, springdoc, ModelMapper, Lombok, iText 5 (PDF export), Maven |
| Frontend | React 18, TypeScript (strict), Vite 5, Tailwind 3, react-router 6, axios, react-hot-toast, lucide-react |
| Tests | JUnit 5 + Mockito + `@DataJpaTest`/`@SpringBootTest` on **H2** (backend); Vitest + jsdom (frontend); Puppeteer + real Chrome (`e2e/`) |

## 2. Repository map

```
backend/src/main/java/com/example/backend/
  BackendApplication.java        entry point
  configuration/                 SecurityConfig, PagingConfig (page-size caps), DataInitializer (seeds roles), AppConfig
  controllers/                   thin REST controllers, one per area (see section 5)
  services/                      all business rules (see section 4)
  models/                        JPA entities
  repositories/                  Spring Data interfaces (+ @EntityGraph where lists would otherwise N+1)
  specifications/                dynamic queries (profile search, project filters)
  dto/                           request/response objects
  security/                      JwtTokenProvider, JwtAuthenticationFilter, TokenHasher
  exceptions/                    GlobalExceptionHandler maps exceptions to 400/403/404/409/413/500
  enums/, utils/ (EmailTemplates)
backend/src/main/resources/      application.properties, application-dev.properties, application-prod.properties
backend/src/test/                unit + slice + integration tests; src/test/resources/application.properties = test config
frontend/src/
  App.tsx, main.tsx              routing and providers (AuthProvider, ThemeProvider, <Toaster/>)
  pages/                         one file per route
  components/{auth,layout,post-idea,ui,workspace}/
  context/                       AuthContext (user + session), ThemeContext
  services/api/                  base.ts (axios client + BaseApi) and one module per backend area
  services/tokenService.ts       access token storage
  utils/                         errors.ts (errorMessage, parseFieldErrors), download.ts (saveBlob), cn, helper, lists, validation
  test/setup.ts                  vitest setup (in-memory localStorage, Blob.text polyfill)
e2e/                             end-to-end suite (own README)
docs/                            this file and AUDIT.md
```

## 3. Data model

```
User 1─1 Profile ─┬─* Skill *─1 SkillDefinition
   │              ├─* SocialLink
   │              └─* Project (created) ──┬─* Task (assignedTo Profile)
   ├─* RefreshToken                       ├─* ChatMessage (sender Profile)   [not mapped from Project: deleted explicitly]
   └─1 Role                               ├─* ProjectFile (uploadedBy Profile)
PasswordToken (email, OTP, type)          ├─* CollaborationRequest (requester Profile, status) [unique per project+person]
                                          └─0..1 Team ─* members (Profile)   [owner is NOT in members]
```

Rules that matter:

- **A Team is the member group of exactly one Project.** It is created automatically when the owner approves the
  first join request (`RequestService.addRequesterToTeam`). `team.members` never contains the owner; the owner is
  `project.createdBy`. "Is this person on the project" is always `ProjectAccessService.isMember` (owner OR member).
- **`Profile` equality is by `id`** (`@EqualsAndHashCode.Include`). Membership checks use `List.contains`; without
  this every profile equalled every other one.
- **Users are soft-deleted** by setting `deletedAt` (`AccountService.deleteAccount`); never call
  `userRepository.delete(user)`: `User.profile` cascades `ALL`, so it would hard-delete the profile and, through
  it, projects, tasks and messages. `User` has `@SQLRestriction("deleted_at IS NULL")`, so a deleted user vanishes from
  queries; `Profile.user` is `@NotFound(IGNORE)` and its column is intentionally **not** `nullable=false` (that forces
  an inner join and makes the profile, and everything it owns, unloadable). Use `profile.displayUsername()` when a
  name is needed ("deleted user" placeholder).
- Soft-deleted profiles are excluded from search and suggestions (`deletedAt IS NULL`).
- `ddl-auto=update` in development creates/changes tables. Production uses `validate` and there is **no migration
  tool yet** (see AUDIT.md).

## 4. Backend services (where each rule lives)

| Service | Responsibility |
|---|---|
| `ProjectAccessService` | The single definition of "owner" and "member". Used by tasks, files, chat. |
| `RequestService` | Join requests: create (re-apply allowed after rejection/leaving), approve (creates the team), reject, cancel, stats. |
| `ProjectService` | Project CRUD, `leaveProject`, `deleteProject` (removes chat, files on disk, requests, team), team listing. |
| `TaskService`, `ChatService`, `ProjectFileService` | Membership-gated; assignee must be a member; files deletable by uploader or owner. |
| `TeamService` | "My teams": teams the user owns or belongs to (derived, nothing stored). |
| `HistoryService` | Activity timeline **computed on read** from projects, requests, tasks, files. No history table. |
| `AchievementService` | 14 badges in `CATALOG`, **computed on read** from the same data. Adding a badge = adding a `Badge` + a metric. |
| `MatchingService` | Public search (`ProfileSpecifications`), similar/complementary suggestions (capped at 50). |
| `ProfileService` | Own profile, `toPublicDto` (what others may see), PDF export, `publicPictureUrl`. |
| `FileStorageService` | All disk access. Every path is resolved inside the upload dir; names sanitised; pictures verified by magic bytes. |
| `PasswordService` | One-time codes: 6 digits, 10 min life, 5 wrong guesses burn the code, 60 s resend cooldown (measured from the newest code **even if burned**), constant-time compare, purpose-bound, reset ends sessions. |
| `LoginThrottle` | Failed-login limiter, in memory, sliding 15 min window: 5 per username+address, 20 per username, 30 per address. Checked **before** the password, so a locked client is refused even with the right one (no oracle); unknown usernames count the same; refused requests are not counted (no extending the lock); success clears only the username+address pair. Over the limit: `429` + `Retry-After` (`TooManyRequestsException`). |
| `RefreshTokenService` | Single-use refresh tokens: stored as SHA-256, rotated on every use, replay of a rotated token ends the session; 10 s grace for concurrent tabs. |
| `AccountService` | Change password (400 on wrong password, not 401, see below), delete account (password re-check, soft delete). |
| `EmailService` | HTML mail via `JavaMailSender`; failures are logged, never thrown. |

## 5. API surface

Base path `/api`. Everything requires a Bearer access token **except**: `/api/auth/**` (with
`PUT /api/auth/change-password` explicitly authenticated, rule ordered before the permitAll), `GET /api/matching/search`,
`GET /api/profile/skills/search`, `GET /api/profile/picture/{file}`, and the swagger paths (disabled in prod).

| Area | Endpoints |
|---|---|
| Auth | `POST register, login, refresh, logout, forgot-password, verify-otp, reset-password, verify-registration-otp`; `GET me`; `PUT change-password` |
| Profile | `GET/PUT/DELETE /profile/me` (DELETE needs `{password}`), `GET /profile/status`, `GET /profile/export` (PDF), skills (`/profile/skills[/{id}]`, `/search`), social links (`/profile/social-links[/{id}]`), picture (`/profile/picture`) |
| Projects | `GET/POST /projects`, `GET/PUT/DELETE /projects/{id}`, `GET /projects/me`, `/joined`, `/user/{profileId}`, `POST /{id}/join`, `POST /{id}/leave`, `GET /{id}/team`, `DELETE /{id}/team/{memberProfileId}` |
| Tasks | `GET/POST /projects/{id}/tasks`, `PATCH/DELETE /tasks/{id}` |
| Chat | `GET/POST /projects/{id}/messages` |
| Files | `POST/GET /projects/{id}/files`, `DELETE /project-files/{id}`, `GET /project-files/{id}/download` |
| Requests | `POST /requests/join/{projectId}`, `GET /requests/received`, `/sent`, `/stats`, `GET /requests/{id}`, `POST /{id}/approve`, `POST /{id}/reject`, `DELETE /{id}` (cancel) |
| Teams / History / Achievements | `GET /teams/me`, `GET /history` (`type,timeframe,search,page,size`), `GET /history/stats`, `GET /achievements/me` |
| Matching | `GET /matching/search` (public), `/similar`, `/complementary` |

Conventions:

- **Never return `ProfileDto` (has e-mail, phone, settings) to anyone but its owner.** Others get `PublicProfileDto`.
  Project creators expose no e-mail.
- Errors are plain-text bodies (`GlobalExceptionHandler`): validation `400` ("field: message, field2: message"),
  `403` forbidden, `404`, `409` conflict, `413` upload too large, `429` too many failed logins (with `Retry-After`), `500` generic. Malformed ids and unknown sort
  fields are `400`.
- Wrong-password style failures on authenticated endpoints are **400, never 401**: the frontend treats 401 as "session
  expired" and signs the user out.
- Boolean DTO fields that must serialise as `isX` use `@JsonProperty("isX")` on a field named `x` (Lombok/Jackson
  would otherwise publish `x`): `ProjectDto`, `UserDto`, `ProfileDto`, `AchievementDto`.
- Page size is capped at 50 by `PagingConfig` (code, not properties: the test config replaces `application.properties`).
  Sort fields for projects are whitelisted in `ProjectController`.
- Avatars in any DTO must go through `ProfileService.publicPictureUrl(...)` (the stored value is an internal path).

## 6. Authentication and sessions

```
login ─> access JWT (15 min, in the JSON body) + refresh JWT (7 d, HttpOnly cookie "refreshToken", SHA-256 in DB)
request ─> Authorization: Bearer <access>      (JwtAuthenticationFilter accepts type=access only)
401 ─> frontend refreshes ONCE (shared by concurrent requests) via POST /auth/refresh (cookie) ─> retries the request
refresh ─> new access + NEW refresh cookie (old one stays valid 10 s for concurrent tabs, then replay = session ends)
```

- Both token kinds carry a `type` claim and a `jti`; a refresh token is rejected as a Bearer token.
- One refresh row per user: logging in elsewhere replaces it.
- Frontend: `services/api/base.ts` owns refresh. It excludes only the *public* auth endpoints from refresh (login,
  register, refresh, logout, forgot/verify/reset), so `/auth/me` and `/auth/change-password` do refresh. When refresh
  fails it clears the token and dispatches `SESSION_EXPIRED_EVENT`; `AuthContext` drops the user and the route guard
  redirects. **Do not hard-redirect with `window.location`** (it loops for visitors without a session).
- Cookie `Secure`/`SameSite` come from `jwt.cookie.*` properties (prod sets `secure=true`).
- Login throttling keys on `request.getRemoteAddr()`. **Behind a reverse proxy every user shares the proxy's address**, so
  the 30-per-address limit would lock everyone out together: set `server.forward-headers-strategy=native` (or
  `framework`) in production, and only when the proxy overwrites `X-Forwarded-For` (otherwise clients can spoof it and
  dodge the limit). The counters are per instance and reset on restart.

## 7. Frontend structure and rules

Routes (`App.tsx`): public `/`, `/login`, `/register`, `/verify-registration`, `/forgot-password`,
`/reset-password`; protected (`ProtectedRoute`) `/explore`, `/profile`, `/achievements`, `/projects`, `/teams`,
`/project/:projectId` (workspace), `/post-idea`, `/requests`, `/history`, `/settings`.

- **`BaseApi.handleResponse` already unwraps the server's `{ success, data, count }` envelope.** An API method must
  return `this.get<T>(...)` directly. Unwrapping `response.data.data` again makes every list empty (this broke the whole
  Requests page once).
- Errors thrown by the API layer are `ApiError { message, status }` carrying the backend's text. Show them with
  `errorMessage(err, fallback)` (`utils/errors.ts`) and `toast.error`. `parseFieldErrors` splits the backend's
  `field: message, ...` validation text per field.
- Downloads need the token: use `BaseApi.getBlob` + `saveBlob`, never `window.open(url)`.
- `<Toaster/>` is mounted once in `App.tsx`; without it every `toast.*` is silently dropped.
- The owner check in the UI compares **usernames** (`project.createdBy.username === user.username`) because the
  project's `createdBy.id` is a *profile* id and the logged-in user's id is a *user* id. It only hides controls; the
  backend enforces ownership.
- No `any`; ESLint is clean (`npm run lint`) and `npm run build` type-checks first.
- Pages use `DashboardLayout` (sidebar + header). Chat polls every 5 s with exponential backoff and pauses in
  background tabs.

## 8. Configuration and environments

- Secrets live in `backend/.env` (gitignored; template `.env.example`), loaded by
  `spring.config.import=optional:file:./.env[.properties]` (**not** by `spring-dotenv`: v2 silently does nothing on
  Spring Boot 3). Real environment variables override it. Keys: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`,
  `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `JWT_SECRET` (no default; startup fails without it),
  `UPLOAD_DIR`.
- Profiles: `dev` is the default (`ddl-auto=update`, SQL logging); `prod` (`SPRING_PROFILES_ACTIVE=prod`) uses
  `validate`, no SQL logging, no API docs, secure cookie, and every value must come from the environment.
- **Schema migrations (Flyway, prod only).** `backend/src/main/resources/db/migration/V<n>__name.sql`. Dev keeps
  `ddl-auto=update` and Flyway off; tests use H2 built from the entities; **prod** runs Flyway and then Hibernate only
  `validate`s. Changing an entity (new column, table, index) therefore needs a new migration, and
  `MigrationsTest` fails the build if the migrations and the entities disagree on tables/columns. Rules: never edit an
  applied migration (add `V2__...`); number without gaps; use plain `CREATE TABLE` / `ALTER TABLE x ADD COLUMN`
  (what the test understands, extend it for anything else). `V1__baseline.sql` is the schema Hibernate builds on MySQL,
  and was checked identical to it. `baseline-on-migrate=true, baseline-version=1` means a database that already has
  tables but no `flyway_schema_history` is **marked** as V1 without running it.
- `ConfigFilesTest` fails the build if a literal secret is committed or a prod safety setting is weakened.
- **`src/test/resources/application.properties` completely replaces the main one in tests** (H2, dummy mail host, fake
  JWT secret). Anything that must hold in production cannot be configured only in properties if a test needs it
  (that is why the page-size cap is in `PagingConfig`).

## 9. Testing

| Suite | Run | What |
|---|---|---|
| Backend | `cd backend && mvn test` (needs JDK 21) | unit tests with Mockito, `@DataJpaTest` against H2 (specifications, soft delete, query counts), `@SpringBootTest` security-rule tests |
| Frontend | `cd frontend && npm test`, `npm run lint`, `npm run build` | Vitest: API client refresh logic, API modules, helpers |
| End to end | `cd e2e && npm install && npm test` | real Chrome + real backend (H2) + real frontend + in-process mail sink; ~160 checks, ~2 min |

Gotchas that cost time:

- Never wrap a matcher or captor in `Objects.requireNonNull(any())`: it returns null, throws, and leaves Mockito's
  matcher state dirty so *unrelated* later tests fail with `InvalidUseOfMatchers`.
- `Page.empty()` has an unpaged pageable and cannot be serialised by Jackson; return `new PageImpl<>(list, PageRequest.of(0, n), total)` from mocks.
- Mockito strict stubs: stubs that a test does not use fail it; use `lenient()` in shared `@BeforeEach` setup.
- jsdom's `Blob` has no `text()` and recent Node's own `localStorage` shadows jsdom's; both are handled in `test/setup.ts`.
- `@DataJpaTest` fixtures need every non-null column (e.g. `Project.status`).
- Tests that assert a bug is fixed were each verified to *fail* on the old code (mutation checks). Keep that habit.

## 10. Working in this repository

- Java **21** is required: Lombok 1.18.30 cannot compile on JDK 27. `mvnw` is not executable and downloads Maven; use a
  local `mvn`.
- Build tooling in the original author's environment resolves Maven and npm through an internal Artifactory mirror
  (`~/.m2/settings.xml` reads `ARTIFACTORY_USER`/`ARTIFACTORY_TOKEN`; tokens expire, 401 = refresh the token;
  `mvn -o` works from the local cache).
- Git: history was rewritten in 2026-11 to remove committed secrets (so older clones must be re-cloned); commits are authored by the repo owner with their
  local identity. **Do not add co-author or tool-attribution trailers to commits.** The 2026 work was committed as small
  themed commits dated one per day from 2026-07-01 at the owner's request; keep each commit building.
- Never run the app against the developer's real MySQL just to test; use the e2e stack (H2) or a throwaway database.
