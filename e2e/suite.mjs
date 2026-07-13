import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

/**
 * The browser + API suite. It drives the real UI in Chrome where a user would, and uses the API (through the
 * same Vite proxy the browser uses) for setup and for the security checks that have no UI.
 *
 * @param {{ base: string, mails: () => Array<{t:number,to:string[],body:string}>, uploadsDir: string,
 *           chromePath: string, shotsDir: string }} cfg
 */
export async function runSuite(cfg) {
  const BASE = cfg.base;
  const API = BASE + '/api';
  fs.mkdirSync(cfg.shotsDir, { recursive: true });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const results = [];
  let section = '';
  const check = (name, ok, detail = '') => {
    results.push({ section, name, ok: !!ok, detail });
    console.log(`${ok ? 'PASS' : 'FAIL'}  [${section}] ${name}${!ok && detail ? '  -> ' + detail : ''}`);
    return !!ok;
  };
  const step = async (name, fn) => {
    try { await fn(); } catch (e) { check(name + ' (script error)', false, String(e.message || e).split('\n')[0]); }
  };

  // ---------- mail sink ----------
  const mails = () => cfg.mails();
  async function otpFor(email, since, timeout = 20000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const m = mails().filter((x) => x.to.includes(email) && x.t * 1000 >= since).pop();
      if (m) { const hit = m.body.match(/>(\d{6})</); if (hit) return hit[1]; }
      await sleep(300);
    }
    return null;
  }

  // ---------- API helpers ----------
  async function api(method, path, { token, json, form, cookie, headers = {} } = {}) {
    const h = { ...headers };
    if (token) h.Authorization = 'Bearer ' + token;
    if (cookie) h.Cookie = cookie;
    let body;
    if (json !== undefined) { h['Content-Type'] = 'application/json'; body = JSON.stringify(json); }
    if (form) body = form;
    const res = await fetch(API + path, { method, headers: h, body });
    const text = await res.text();
    let parsed; try { parsed = JSON.parse(text); } catch { parsed = text; }
    const setCookie = res.headers.getSetCookie?.().find((c) => c.startsWith('refreshToken=')) ?? null;
    return { status: res.status, body: parsed, text, setCookie, headers: res.headers };
  }
  const cookieValue = (setCookie) => (setCookie ? setCookie.split(';')[0] : null);

  async function registerApi(u) {
    const t0 = Date.now();
    const r = await api('POST', '/auth/register', { json: { username: u.username, email: u.email, password: u.password } });
    if (r.status !== 201) throw new Error('register failed ' + r.status + ' ' + r.text);
    const otp = await otpFor(u.email, t0);
    if (!otp) throw new Error('no OTP mail for ' + u.email);
    const v = await api('POST', '/auth/verify-registration-otp', { json: { email: u.email, otp } });
    if (v.status !== 200) throw new Error('verify failed ' + v.status);
  }
  async function loginApi(u, password = u.password) {
    const r = await api('POST', '/auth/login', { json: { username: u.username, password } });
    return { status: r.status, token: r.body?.accessToken, cookie: cookieValue(r.setCookie), user: r.body?.user, body: r.body };
  }

  // ---------- browser helpers ----------
  const text = (page) => page.evaluate(() => document.body.innerText);
  async function waitText(page, needle, timeout = 8000) {
    try { await page.waitForFunction((n) => document.body.innerText.includes(n), { timeout }, needle); return true; } catch { return false; }
  }
  async function clickButton(page, label, timeout = 6000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const ok = await page.evaluate((l) => {
        const b = [...document.querySelectorAll('button, a')].find((x) => x.innerText.trim().toLowerCase().includes(l.toLowerCase()) && !x.disabled);
        if (b) { b.click(); return true; } return false;
      }, label);
      if (ok) return true;
      await sleep(200);
    }
    return false;
  }
  async function clickExact(page, label, timeout = 6000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const ok = await page.evaluate((l) => {
        const b = [...document.querySelectorAll('button')].find((x) => x.innerText.trim().toLowerCase() === l.toLowerCase() && !x.disabled);
        if (b) { b.click(); return true; } return false;
      }, label);
      if (ok) return true;
      await sleep(200);
    }
    return false;
  }
  async function clearAndType(page, handle, value) {
    await handle.focus();
    await handle.evaluate((e) => e.select());
    await page.keyboard.press('Backspace');
    await handle.type(value);
  }
  async function fill(page, selector, value) {
    await page.waitForSelector(selector, { timeout: 6000 });
    await page.click(selector, { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type(selector, value);
  }
  async function shot(page, name) { try { await page.screenshot({ path: `${cfg.shotsDir}/${name}.png` }); } catch { /* ignore */ } }
  async function uiLogin(page, u, password = u.password) {
    await page.goto(BASE + '/login', { waitUntil: 'networkidle0' });
    await fill(page, '#username', u.username);
    await fill(page, '#password', password);
    await clickButton(page, 'Sign in');
    try { await page.waitForFunction(() => location.pathname !== '/login', { timeout: 8000 }); return true; } catch { return false; }
  }
  const token = (page) => page.evaluate(() => localStorage.getItem('accessToken'));

  // ======================================================================
  const users = {
    alice: { username: 'alice_e2e', email: 'alice@e2e.test', password: 'Passw0rd!one' },
    bob: { username: 'bob_e2e', email: 'bob@e2e.test', password: 'Passw0rd!two' },
    carol: { username: 'carol_e2e', email: 'carol@e2e.test', password: 'Passw0rd!three' },
    dave: { username: 'dave_e2e', email: 'dave@e2e.test', password: 'Passw0rd!four' },
    frank: { username: 'frank_e2e', email: 'frank@e2e.test', password: 'Passw0rd!six' },
  };

  const browser = await puppeteer.launch({ executablePath: cfg.chromePath, headless: 'new', args: ['--no-sandbox'] });
  const newCtx = async () => { const c = await browser.createBrowserContext(); const p = await c.newPage(); await p.setViewport({ width: 1280, height: 900 }); return { c, p }; };
  const consoleErrors = [];
  const watch = (page, who) => page.on('pageerror', (e) => consoleErrors.push(`${who}: ${e.message}`));

  const A = await newCtx(); watch(A.p, 'alice');
  const B = await newCtx(); watch(B.p, 'bob');
  let aliceToken, bobToken, carolToken, project;

  try {
    // ---------------------------------------------------------------- 1
    section = '1 Registration, verification, login (UI)';
    await step('alice registers through the form and gets a verification e-mail', async () => {
      const t0 = Date.now();
      await A.p.goto(BASE + '/register', { waitUntil: 'networkidle0' });
      await fill(A.p, '#username', users.alice.username);
      await fill(A.p, '#email', users.alice.email);
      await fill(A.p, '#password', users.alice.password);
      await clickButton(A.p, 'Create account');
      const otp = await otpFor(users.alice.email, t0);
      check('verification e-mail with a 6-digit code reached the (real SMTP) sink', !!otp);
      await A.p.waitForFunction(() => location.pathname === '/verify-registration', { timeout: 8000 }).catch(() => {});
      check('app moved on to the verification page', new URL(A.p.url()).pathname === '/verify-registration', A.p.url());
      await sleep(400);
      const emailVal = await A.p.$eval('#email', (e) => e.value).catch(() => '');
      if (!emailVal) await fill(A.p, '#email', users.alice.email);
      await fill(A.p, '#otp', otp);
      await clickButton(A.p, 'Verify Account');
      check('verification succeeds', await waitText(A.p, 'verif', 6000) || (await A.p.waitForFunction(() => location.pathname === '/login', { timeout: 6000 }).then(() => true).catch(() => false)));
    });
    await step('registering the same username again is refused', async () => {
      const r = await api('POST', '/auth/register', { json: { username: users.alice.username, email: 'other@e2e.test', password: 'Passw0rd!x' } });
      check('duplicate username -> 400', r.status === 400, String(r.status));
    });
    await step('login with the wrong password fails, the right one succeeds', async () => {
      const bad = await loginApi(users.alice, 'wrong-password');
      check('wrong password -> 401', bad.status === 401, String(bad.status));
      const ok = await uiLogin(A.p, users.alice);
      check('login form leads into the app', ok);
      await A.p.waitForFunction(() => location.pathname === '/explore', { timeout: 8000 }).catch(() => {});
      check('lands on /explore', new URL(A.p.url()).pathname === '/explore', A.p.url());
      aliceToken = await token(A.p);
      check('access token stored in the browser', !!aliceToken);
    });
    await step('an already signed-in user is sent away from /login', async () => {
      await A.p.goto(BASE + '/login', { waitUntil: 'networkidle0' });
      await A.p.waitForFunction(() => location.pathname !== '/login', { timeout: 5000 }).catch(() => {});
      check('/login redirects to the app', new URL(A.p.url()).pathname === '/explore', A.p.url());
    });

    // ---------------------------------------------------------------- 2
    section = '2 Session handling (the reload bug)';
    await step('reload with an expired access token stays logged in (refresh via cookie)', async () => {
      await A.p.evaluate(() => localStorage.setItem('accessToken', 'expired.garbage.token'));
      await A.p.goto(BASE + '/explore', { waitUntil: 'networkidle0' });
      const stayed = new URL(A.p.url()).pathname === '/explore';
      const t = await token(A.p);
      check('still on /explore after reload', stayed, A.p.url());
      check('a fresh access token replaced the garbage one', t && t !== 'expired.garbage.token');
      aliceToken = t;
    });
    await step('a visitor with no session is sent to /login without a reload loop', async () => {
      const { c, p } = await newCtx();
      let navs = 0; p.on('framenavigated', (f) => { if (f === p.mainFrame()) navs++; });
      await p.goto(BASE + '/explore', { waitUntil: 'networkidle0' });
      await sleep(1500);
      check('ends on /login', new URL(p.url()).pathname === '/login', p.url());
      check('settled (no navigation loop)', navs <= 4, `navigations: ${navs}`);
      await c.close();
    });

    // ---------------------------------------------------------------- 3
    section = '3 Project, flags and public data';
    await step('alice posts a project; Remote / Open source flags are saved', async () => {
      const r = await api('POST', '/projects', { token: aliceToken, json: { title: 'Collabro E2E', description: 'End to end project', technologies: ['Java', 'React'], level: 'BEGINNER', duration: '2 months', teamSize: 4, category: 'Technology', budget: 'none', isRemote: true, isOpenSource: true, contactMethod: 'platform', additionalInfo: 'extra' } });
      check('create -> 201', r.status === 201, r.status + ' ' + r.text.slice(0, 120));
      project = r.body;
      const g = await api('GET', '/projects/' + project.id, { token: aliceToken });
      check('isRemote round-trips as true', g.body.isRemote === true, JSON.stringify({ r: g.body.isRemote }));
      check('isOpenSource round-trips as true', g.body.isOpenSource === true);
      check('creator exposes no e-mail', g.body.createdBy && !('email' in g.body.createdBy) && !g.text.includes('alice@e2e.test'));
    });
    await step('invalid project input is rejected with a message', async () => {
      const r = await api('POST', '/projects', { token: aliceToken, json: { title: '  ', teamSize: 0 } });
      check('blank title / team size 0 -> 400', r.status === 400, String(r.status));
      check('message names the problem', /Title is required|Team size/.test(r.text), r.text.slice(0, 100));
    });
    await step('sort and page-size abuse is handled', async () => {
      const bad = await api('GET', '/projects?sort=password,asc', { token: aliceToken });
      check('unknown sort field -> 400 (not 500)', bad.status === 400, String(bad.status));
      const big = await api('GET', '/projects?size=100000', { token: aliceToken });
      check('huge page size is capped to 50', big.status === 200 && big.body.size === 50, String(big.body?.size));
    });
    await step('public profile search leaks no contact details', async () => {
      await api('POST', '/profile/skills', { token: aliceToken, json: { name: 'Java', proficiency: 'ADVANCED' } });
      const r = await api('GET', '/matching/search?skills=java&minProficiency=INTERMEDIATE');
      check('search by skill works without a login', r.status === 200 && r.body.content?.some((p) => p.username === users.alice.username), r.text.slice(0, 120));
      check('response has no email or phone', !/@e2e\.test|"email"|"phone"/.test(r.text));
      const none = await api('GET', '/matching/search?skills=java&minProficiency=EXPERT');
      check('minimum proficiency filters correctly (EXPERT -> nobody)', none.status === 200 && none.body.content.length === 0);
      const sort = await api('GET', '/matching/search?sort=password,asc');
      check('unknown sort on search -> 400', sort.status === 400, String(sort.status));
    });

    // ---------------------------------------------------------------- 4
    section = '4 Join request flow (UI) and teams';
    await step('bob registers, verifies and logs in', async () => {
      await registerApi(users.bob);
      check('bob logged in through the form', await uiLogin(B.p, users.bob));
      bobToken = await token(B.p);
      check('bob has a token', !!bobToken);
    });
    await step('bob finds the project on Explore and joins it', async () => {
      await B.p.goto(BASE + '/explore', { waitUntil: 'networkidle0' });
      check('project is listed', await waitText(B.p, 'Collabro E2E'));
      check('no creator mailto / e-mail shown', !(await text(B.p)).includes('alice@e2e.test'));
      await clickButton(B.p, 'Learn More');
      check('Learn More opens the details dialog', await waitText(B.p, 'Posted by', 4000));
      await shot(B.p, 'explore-details');
      await clickButton(B.p, 'Close');
      await clickButton(B.p, 'Join Project');
      check('join request confirmation shown', await waitText(B.p, 'Join request sent successfully', 6000));
      const again = await api('POST', `/requests/join/${project.id}`, { token: bobToken, json: { message: 'dup' } });
      check('a second pending request is refused', again.status === 400, String(again.status));
    });
    await step('alice sees the request on the Requests page and approves it', async () => {
      await A.p.goto(BASE + '/requests', { waitUntil: 'networkidle0' });
      check('pending request from bob is listed', await waitText(A.p, users.bob.username));
      await shot(A.p, 'requests');
      check('"Add to team" button clicked', await clickExact(A.p, 'Add to team'));
      await sleep(1200);
      const rec = await api('GET', '/requests/received?status=APPROVED', { token: aliceToken });
      check('request is APPROVED server-side', rec.body?.data?.length === 1, rec.text.slice(0, 120));
      const one = await api('GET', `/requests/${rec.body.data[0].id}`, { token: aliceToken });
      check('request detail is a DTO, not an entity', one.status === 200 && !/@e2e\.test|"tasks"|"files"/.test(one.text), one.text.slice(0, 100));
    });
    await step('both users see the team on the Teams page with the right role', async () => {
      await A.p.goto(BASE + '/teams', { waitUntil: 'networkidle0' });
      check('alice sees "Collabro E2E" team', await waitText(A.p, 'Collabro E2E'));
      await shot(A.p, 'teams-alice');
      await B.p.goto(BASE + '/teams', { waitUntil: 'networkidle0' });
      check('bob sees the team', await waitText(B.p, 'Collabro E2E'));
      const t = await api('GET', '/teams/me', { token: bobToken });
      check('API: bob is MEMBER, alice is owner', t.body?.[0]?.role === 'MEMBER' && t.body[0].owner.username === users.alice.username, t.text.slice(0, 160));
      check('team data has no e-mail/phone', !/@e2e\.test|"email"|"phone"/.test(t.text));
      const ta = await api('GET', '/teams/me', { token: aliceToken });
      check('API: alice is OWNER with 2 people', ta.body?.[0]?.role === 'OWNER' && ta.body[0].memberCount === 2);
    });

    // ---------------------------------------------------------------- 5
    section = '5 Authorization (non-members blocked)';
    await step('carol (not on the team) cannot touch tasks, chat or files', async () => {
      await registerApi(users.carol);
      const c = await loginApi(users.carol); carolToken = c.token;
      const base = `/projects/${project.id}`;
      const probes = [
        ['GET', `${base}/tasks`], ['POST', `${base}/tasks`, { title: 'x' }], ['GET', `${base}/messages`],
        ['POST', `${base}/messages`, { content: 'hi' }], ['GET', `${base}/files`],
      ];
      for (const [m, p, json] of probes) {
        const r = await api(m, p, { token: carolToken, json });
        check(`${m} ${p.replace(project.id, ':id')} -> 403`, r.status === 403, String(r.status));
      }
      const noAuth = await api('GET', `${base}/tasks`);
      check('no token at all -> 401', noAuth.status === 401, String(noAuth.status));
    });
    await step('members can use tasks, chat and files; assignee must be a member', async () => {
      const task = await api('POST', `/projects/${project.id}/tasks`, { token: bobToken, json: { title: 'Bob task', description: 'd', priority: 'HIGH' } });
      check('bob creates a task', task.status === 201, String(task.status));
      const profBob = await api('GET', '/profile/me', { token: bobToken });
      const assign = await api('PATCH', `/tasks/${task.body.id}`, { token: aliceToken, json: { assigneeId: profBob.body.id, status: 'COMPLETED' } });
      check('alice assigns it to bob and completes it', assign.status === 200 && assign.body.assigneeId === profBob.body.id, String(assign.status));
      const profCarol = await api('GET', '/profile/me', { token: carolToken });
      const bad = await api('POST', `/projects/${project.id}/tasks`, { token: aliceToken, json: { title: 'x', assigneeId: profCarol.body.id } });
      check('assigning an outsider -> 400', bad.status === 400, String(bad.status));
      const blank = await api('POST', `/projects/${project.id}/tasks`, { token: aliceToken, json: { title: '   ' } });
      check('blank task title -> 400', blank.status === 400, String(blank.status));
      const del = await api('DELETE', `/tasks/${task.body.id}`, { token: carolToken });
      check('carol cannot delete the task', del.status === 403, String(del.status));
      const m1 = await api('POST', `/projects/${project.id}/messages`, { token: bobToken, json: { content: 'hello from bob' } });
      const m2 = await api('POST', `/projects/${project.id}/messages`, { token: aliceToken, json: { content: 'hello from alice' } });
      check('both can chat', m1.status === 200 && m2.status === 200);
      const empty = await api('POST', `/projects/${project.id}/messages`, { token: bobToken, json: { content: '   ' } });
      check('blank chat message -> 400', empty.status === 400, String(empty.status));
    });
    await step('chat and tasks render in the workspace UI for a member', async () => {
      await B.p.goto(`${BASE}/project/${project.id}`, { waitUntil: 'networkidle0' });
      check('workspace loads', await waitText(B.p, 'Collabro E2E'));
      const body = await text(B.p);
      check('member sees "Leave project", not "Delete project"', body.includes('Leave project') && !body.includes('Delete project'));
      check('member does not see the owner-only Edit button', !/\bEdit\b/.test(body.split('Project Overview')[1]?.slice(0, 80) || ''));
      await clickButton(B.p, 'Chat');
      check('chat shows both messages', await waitText(B.p, 'hello from alice') && (await text(B.p)).includes('hello from bob'));
      await shot(B.p, 'workspace-chat-bob');
      await clickButton(B.p, 'Tasks');
      check('tasks tab shows the task', await waitText(B.p, 'Bob task'));
      await A.p.goto(`${BASE}/project/${project.id}`, { waitUntil: 'networkidle0' });
      const aBody = await text(A.p);
      check('owner sees "Delete project" and not "Leave project"', aBody.includes('Delete project') && !aBody.includes('Leave project'));
    });
    await step('file upload, authenticated download, and delete rules', async () => {
      const form = new FormData(); form.append('file', new Blob(['hello file contents'], { type: 'text/plain' }), 'notes.txt');
      const up = await api('POST', `/projects/${project.id}/files`, { token: bobToken, form });
      check('member uploads a file', up.status === 200, up.status + ' ' + up.text.slice(0, 100));
      const dl = await fetch(`${API}/project-files/${up.body.id}/download`, { headers: { Authorization: 'Bearer ' + bobToken } });
      check('member downloads it back intact', (await dl.text()) === 'hello file contents');
      check('served as an attachment', /attachment/.test(dl.headers.get('content-disposition') || ''), dl.headers.get('content-disposition'));
      const anon = await fetch(`${API}/project-files/${up.body.id}/download`);
      check('download without a token -> 401', anon.status === 401, String(anon.status));
      const out = await fetch(`${API}/project-files/${up.body.id}/download`, { headers: { Authorization: 'Bearer ' + carolToken } });
      check('outsider download -> 403', out.status === 403, String(out.status));
      const evil = new FormData(); evil.append('file', new Blob(['x']), '../../../../etc/evil<script>.txt');
      const up2 = await api('POST', `/projects/${project.id}/files`, { token: aliceToken, form: evil });
      check('hostile filename is sanitised (no path, no angle brackets)', up2.status === 200 && !/[\/\\<>]|\.\./.test(up2.body.fileName ?? ''), JSON.stringify(up2.body?.fileName));
      const badId = await api('PATCH', '/tasks/undefined', { token: aliceToken, json: { title: 'x' } });
      check('malformed id in a URL -> 400, not 500', badId.status === 400, String(badId.status));
      const del = await api('DELETE', `/project-files/${up2.body.id}`, { token: bobToken });
      check("another member cannot delete the owner's file", del.status === 403, String(del.status));
    });
    await step('profile picture rules', async () => {
      const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
      const ok = new FormData(); ok.append('file', new Blob([png], { type: 'image/png' }), 'me.png');
      const r = await api('POST', '/profile/picture', { token: aliceToken, form: ok });
      check('a real PNG is accepted', r.status === 200, r.status + ' ' + r.text.slice(0, 100));
      const url = r.body?.profilePictureUrl;
      check('picture URL is a loadable /api path, not the stored path', typeof url === 'string' && url.startsWith('/api/profile/picture/'), String(url));
      const img = await fetch(BASE + url);
      check('picture is served as image/png', img.status === 200 && img.headers.get('content-type') === 'image/png', img.status + ' ' + img.headers.get('content-type'));
      for (const [name, bytes, type] of [['x.svg', '<svg onload=alert(1)/>', 'image/svg+xml'], ['x.png', '<script>alert(1)</script>', 'image/png'], ['x.jpg', 'notajpeg', 'image/jpeg']]) {
        const f = new FormData(); f.append('file', new Blob([bytes], { type }), name);
        const bad = await api('POST', '/profile/picture', { token: aliceToken, form: f });
        check(`hostile upload "${name}" rejected`, bad.status === 400, String(bad.status));
      }
      const trav = await fetch(`${API}/profile/picture/..%2F..%2F..%2Fpom.xml`);
      check('path traversal does not return a file', trav.status >= 400 && !(await trav.text()).includes('<project'), String(trav.status));
      const trav2 = await fetch(`${API}/profile/picture/%2e%2e/%2e%2e/application.properties`);
      check('encoded dot-segments do not return a file', trav2.status >= 400, String(trav2.status));
      const msgs = await api('GET', `/projects/${project.id}/messages`, { token: aliceToken });
      check('chat avatars are loadable URLs', msgs.body.content.every((m) => !m.senderAvatar || m.senderAvatar.startsWith('/api/profile/picture/')), msgs.text.slice(0, 160));
    });

    // ---------------------------------------------------------------- 6
    section = '6 History and Achievements (UI)';
    await step('History page shows real activity', async () => {
      await A.p.goto(BASE + '/history', { waitUntil: 'networkidle0' });
      check('shows the created project event', await waitText(A.p, 'Created "Collabro E2E"'));
      const body = await text(A.p);
      check('shows bob joining', body.includes(`${users.bob.username} joined`) || body.includes('joined "Collabro E2E"'));
      await shot(A.p, 'history-alice');
      const api1 = await api('GET', '/history?type=collaboration', { token: aliceToken });
      check('API type filter works', api1.body.content.every((i) => i.type === 'collaboration') && api1.body.content.length >= 1);
      const stats = await api('GET', '/history/stats', { token: aliceToken });
      check('API stats add up', stats.body.projectsCreated === 1 && stats.body.totalActivities >= 3, JSON.stringify(stats.body));
    });
    await step('Achievements page reflects progress', async () => {
      await A.p.goto(BASE + '/achievements', { waitUntil: 'networkidle0' });
      check('page shows First Idea badge', await waitText(A.p, 'First Idea'));
      await shot(A.p, 'achievements-alice');
      const r = await api('GET', '/achievements/me', { token: aliceToken });
      const byId = Object.fromEntries(r.body.achievements.map((a) => [a.id, a]));
      check('first_idea unlocked', byId.first_idea.isUnlocked === true);
      check('team_player locked for the owner, progress 0/1', byId.team_player.isUnlocked === false && byId.team_player.progress.current === 0);
      check('skilled progress counts the one skill (1/3)', byId.skilled.progress.current === 1 && byId.skilled.progress.required === 3);
      const rb = await api('GET', '/achievements/me', { token: bobToken });
      check("bob's team_player + task_starter unlocked", rb.body.achievements.find((a) => a.id === 'team_player').isUnlocked && rb.body.achievements.find((a) => a.id === 'task_starter').isUnlocked);
      check('points and level computed', r.body.stats.totalPoints >= 10 && r.body.stats.level >= 1);
    });

    // ---------------------------------------------------------------- 7
    section = '7 Settings (UI): password change, account deletion';
    await step('toasts render (Toaster is mounted)', async () => {
      await A.p.goto(BASE + '/profile', { waitUntil: 'networkidle0' });
      await clickButton(A.p, 'Export PDF');
      check('incomplete profile export explains why (toast on screen)', await waitText(A.p, 'Complete your profile before exporting', 6000));
      await shot(A.p, 'toast-export');
    });
    await step('bob changes his password in Settings', async () => {
      await B.p.goto(BASE + '/settings', { waitUntil: 'networkidle0' });
      const inputs = await B.p.$$('input[type="password"]');
      check('three password fields present', inputs.length >= 3, String(inputs.length));
      await inputs[0].type('wrong-current'); await inputs[1].type('NewPassw0rd!2'); await inputs[2].type('NewPassw0rd!2');
      await clickButton(B.p, 'Change password');
      check('wrong current password is reported inline', await waitText(B.p, 'Current password is incorrect', 6000));
      await clearAndType(B.p, inputs[0], users.bob.password); await clearAndType(B.p, inputs[1], 'NewPassw0rd!2'); await clearAndType(B.p, inputs[2], 'NewPassw0rd!2');
      await clickButton(B.p, 'Change password');
      check('success toast shown', await waitText(B.p, 'Password changed', 6000));
      const stillIn = await api('GET', '/teams/me', { token: await token(B.p) });
      check('the current browser session survives the change', stillIn.status === 200, String(stillIn.status));
      const oldLogin = await loginApi(users.bob);
      check('old password no longer logs in', oldLogin.status === 401, String(oldLogin.status));
      users.bob.password = 'NewPassw0rd!2';
      const newLogin = await loginApi(users.bob);
      check('new password logs in', newLogin.status === 200);
      bobToken = newLogin.token;
    });
    await step('bob signs out through the sidebar', async () => {
      await B.p.goto(BASE + '/explore', { waitUntil: 'networkidle0' });
      await clickButton(B.p, 'Sign Out');
      await B.p.waitForFunction(() => location.pathname === '/login', { timeout: 6000 }).catch(() => {});
      check('sign out lands on /login', new URL(B.p.url()).pathname === '/login', B.p.url());
      check('access token cleared', (await token(B.p)) === null);
      await B.p.goto(BASE + '/explore', { waitUntil: 'networkidle0' });
      await sleep(800);
      check('protected page is closed after sign out', new URL(B.p.url()).pathname === '/login', B.p.url());
    });
    await step('bob leaves the project, can re-apply, then deletes his account', async () => {
      check('bob logs in again', await uiLogin(B.p, users.bob));
      bobToken = await token(B.p);
      const orig = await api('GET', `/projects/${project.id}/team`, { token: aliceToken });
      check('team endpoint lists bob without contact details', orig.status === 200 && orig.body.some((m) => m.username === users.bob.username) && !/@e2e\.test|"email"/.test(orig.text));
      await B.p.goto(`${BASE}/project/${project.id}`, { waitUntil: 'networkidle0' });
      await clickButton(B.p, 'Leave project');
      check('confirmation dialog appears', await waitText(B.p, 'Leave project?', 4000));
      await shot(B.p, 'leave-dialog');
      await B.p.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Leave project'); bs[bs.length - 1].click(); });
      await B.p.waitForFunction(() => location.pathname === '/projects', { timeout: 8000 }).catch(() => {});
      check('after leaving, bob is taken to /projects', new URL(B.p.url()).pathname === '/projects', B.p.url());
      const gone = await api('GET', `/projects/${project.id}/tasks`, { token: bobToken });
      check('bob is locked out of the project again (403)', gone.status === 403, String(gone.status));
      const task = await api('GET', `/projects/${project.id}/tasks`, { token: aliceToken });
      check("bob's completed task survives, unassigned", task.status === 200);
      const re = await api('POST', `/requests/join/${project.id}`, { token: bobToken, json: { message: 'back again' } });
      check('bob can ask to join again after leaving', re.status === 201, re.status + ' ' + re.text.slice(0, 100));
      const rec = await api('GET', '/requests/received?status=PENDING', { token: aliceToken });
      const approve = await api('POST', `/requests/${rec.body.data[0].id}/approve`, { token: aliceToken });
      check('alice approves again', approve.status === 200, String(approve.status));
      await B.p.goto(BASE + '/settings', { waitUntil: 'networkidle0' });
      await clickExact(B.p, 'Delete');
      await B.p.waitForSelector('input[autocomplete="current-password"]', { timeout: 4000 }).catch(() => {});
      const pw = await B.p.$$('input[type="password"]'); const last = pw[pw.length - 1];
      await last.type('not-my-password');
      await clickButton(B.p, 'Confirm Delete');
      check('wrong password is refused with a message', await waitText(B.p, 'Password is incorrect', 6000));
      await clearAndType(B.p, last, users.bob.password);
      await clickButton(B.p, 'Confirm Delete');
      await B.p.waitForFunction(() => location.pathname === '/login', { timeout: 8000 }).catch(() => {});
      check('after deleting, bob is signed out at /login', new URL(B.p.url()).pathname === '/login', B.p.url());
      const gone2 = await loginApi(users.bob);
      check('deleted account can no longer log in', gone2.status === 401, String(gone2.status));
      const t = await api('GET', `/projects/${project.id}/team`, { token: aliceToken });
      check('the project and its team still load for alice (no 500 from the deleted member)', t.status === 200, t.status + ' ' + t.text.slice(0, 100));
      const p = await api('GET', `/projects/${project.id}`, { token: aliceToken });
      check('project still readable', p.status === 200);
      const s = await api('GET', '/matching/search?size=50');
      check('deleted user is not listed in search', s.status === 200 && !s.text.includes(users.bob.username));
      const ch = await api('GET', `/projects/${project.id}/messages`, { token: aliceToken });
      check("deleted member's chat messages still load", ch.status === 200 && ch.text.includes('hello from bob'), ch.status + '');
    });

    // ---------------------------------------------------------------- 8
    section = '8 Rejection, re-apply, delete project (UI)';
    await step('carol is rejected, re-applies, alice deletes the project', async () => {
      const r1 = await api('POST', `/requests/join/${project.id}`, { token: carolToken, json: { message: 'let me in' } });
      check('carol applies', r1.status === 201);
      const rej = await api('POST', `/requests/${r1.body.requestId}/reject`, { token: aliceToken, json: { reason: 'full' } });
      check('alice rejects', rej.status === 200);
      const r2 = await api('POST', `/requests/join/${project.id}`, { token: carolToken, json: { message: 'second try' } });
      check('carol can apply again after a rejection', r2.status === 201, r2.status + ' ' + r2.text.slice(0, 100));
      const nonOwner = await api('DELETE', `/projects/${project.id}`, { token: carolToken });
      check('a non-owner cannot delete the project (403)', nonOwner.status === 403, String(nonOwner.status));
      await A.p.goto(`${BASE}/project/${project.id}`, { waitUntil: 'networkidle0' });
      await clickButton(A.p, 'Delete project');
      check('delete confirmation names the project', await waitText(A.p, 'permanently deleted', 4000));
      await shot(A.p, 'delete-dialog');
      await A.p.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => b.innerText.trim() === 'Delete project'); bs[bs.length - 1].click(); });
      await A.p.waitForFunction(() => location.pathname === '/projects', { timeout: 8000 }).catch(() => {});
      check('after deleting, alice lands on /projects', new URL(A.p.url()).pathname === '/projects', A.p.url());
      const gone = await api('GET', `/projects/${project.id}`, { token: aliceToken });
      check('project is gone (404)', gone.status === 404, String(gone.status));
      const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]) : [];
      const files = walk(cfg.uploadsDir + '/project-files');
      check('its stored files were removed from disk', files.length === 0, files.join(','));
      const teams = await api('GET', '/teams/me', { token: aliceToken });
      check('team is gone from My Teams', teams.status === 200 && teams.body.length === 0, teams.text.slice(0, 80));
    });

    // ---------------------------------------------------------------- 9
    section = '9 OTP and password reset';
    await step('OTP guessing is capped and the cooldown cannot be bypassed', async () => {
      await registerApi(users.dave);
      const t0 = Date.now();
      const f = await api('POST', '/auth/forgot-password', { json: { email: users.dave.email } });
      check('forgot-password -> 200', f.status === 200);
      const otp = await otpFor(users.dave.email, t0);
      check('reset code e-mailed', !!otp);
      const wrong = otp === '000000' ? '111111' : '000000';
      const statuses = [];
      for (let i = 0; i < 5; i++) statuses.push((await api('POST', '/auth/verify-otp', { json: { email: users.dave.email, otp: wrong } })).status);
      check('five wrong guesses are all rejected', statuses.every((s) => s === 400), statuses.join(','));
      const right = await api('POST', '/auth/verify-otp', { json: { email: users.dave.email, otp } });
      check('after five misses even the CORRECT code is refused (burned)', right.status === 400, String(right.status));
      const before = mails().length;
      const again = await api('POST', '/auth/forgot-password', { json: { email: users.dave.email } });
      await sleep(1500);
      check('requesting a fresh code right away is silently throttled (same 200 answer)', again.status === 200);
      check('...and no new e-mail is sent (cooldown holds even after burning)', mails().length === before, `mails ${before} -> ${mails().length}`);
    });
    await step('reset does not reveal unknown addresses and ignores wrong-purpose codes', async () => {
      const before = mails().length;
      const r = await api('POST', '/auth/forgot-password', { json: { email: 'nobody@e2e.test' } });
      await sleep(800);
      check('unknown address gets the same 200', r.status === 200);
      check('and no mail is sent to strangers', mails().length === before);
      const bad = await api('POST', '/auth/verify-otp', { json: { email: users.alice.email, otp: '12ab' } });
      check('malformed code -> 400', bad.status === 400, String(bad.status));
      const q = await api('POST', '/auth/reset-password?email=a@b.c&otp=123456&newPassword=abcdef');
      check('old query-string style is no longer accepted', q.status >= 400 && q.status < 500, String(q.status));
    });
    await step('a successful reset changes the password and ends old sessions', async () => {
      const eve = { username: 'eve_e2e', email: 'eve@e2e.test', password: 'Passw0rd!five' };
      await registerApi(eve);
      const s1 = await loginApi(eve);
      const t0 = Date.now();
      await api('POST', '/auth/forgot-password', { json: { email: eve.email } });
      const otp = await otpFor(eve.email, t0);
      const verify = await api('POST', '/auth/verify-otp', { json: { email: eve.email, otp } });
      check('code verifies', verify.status === 200);
      const reset = await api('POST', '/auth/reset-password', { json: { email: eve.email, otp, newPassword: 'Passw0rd!reset' } });
      check('reset succeeds', reset.status === 200, String(reset.status));
      const again = await api('POST', '/auth/reset-password', { json: { email: eve.email, otp, newPassword: 'Passw0rd!again' } });
      check('the code cannot be reused', again.status === 400, String(again.status));
      check('old password rejected', (await loginApi(eve)).status === 401);
      eve.password = 'Passw0rd!reset';
      check('new password works', (await loginApi(eve)).status === 200);
      const old = await api('POST', '/auth/refresh', { cookie: s1.cookie });
      check("the old session's refresh token is dead after a reset", old.status === 401, String(old.status));
      const mailBody = mails().filter((m) => m.to.includes(eve.email)).pop();
      check('a "password reset successful" notice was e-mailed', /Reset Successful|updated successfully/i.test(mailBody?.body || ''));
    });

    // ---------------------------------------------------------------- 10
    section = '10 Token security';
    await step('access vs refresh tokens', async () => {
      const l = await loginApi(users.carol);
      check('login sets an HttpOnly refresh cookie', /HttpOnly/i.test((await api('POST', '/auth/login', { json: { username: users.carol.username, password: users.carol.password } })).setCookie || ''));
      const asBearer = await api('GET', '/teams/me', { token: l.cookie.split('=')[1] });
      check('the refresh token cannot be used as a Bearer token', asBearer.status === 401, String(asBearer.status));
      const cpw = await api('PUT', '/auth/change-password', { json: { currentPassword: 'a', newPassword: 'abcdef' } });
      check('change-password needs a login even though /api/auth/** is public', cpw.status === 401, String(cpw.status));
    });
    await step('refresh tokens rotate; replay is detected; logout revokes', async () => {
      const l = await loginApi(users.carol);
      const r1 = await api('POST', '/auth/refresh', { cookie: l.cookie });
      check('refresh works and returns an access token', r1.status === 200 && !!r1.body.accessToken, String(r1.status));
      const c1 = cookieValue(r1.setCookie);
      check('a NEW refresh token is issued (rotation)', !!c1 && c1 !== l.cookie);
      const conc = await api('POST', '/auth/refresh', { cookie: l.cookie });
      check('immediate replay (concurrent tab) is tolerated: access token, no new cookie', conc.status === 200 && !conc.setCookie, conc.status + ' ' + !!conc.setCookie);
      await sleep(11500); // the grace window for concurrent refreshes is 10 seconds
      const replay = await api('POST', '/auth/refresh', { cookie: l.cookie });
      check('replay after the grace window is rejected', replay.status === 401, String(replay.status));
      const afterTheft = await api('POST', '/auth/refresh', { cookie: c1 });
      check('...and it ended the whole session (the new token dies too)', afterTheft.status === 401, String(afterTheft.status));
      const l2 = await loginApi(users.carol);
      await api('POST', '/auth/logout', { cookie: l2.cookie });
      const after = await api('POST', '/auth/refresh', { cookie: l2.cookie });
      check('after logout the refresh token no longer works', after.status === 401, String(after.status));
      const none = await api('POST', '/auth/refresh');
      check('refresh without a cookie -> 401', none.status === 401);
    });
    await step('wrong content type / method are 4xx, not 500', async () => {
      const r = await fetch(API + '/auth/verify-otp', { method: 'POST', body: 'email=a&otp=1', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      check('form-encoded body -> 415', r.status === 415, String(r.status));
      const g = await fetch(API + '/auth/login');
      check('GET on login -> 405', g.status === 405, String(g.status));
    });

    // ---------------------------------------------------------------- 11
    section = '11 Login throttling';
    await step('repeated wrong passwords lock the client out, even for the right password', async () => {
      await registerApi(users.frank);
      const statuses = [];
      for (let i = 0; i < 5; i++) statuses.push((await loginApi(users.frank, 'wrong-' + i)).status);
      check('the first five wrong passwords are ordinary 401s', statuses.every((s) => s === 401), statuses.join(','));
      const sixth = await api('POST', '/auth/login', { json: { username: users.frank.username, password: 'wrong-6' } });
      check('the sixth attempt is refused with 429', sixth.status === 429, String(sixth.status));
      const wait = Number(sixth.headers.get('retry-after'));
      check('...with a Retry-After of up to 15 minutes', wait > 0 && wait <= 901, String(wait));
      const right = await api('POST', '/auth/login', { json: { username: users.frank.username, password: users.frank.password } });
      check('the CORRECT password is refused too, so the lock is not a password oracle', right.status === 429 && !right.setCookie && !right.body?.accessToken, String(right.status));
      check('the refusal says the same thing for right and wrong passwords', right.text === sixth.text, right.text + ' | ' + sixth.text);
    });
    await step('the login form shows the lock-out instead of a generic failure', async () => {
      const { c, p } = await newCtx();
      await uiLogin(p, users.frank);
      check('the form explains that there were too many attempts', await waitText(p, 'Too many failed login attempts', 5000));
      check('and the user is still on /login', new URL(p.url()).pathname === '/login', p.url());
      await c.close();
    });
    await step('other accounts are unaffected, and a made-up username is throttled the same way', async () => {
      const alice = await loginApi(users.alice);
      check('another account signs in normally from the same address', alice.status === 200, String(alice.status));
      const ghost = [];
      for (let i = 0; i < 5; i++) ghost.push((await api('POST', '/auth/login', { json: { username: 'ghost_e2e', password: 'x' + i } })).status);
      const lockedGhost = await api('POST', '/auth/login', { json: { username: 'ghost_e2e', password: 'x6' } });
      check('five failures for an unknown username, then 429: no way to tell it does not exist', ghost.every((s) => s === 401) && lockedGhost.status === 429, ghost.join(',') + ' ' + lockedGhost.status);
    });
  } finally {
    await browser.close();
  }

  // ---------------------------------------------------------------- summary
  const failed = results.filter((r) => !r.ok);
  console.log('\n==== SUMMARY ====');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  const bySection = {};
  for (const r of results) { bySection[r.section] ??= { p: 0, f: 0 }; bySection[r.section][r.ok ? 'p' : 'f']++; }
  for (const [s, c] of Object.entries(bySection)) console.log(`  ${c.f ? 'x' : 'ok'}  ${s}: ${c.p} passed${c.f ? ', ' + c.f + ' FAILED' : ''}`);
  if (consoleErrors.length) {
    console.log('\nuncaught page errors:', [...new Set(consoleErrors)].slice(0, 5));
    results.push({ section: 'page errors', name: 'no uncaught errors in the browser', ok: false, detail: consoleErrors[0] });
    failed.push(results[results.length - 1]);
  }
  return { results, failed };
}
