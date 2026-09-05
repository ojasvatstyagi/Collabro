import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

/**
 * The browser + API suite. It drives the real UI in Chrome where a user would, and uses the API (through the
 * same Vite proxy the browser uses) for setup and for the security checks that have no UI.
 *
 * @param {{ base: string, backend: string, mails: () => Array<{t:number,to:string[],body:string}>, uploadsDir: string,
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
    gina: { username: 'gina_e2e', email: 'gina@e2e.test', password: 'Passw0rd!seven' },
    hank: { username: 'hank_e2e', email: 'hank@e2e.test', password: 'Passw0rd!eight' },
    ivy: { username: 'ivy_e2e', email: 'ivy@e2e.test', password: 'Passw0rd!nine' },
    judy: { username: 'judy_e2e', email: 'judy@e2e.test', password: 'Passw0rd!ten' },
    kim: { username: 'kim_e2e', email: 'kim@e2e.test', password: 'Passw0rd!eleven' },
    owen: { username: 'owen_e2e', email: 'owen@e2e.test', password: 'Passw0rd!twelve' },
    mia: { username: 'mia_e2e', email: 'mia@e2e.test', password: 'Passw0rd!thirteen' },
    nia: { username: 'nia_e2e', email: 'nia@e2e.test', password: 'Passw0rd!fourteen' },
  };

  const browser = await puppeteer.launch({ executablePath: cfg.chromePath, headless: 'new', args: ['--no-sandbox'] });
  const newCtx = async () => { const c = await browser.createBrowserContext(); const p = await c.newPage(); await p.setViewport({ width: 1280, height: 900 }); return { c, p }; };
  const consoleErrors = [];
  const watch = (page, who) => page.on('pageerror', (e) => consoleErrors.push(`${who}: ${e.message}`));

  const A = await newCtx(); watch(A.p, 'alice');
  const B = await newCtx(); watch(B.p, 'bob');
  let aliceToken, bobToken, carolToken, project, bobPictureUrl, bobPictureFiles;

  try {
    // ---------------------------------------------------------------- 1
    section = '1 Registration, verification, login (UI)';
    await step('the login page draws its particle background: a real canvas, behind the form', async () => {
      const { c, p } = await newCtx();
      await p.goto(BASE + '/login', { waitUntil: 'networkidle0' });
      const drawn = await p.waitForSelector('#tsparticles canvas', { timeout: 10000 }).then(() => true).catch(() => false);
      check('a canvas is created inside #tsparticles (jsdom cannot show this)', drawn);
      const z = await p.evaluate(() => getComputedStyle(document.getElementById('tsparticles') || document.body).zIndex);
      check('it sits behind the page content', Number(z) < 0, String(z));
      check('and the form on top of it is still usable', (await p.$('#username')) !== null && (await p.$('#password')) !== null);
      await c.close();
    });
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
      // give bob real personal data, so what deleting the account must erase can be seen from alice's side
      const walkPics = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walkPics(d + '/' + e.name) : [d + '/' + e.name]) : [];
      const picsBefore = new Set(walkPics(cfg.uploadsDir + '/profile-pictures'));
      const setProfile = await api('PUT', '/profile/me', { token: bobToken, json: { firstname: 'Bobby', lastname: 'Builder', bio: 'I build bridges', education: 'MIT', location: 'Pune', phone: '+91 98765 43210' } });
      check('bob fills in his profile', setProfile.status === 200, setProfile.status + ' ' + setProfile.text.slice(0, 120));
      await api('POST', '/profile/skills', { token: bobToken, json: { name: 'Welding', proficiency: 'EXPERT' } });
      const bobPng = new FormData(); bobPng.append('file', new Blob([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0])], { type: 'image/png' }), 'bob.png');
      const bobPic = await api('POST', '/profile/picture', { token: bobToken, form: bobPng });
      bobPictureUrl = bobPic.body?.profilePictureUrl;
      bobPictureFiles = walkPics(cfg.uploadsDir + '/profile-pictures').filter((f) => !picsBefore.has(f));
      check('bob uploads a picture (one new file on disk)', bobPic.status === 200 && bobPictureFiles.length === 1, bobPic.status + ' ' + bobPictureFiles.length);
      const seenBefore = (await api('GET', `/projects/${project.id}/team`, { token: aliceToken })).text;
      check("before deleting, his teammates can see bob's name, bio and skill", ['Bobby', 'Builder', 'I build bridges', 'Welding'].every((t) => seenBefore.includes(t)), seenBefore.slice(0, 200));
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
      check("...but nothing personal of bob's is left in what the team sees (name, bio, education, location, phone, skill)",
        ['Bobby', 'Builder', 'I build bridges', 'MIT', 'Pune', '98765', 'Welding'].every((x) => !t.text.includes(x)), t.text.slice(0, 300));
      check('he is shown as a deleted user instead', t.text.includes('Deleted'), t.text.slice(0, 200));
      check('his picture file was removed from disk', bobPictureFiles.length === 1 && !fs.existsSync(bobPictureFiles[0]), bobPictureFiles.join(','));
      check('and its URL no longer serves anything', bobPictureUrl && (await fetch(BASE + bobPictureUrl)).status === 404, String(bobPictureUrl));
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
      // e-mail is sent off the request thread, so give it a moment to arrive
      let mailBody;
      for (let i = 0; i < 20 && !/Reset Successful|updated successfully/i.test(mailBody?.body || ''); i++) {
        await sleep(250);
        mailBody = mails().filter((m) => m.to.includes(eve.email)).pop();
      }
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
      // the e2e stack runs the dev profile, which opens the API description to anonymous visitors (and it must work)
      const docs = await fetch(cfg.backend + '/v3/api-docs');
      const spec = await docs.json().catch(() => ({}));
      check('the API description loads (dev profile): valid OpenAPI listing the login endpoint', docs.status === 200 && !!spec.openapi && !!spec.paths?.['/api/auth/login'], String(docs.status));
      check('and so does the Swagger UI page', (await fetch(cfg.backend + '/swagger-ui/index.html')).status === 200);
      const noAuth = await api('GET', '/teams/me');
      check('a request without a login gets a JSON 401 with a fixed message, not Spring internals', noAuth.status === 401 && noAuth.body?.message === 'Authentication is required' && /json/.test(noAuth.headers.get('content-type') || ''), noAuth.text);
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

    // ---------------------------------------------------------------- 12
    section = '12 Registration does not reveal which addresses are registered';
    const countMails = (email) => mails().filter((m) => m.to.includes(email)).length;
    const registerReq = (u, over = {}) => api('POST', '/auth/register', { json: { username: u.username, email: u.email, password: u.password, ...over } });
    await step('an address that already has an account is answered exactly like a new one', async () => {
      await registerApi(users.gina);
      const t0 = Date.now();
      const fresh = await registerReq({ username: 'fresh_e2e', email: 'fresh@e2e.test', password: 'Passw0rd!fresh' });
      const known = await registerReq(users.gina, { username: 'gina_other_e2e', password: 'Passw0rd!attacker' });
      check('both are 201', fresh.status === 201 && known.status === 201, `${fresh.status} / ${known.status}`);
      check('with the same body, so nothing says the address is taken', fresh.text === known.text, fresh.text + ' | ' + known.text);
      const before = countMails(users.gina.email);
      await sleep(1500);
      check('the owner of a registered address is not mailed by strangers', countMails(users.gina.email) === before);
      check('no account was created under the new username', (await loginApi({ username: 'gina_other_e2e' }, 'Passw0rd!attacker')).status === 401);
      check("the real account's password is unchanged", (await loginApi(users.gina)).status === 200);
      const fastEnough = Date.now() - t0 < 10000;
      check('a taken username is still reported (usernames are public)', (await registerReq({ username: users.gina.username, email: 'x@e2e.test', password: 'Passw0rd!x' })).status === 400 && fastEnough);
      const takenWithKnownAddress = await registerReq(users.gina, { password: 'Passw0rd!y' });
      const takenWithFreshAddress = await registerReq(users.gina, { email: 'y@e2e.test', password: 'Passw0rd!y' });
      check('...with the same answer whether or not the address is registered', takenWithKnownAddress.status === 400 && takenWithKnownAddress.text === takenWithFreshAddress.text, takenWithKnownAddress.text + ' | ' + takenWithFreshAddress.text);
    });
    await step('a pending registration cannot be parked by someone else (latest registrant wins)', async () => {
      const t0 = Date.now();
      const first = await registerReq(users.hank);
      check('the first registration is accepted', first.status === 201);
      const code = await otpFor(users.hank.email, t0);
      const second = await registerReq(users.hank, { username: 'hank_second_e2e', password: 'Passw0rd!second' });
      check('registering the same address again is accepted', second.status === 201, String(second.status));
      const v = await api('POST', '/auth/verify-registration-otp', { json: { email: users.hank.email, otp: code } });
      check('the code the address owner received verifies the account', v.status === 200, String(v.status));
      check('the LATEST registrant credentials work', (await loginApi({ username: 'hank_second_e2e' }, 'Passw0rd!second')).status === 200);
      check('the earlier credentials do not', (await loginApi(users.hank)).status === 401);
    });
    await step('resending the registration code answers the same for everyone', async () => {
      await registerReq(users.ivy);
      await sleep(800);
      const answers = [];
      const counts = {};
      for (const email of [users.ivy.email, users.hank.email, 'nobody-at-all@e2e.test']) {
        counts[email] = countMails(email);
        const r = await api('POST', '/auth/resend-registration-otp', { json: { email } });
        answers.push(r.status + ' ' + r.text);
      }
      await sleep(1500);
      check('pending, verified and unknown addresses get the identical answer', new Set(answers).size === 1 && answers[0].startsWith('200'), answers.join(' | '));
      check('nothing is mailed to a verified or unknown address', countMails(users.hank.email) === counts[users.hank.email] && countMails('nobody-at-all@e2e.test') === counts['nobody-at-all@e2e.test']);
      check('a pending address is not mailed again within the cooldown', countMails(users.ivy.email) === counts[users.ivy.email]);
      check('a malformed address -> 400', (await api('POST', '/auth/resend-registration-otp', { json: { email: 'nope' } })).status === 400);
    });
    await step('the verify page offers to resend the code', async () => {
      const { c, p } = await newCtx();
      await p.goto(BASE + '/verify-registration?email=' + encodeURIComponent(users.ivy.email), { waitUntil: 'networkidle0' });
      check('"Resend code" is available', await waitText(p, 'Resend code', 5000));
      await clickButton(p, 'Resend code');
      check('the same neutral confirmation is shown', await waitText(p, 'a new code is on its way', 5000));
      check('a hint points people with an existing account to login / reset', await waitText(p, 'resetting your password', 2000));
      await c.close();
    });

    // ---------------------------------------------------------------- 13
    section = '13 List endpoints are paged';
    let judy;
    const PROJECTS = 105; // more than one page of 100
    await step('105 projects: lists are capped, paged, ordered newest first, and report the total', async () => {
      await registerApi(users.judy);
      judy = await loginApi(users.judy);
      const make = (i) => api('POST', '/projects', { token: judy.token, json: { title: 'Paging Project ' + String(i).padStart(3, '0'), description: 'd', technologies: ['Java'], teamSize: 2 } });
      for (let i = 0; i < PROJECTS; i += 15) {
        // sequential batches of 15, in order, so "newest first" is well defined
        for (let j = i; j < Math.min(i + 15, PROJECTS); j++) await make(j);
      }
      const all = await api('GET', '/projects/me', { token: judy.token });
      check('no parameters: a plain array of all 105 (they fit under the 200 ceiling)', Array.isArray(all.body) && all.body.length === PROJECTS, String(all.body?.length));
      check('...with the total and page size in headers', all.headers.get('x-total-count') === String(PROJECTS) && all.headers.get('x-page') === '0' && all.headers.get('x-page-size') === '200', [...all.headers.entries()].filter(([k]) => k.startsWith('x-')).join(' '));
      check('newest first', all.body[0].title === 'Paging Project 104' && all.body.at(-1).title === 'Paging Project 000', all.body[0].title + ' / ' + all.body.at(-1).title);

      const p0 = await api('GET', '/projects/me?page=0&size=10', { token: judy.token });
      const p10 = await api('GET', '/projects/me?page=10&size=10', { token: judy.token });
      const beyond = await api('GET', '/projects/me?page=11&size=10', { token: judy.token });
      check('page 0 of size 10 has 10 rows and the same total', p0.body.length === 10 && p0.headers.get('x-total-count') === String(PROJECTS) && p0.headers.get('x-page-size') === '10');
      check('the last page holds the remaining 5', p10.body.length === 5, String(p10.body.length));
      check('past the end is an empty array, not an error', beyond.status === 200 && beyond.body.length === 0);
      const big = await api('GET', '/projects/me?size=9999', { token: judy.token });
      check('an oversized page is clamped to 100', big.body.length === 100 && big.headers.get('x-page-size') === '100', big.body.length + ' ' + big.headers.get('x-page-size'));
      const neg = await api('GET', '/projects/me?page=-3&size=0', { token: judy.token });
      check('a negative page and zero size are corrected, not a 500', neg.status === 200 && neg.headers.get('x-page') === '0' && neg.body.length === 1, neg.status + ' ' + neg.headers.get('x-page-size'));
      const seen = new Set();
      for (let page = 0; page < 11; page++) (await api('GET', `/projects/me?page=${page}&size=10`, { token: judy.token })).body.forEach((x) => seen.add(x.id));
      check('walking all pages yields every project exactly once', seen.size === PROJECTS, String(seen.size));
      check('other list endpoints answer too: tasks, files, teams, requests (empty here)', (await Promise.all([
        api('GET', `/projects/${all.body[0].id}/tasks`, { token: judy.token }),
        api('GET', `/projects/${all.body[0].id}/files`, { token: judy.token }),
        api('GET', '/teams/me', { token: judy.token }),
        api('GET', '/requests/received', { token: judy.token }),
        api('GET', '/requests/sent', { token: judy.token }),
        api('GET', '/projects/joined', { token: judy.token }),
      ])).every((r) => r.status === 200 && r.headers.get('x-total-count') === '0'));
    });
    await step('browsers are allowed to read the paging headers (CORS)', async () => {
      const r = await fetch(API + '/projects/me', { headers: { Authorization: 'Bearer ' + judy.token, Origin: 'http://localhost:5173' } });
      const exposed = (r.headers.get('access-control-expose-headers') || '').toLowerCase();
      check('X-Total-Count, X-Page and X-Page-Size are exposed', ['x-total-count', 'x-page', 'x-page-size'].every((h) => exposed.includes(h)), exposed);
    });
    await step('the Projects page still shows every project, fetched a page at a time', async () => {
      const { c, p } = await newCtx();
      const urls = [];
      p.on('request', (req) => { if (/\/api\/projects\/me/.test(req.url())) urls.push(req.url()); });
      await uiLogin(p, users.judy);
      await p.goto(BASE + '/projects', { waitUntil: 'networkidle0' });
      check('the newest project is listed', await waitText(p, 'Paging Project 104', 8000));
      check('and the oldest, which was on the second page', await waitText(p, 'Paging Project 000', 3000));
      check('the browser asked for pages 0 and 1 of 100', urls.some((u) => /page=0/.test(u) && /size=100/.test(u)) && urls.some((u) => /page=1/.test(u)), urls.join(' '));
      await c.close();
    });

    // ---------------------------------------------------------------- 14
    section = '14 Unverified registrations are cleaned up';
    await step('a registration nobody verifies is removed, its name freed; verified accounts stay', async () => {
      // the backend runs with a 30 s limit and a 5 s schedule here (e2e/run.mjs); production defaults are 7 days, daily
      const first = await registerReq(users.kim);
      check('the registration is accepted', first.status === 201, String(first.status));
      const squatted = await registerReq({ username: users.kim.username, email: 'someone-else@e2e.test', password: 'Passw0rd!x' });
      check('while it is pending, its username is taken', squatted.status === 400, String(squatted.status));
      const started = Date.now();
      let freed = false;
      while (Date.now() - started < 70000) {
        await sleep(2500);
        const again = await registerReq({ username: users.kim.username, email: 'someone-else@e2e.test', password: 'Passw0rd!x' });
        if (again.status === 201) { freed = true; break; }
      }
      check('after the limit the username is free again (the pending account was really deleted)', freed, `${Math.round((Date.now() - started) / 1000)}s`);
      check('...within the 30 s limit plus the 5 s schedule and a little slack', Date.now() - started < 50000, `${Math.round((Date.now() - started) / 1000)}s`);
      check('an account that did verify, far older than the limit, still signs in', (await loginApi(users.alice)).status === 200);
    });

    // ---------------------------------------------------------------- 15
    section = '15 A deleted account releases its username and address';
    await step('the same username and e-mail can register again after the account was deleted (bob, section 7)', async () => {
      const again = { ...users.bob, password: 'Passw0rd!again' };
      // Before the fix this was a 409: the deleted row still held the unique username and address
      await registerApi(again);
      const login = await loginApi(again);
      check('the new account verifies and signs in under the old name', login.status === 200 && login.user?.username === users.bob.username, String(login.status));
      check('the deleted account is not resurrected: the old password does not work', (await loginApi(users.bob)).status === 401);
      check('it is a fresh account with none of the old data (no teams, no requests)', (await Promise.all([
        api('GET', '/teams/me', { token: login.token }),
        api('GET', '/requests/sent', { token: login.token }),
        api('GET', '/projects/me', { token: login.token }),
      ])).every((r) => r.status === 200 && r.headers.get('x-total-count') === '0'));
      const dup = await registerReq({ username: users.bob.username, email: 'unrelated@e2e.test', password: 'Passw0rd!x' });
      check('and now the name is taken again by the new account', dup.status === 400, String(dup.status));
    });
    await step('it can be deleted and registered once more (the placeholder names never collide)', async () => {
      const second = { ...users.bob, password: 'Passw0rd!again' };
      const login = await loginApi(second);
      const del = await api('DELETE', '/profile/me', { token: login.token, json: { password: second.password } });
      check('the second account can be deleted', del.status === 200 || del.status === 204, String(del.status));
      await registerApi({ ...users.bob, password: 'Passw0rd!third' });
      check('a third registration of the same name works', (await loginApi({ ...users.bob, password: 'Passw0rd!third' })).status === 200);
    });

    // ---------------------------------------------------------------- 16
    section = '16 History and Achievements on a busy account';
    await step('judy (105 projects, section 13): history is paged, filtered and counted by the database', async () => {
      const first = await api('GET', '/history?size=50', { token: judy.token });
      check('page 0 holds 50 of 105 events', first.status === 200 && first.body.content.length === 50 && first.body.totalElements === PROJECTS, `${first.status} ${first.body.content?.length}/${first.body.totalElements}`);
      check('newest first: the last project created leads', first.body.content[0].title === 'Created "Paging Project 104"', first.body.content[0].title);
      const third = await api('GET', '/history?page=2&size=50', { token: judy.token });
      check('page 2 holds the remaining 5, the oldest last', third.body.content.length === 5 && third.body.content.at(-1).title === 'Created "Paging Project 000"', `${third.body.content.length} ${third.body.content.at(-1)?.title}`);
      const ids = new Set();
      for (let page = 0; page < 3; page++) (await api('GET', `/history?page=${page}&size=50`, { token: judy.token })).body.content.forEach((i) => ids.add(i.id));
      check('every event appears exactly once across the pages', ids.size === PROJECTS, String(ids.size));
      const one = await api('GET', '/history?search=paging%20project%20007', { token: judy.token });
      check('a search narrows it to the one project', one.body.totalElements === 1 && one.body.content[0].title.includes('007'), String(one.body.totalElements));
      const wild = await api('GET', '/history?search=%25', { token: judy.token });
      check('a % in the search is a literal character, not a wildcard', wild.body.totalElements === 0, String(wild.body.totalElements));
      check('type and timeframe filters', (await api('GET', '/history?type=request', { token: judy.token })).body.totalElements === 0
        && (await api('GET', '/history?type=project&timeframe=week', { token: judy.token })).body.totalElements === PROJECTS);
      const stats = await api('GET', '/history/stats', { token: judy.token });
      check('stats are counted, not collected', stats.body.projectsCreated === PROJECTS && stats.body.totalActivities === PROJECTS && stats.body.thisWeek === PROJECTS && stats.body.tasksCompleted === 0, JSON.stringify(stats.body));
    });
    await step('the achievements of that account, and the History page in the browser', async () => {
      const r = await api('GET', '/achievements/me', { token: judy.token });
      const byId = Object.fromEntries(r.body.achievements.map((a) => [a.id, a]));
      check('"Builder" (5 projects) is unlocked and its progress stops at the requirement', byId.builder.isUnlocked === true && byId.builder.progress.current === 5, JSON.stringify(byId.builder.progress));
      check('the project count is exact', r.body.stats.projectsCreated === PROJECTS, String(r.body.stats.projectsCreated));
      const { c, p } = await newCtx();
      await uiLogin(p, users.judy);
      await p.goto(BASE + '/history', { waitUntil: 'networkidle0' });
      check('the History page shows her newest project', await waitText(p, 'Created "Paging Project 104"', 8000));
      await c.close();
    });

    // ---------------------------------------------------------------- 17
    section = '17 People: names, tasks for the owner, profile pages';
    let owen, mia, nia, owenProfile, peopleProject;
    await step('setup: an unnamed owner, a named member and an unnamed person asking to join', async () => {
      for (const u of [users.owen, users.mia, users.nia]) await registerApi(u);
      owen = await loginApi(users.owen);
      mia = await loginApi(users.mia);
      nia = await loginApi(users.nia);
      owenProfile = (await api('GET', '/profile/me', { token: owen.token })).body;
      const proj = await api('POST', '/projects', { token: owen.token, json: { title: 'People Project', description: 'about people', technologies: ['Java'], teamSize: 4 } });
      peopleProject = proj.body;
      const named = await api('PUT', '/profile/me', { token: mia.token, json: { firstname: 'Mia', lastname: 'Moss', bio: 'I weld bridges', education: 'ETH', location: 'Zurich', phone: '+41 79 555 01 23' } });
      await api('POST', '/profile/skills', { token: mia.token, json: { name: 'Welding', proficiency: 'EXPERT' } });
      await api('POST', '/projects', { token: mia.token, json: { title: 'Mia Bridge', description: 'a bridge', technologies: ['Steel'], teamSize: 2 } });
      check('mia fills in her profile', named.status === 200, named.status + ' ' + named.text.slice(0, 100));
      await api('POST', `/requests/join/${peopleProject.id}`, { token: mia.token, json: { message: 'let me weld' } });
      await api('POST', `/requests/join/${peopleProject.id}`, { token: nia.token, json: { message: 'me too' } });
      const pending = await api('GET', '/requests/received?status=PENDING', { token: owen.token });
      const miaRequest = pending.body.data.find((r) => r.requester.username === users.mia.username);
      const approve = await api('POST', `/requests/${miaRequest.id}/approve`, { token: owen.token });
      check('the owner approves mia (nia stays pending)', approve.status === 200, String(approve.status));
    });
    await step('a profile without a name is shown by its username everywhere, never as "New User"', async () => {
      check('a brand-new profile has an empty name, not a placeholder', owenProfile.firstname === '' && owenProfile.lastname === '', JSON.stringify([owenProfile.firstname, owenProfile.lastname]));
      const pending = await api('GET', '/requests/received?status=PENDING', { token: owen.token });
      const niaRequest = pending.body.data.find((r) => r.requester.username === users.nia.username);
      check('the request lists her display name as her username', niaRequest.requester.displayName === users.nia.username, JSON.stringify(niaRequest.requester));
      const team = await api('GET', `/projects/${peopleProject.id}/team`, { token: owen.token });
      check('a named member comes with her display name', team.body[0].displayName === 'Mia Moss', team.text.slice(0, 200));
      const proj = await api('GET', `/projects/${peopleProject.id}`, { token: owen.token });
      check("the project's creator is shown by username too", proj.body.createdBy.displayName === users.owen.username, JSON.stringify(proj.body.createdBy));
      check('nothing in these responses says "New User"', ![niaRequest, team.body, proj.body].some((x) => JSON.stringify(x).includes('New User')));
    });
    await step('a task can be given to the owner, in the create form and the edit form', async () => {
      const { c, p } = await newCtx();
      await uiLogin(p, users.owen);
      // created through the API with no level and no description: the workspace used to crash on both
      await api('POST', `/projects/${peopleProject.id}/tasks`, { token: owen.token, json: { title: 'A task without a description' } });
      await p.goto(BASE + `/project/${peopleProject.id}`, { waitUntil: 'networkidle0' });
      check('the workspace opens for a project that has no level', await waitText(p, 'People Project', 6000));
      await clickExact(p, 'Tasks');
      check('the Tasks tab lists a task that has no description', await waitText(p, 'A task without a description', 6000));
      await clickExact(p, 'New Task');
      await p.waitForSelector('input[placeholder="e.g. Implement Login Page"]', { timeout: 6000 });
      await p.type('input[placeholder="e.g. Implement Login Page"]', 'Weld the first beam');
      const options = await p.evaluate(() => { const s = [...document.querySelectorAll('select')].find((x) => [...x.options].some((o) => o.text === 'Unassigned')); return [...s.options].map((o) => o.text); });
      check('the assignee list offers the owner first, then the team', options[0] === 'Unassigned' && options[1] === `${users.owen.username} (owner)` && options.includes(`Mia Moss (${users.mia.username})`), JSON.stringify(options));
      await p.evaluate((id) => {
        const s = [...document.querySelectorAll('select')].find((x) => [...x.options].some((o) => o.text === 'Unassigned'));
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, id);
        s.dispatchEvent(new Event('change', { bubbles: true }));
      }, owenProfile.id);
      await clickExact(p, 'Create Task');
      await sleep(1200);
      const tasks = await api('GET', `/projects/${peopleProject.id}/tasks`, { token: owen.token });
      const task = tasks.body.find((t) => t.title === 'Weld the first beam');
      check('the task was created and assigned to the owner', task?.assigneeId === owenProfile.id, JSON.stringify(task));
      check('the assignee is named by username, not blank or "New User"', task?.assigneeName === users.owen.username, String(task?.assigneeName));
      check('the board shows the owner as the assignee', await waitText(p, users.owen.username, 4000));
      // the edit form used to list only the team, so an owner-assigned task showed "Unassigned" and saving could clear it
      await p.evaluate(() => {
        // the Edit button of the card that holds the owner's task: climb while the ancestor still has only this one
        // Edit button, and look for the title on the way
        const button = [...document.querySelectorAll('button[title="Edit Task"]')].find((b) => {
          for (let n = b.parentElement; n && n.querySelectorAll('button[title="Edit Task"]').length === 1; n = n.parentElement) {
            if (n.innerText.includes('Weld the first beam')) return true;
          }
          return false;
        });
        button.click();
      });
      await sleep(600);
      const edit = await p.evaluate(() => { const s = [...document.querySelectorAll('select')].find((x) => [...x.options].some((o) => o.text === 'Unassigned') && [...x.options].some((o) => o.text.includes('(owner)'))); return s ? { value: s.value, text: s.options[s.selectedIndex].text } : null; });
      check('opening that task for editing shows the owner as the current assignee', edit && edit.value === owenProfile.id && edit.text.includes('(owner)'), JSON.stringify(edit));
      await c.close();
    });
    await step('the Requests page names the person by username and links to their profile', async () => {
      const { c, p } = await newCtx();
      await uiLogin(p, users.owen);
      await p.goto(BASE + '/requests', { waitUntil: 'networkidle0' });
      check('the unnamed requester appears under her username', await waitText(p, users.nia.username, 8000));
      check('and not as "New User"', !(await text(p)).includes('New User'));
      await p.evaluate((name) => { [...document.querySelectorAll('a')].find((a) => a.innerText.trim() === name).click(); }, users.nia.username);
      await p.waitForFunction((u) => location.pathname === '/users/' + u, { timeout: 6000 }, users.nia.username).catch(() => {});
      check('clicking the name opens her profile page', new URL(p.url()).pathname === '/users/' + users.nia.username, p.url());
      check('which shows her by username', await waitText(p, '@' + users.nia.username, 6000));
      await c.close();
    });
    await step('the profile page shows what is public, and nothing private', async () => {
      const { c, p } = await newCtx();
      await uiLogin(p, users.owen);
      await p.goto(BASE + '/users/' + users.mia.username, { waitUntil: 'networkidle0' });
      check('the page loads her profile', await waitText(p, 'I weld bridges', 8000));
      const body = await text(p);
      check('her name and details are all there', ['Mia Moss', '@' + users.mia.username, 'I weld bridges', 'Zurich', 'ETH'].every((t) => body.includes(t)), body.slice(0, 300));
      check('her skill and the project she started', body.includes('Welding') && body.includes('Mia Bridge'));
      check('no e-mail address and no phone number', !body.includes(users.mia.email) && !body.includes('555 01 23'));
      await shot(p, 'profile-page-mia');
      await p.goto(BASE + '/users/' + users.owen.username, { waitUntil: 'networkidle0' });
      check('looking at yourself offers to edit your profile', await waitText(p, 'Edit my profile', 6000));
      await p.goto(BASE + '/users/nobody_at_all', { waitUntil: 'networkidle0' });
      check('an unknown user gets a clear "no such user" page', await waitText(p, 'No such user', 6000));
      await c.close();
    });
    await step('the profile endpoint needs a login, and unknown accounts are 404', async () => {
      check('without a token -> 401', (await api('GET', `/profile/users/${users.mia.username}`)).status === 401);
      const ok = await api('GET', `/profile/users/${users.mia.username}`, { token: owen.token });
      check('with a token it returns the public part only', ok.status === 200 && ok.body.displayName === 'Mia Moss' && !('email' in ok.body) && !('phone' in ok.body), ok.text.slice(0, 200));
      check('an unknown username -> 404', (await api('GET', '/profile/users/nobody_at_all', { token: owen.token })).status === 404);
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
