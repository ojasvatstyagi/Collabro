#!/usr/bin/env node
/**
 * Starts the whole stack (mail sink, backend on an in-memory database, frontend dev server), runs the browser
 * suite against it and stops everything again. Nothing touches a real database or sends real e-mail.
 *
 *   npm install        (once, in this folder)
 *   npm test
 *
 * Environment: MVN (default "mvn"), MVN_ARGS (e.g. "-o" for offline), CHROME_PATH, E2E_SMTP_PORT.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startSmtpSink } from './smtp-sink.mjs';
import { runSuite } from './suite.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const BACKEND_PORT = 8080; // the frontend dev server proxies /api here, so it cannot be changed from the outside
const FRONTEND_PORT = 5173;
const SMTP_PORT = Number(process.env.E2E_SMTP_PORT || 2525);
const uploadsDir = path.join(root, 'backend', 'target', 'e2e-uploads');
const logDir = path.join(here, 'logs');
fs.mkdirSync(logDir, { recursive: true });

const children = [];
const stopAll = () => {
  for (const child of children) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { /* already gone */ }
  }
};
process.on('exit', stopAll);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { stopAll(); process.exit(130); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const portFree = (port) => new Promise((resolve) => {
  const probe = net.createServer().once('error', () => resolve(false)).once('listening', () => probe.close(() => resolve(true)));
  probe.listen(port, '127.0.0.1');
});

function chromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome/Chromium executable.');
  return found;
}

function start(name, command, args, options) {
  const log = fs.openSync(path.join(logDir, `${name}.log`), 'w');
  const child = spawn(command, args, { ...options, stdio: ['ignore', log, log], detached: true });
  child.on('exit', (code) => { if (code && !child.killedByUs) console.error(`[e2e] ${name} exited early with code ${code}; see e2e/logs/${name}.log`); });
  children.push(child);
  return child;
}

async function waitFor(what, url, accept, timeoutMs) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try { const res = await fetch(url); if (accept(res.status)) return; } catch { /* not up yet */ }
    await sleep(1000);
  }
  throw new Error(`${what} did not become ready within ${timeoutMs / 1000}s (see e2e/logs)`);
}

async function main() {
  for (const [name, port] of [['backend', BACKEND_PORT], ['frontend', FRONTEND_PORT], ['mail sink', SMTP_PORT]]) {
    if (!(await portFree(port))) throw new Error(`Port ${port} (${name}) is already in use. Stop whatever is using it and retry.`);
  }
  const chrome = chromePath();
  fs.rmSync(uploadsDir, { recursive: true, force: true });

  const sink = await startSmtpSink(SMTP_PORT);

  console.log('[e2e] starting backend (in-memory database)...');
  start('backend', process.env.MVN || 'mvn', [
    ...(process.env.MVN_ARGS ? process.env.MVN_ARGS.split(/\s+/) : []),
    '-q', 'spring-boot:run', '-Dspring-boot.run.useTestClasspath=true', // test classpath brings in H2
  ], {
    cwd: path.join(root, 'backend'),
    env: {
      ...process.env,
      DB_URL: 'jdbc:h2:mem:e2e;MODE=MySQL;DB_CLOSE_DELAY=-1', DB_USERNAME: 'sa', DB_PASSWORD: '',
      MAIL_HOST: '127.0.0.1', MAIL_PORT: String(SMTP_PORT), MAIL_USERNAME: 'e2e', MAIL_PASSWORD: 'e2e',
      JWT_SECRET: 'e2e-only-secret-key-for-local-testing-0123456789abcdef', UPLOAD_DIR: uploadsDir,
    },
  });

  console.log('[e2e] starting frontend...');
  start('frontend', 'npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(FRONTEND_PORT), '--strictPort'], {
    cwd: path.join(root, 'frontend'), env: process.env,
  });

  await waitFor('backend', `http://127.0.0.1:${BACKEND_PORT}/api/matching/search`, (s) => s === 200, 180000);
  await waitFor('frontend', `http://127.0.0.1:${FRONTEND_PORT}/`, (s) => s === 200, 60000);
  console.log('[e2e] stack is up, running the suite\n');

  const { results, failed } = await runSuite({
    base: `http://127.0.0.1:${FRONTEND_PORT}`,
    mails: () => sink.messages,
    uploadsDir,
    chromePath: chrome,
    shotsDir: path.join(here, 'shots'),
  });
  fs.writeFileSync(path.join(here, 'results.json'), JSON.stringify(results, null, 2));
  sink.close();
  return failed.length === 0 ? 0 : 1;
}

main().then((code) => process.exit(code)).catch((error) => {
  console.error('\n[e2e] could not run:', error.message);
  process.exit(2);
});
