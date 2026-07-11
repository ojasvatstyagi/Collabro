import net from 'node:net';

/**
 * A minimal SMTP server that keeps every received message in memory, so the suite can read the one-time codes
 * the backend e-mails. Not a real mail server: it accepts anything, from anyone, and never relays.
 */

const decodePart = (headers, body) => {
  const encoding = /content-transfer-encoding:\s*(\S+)/i.exec(headers)?.[1]?.toLowerCase();
  if (encoding === 'base64') return Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8');
  if (encoding === 'quoted-printable') {
    return body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
  return body;
};

const splitHeaders = (message) => {
  const at = message.search(/\r?\n\r?\n/);
  return at < 0 ? [message, ''] : [message.slice(0, at), message.slice(at).replace(/^\r?\n\r?\n/, '')];
};

/** The text/html part of a (possibly nested multipart) message, decoded, or null. */
export const htmlBody = (message) => {
  const [headers, body] = splitHeaders(message);
  const type = /content-type:\s*([^\r\n;]+)/i.exec(headers)?.[1] ?? '';
  const boundary = /boundary="?([^"\r\n;]+)"?/i.exec(headers)?.[1];
  if (/multipart/i.test(type) && boundary) {
    for (const part of body.split('--' + boundary)) {
      const html = htmlBody(part.replace(/^\r?\n/, ''));
      if (html) return html;
    }
    return null;
  }
  return /text\/html/i.test(type) ? decodePart(headers, body) : null;
};

export function startSmtpSink(port) {
  const messages = [];
  const server = net.createServer((socket) => {
    let to = [];
    let data = null; // while receiving a message body
    let buffer = '';
    const reply = (line) => socket.write(line + '\r\n');
    reply('220 e2e-sink ready');

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let eol;
      while ((eol = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, eol + 1).replace(/\r?\n$/, '');
        buffer = buffer.slice(eol + 1);

        if (data !== null) {
          if (line === '.') {
            const raw = data.join('\r\n');
            const subject = /^subject:\s*(.*)$/im.exec(raw)?.[1]?.trim();
            messages.push({ t: Date.now() / 1000, to, subject, body: htmlBody(raw) ?? raw });
            data = null; to = [];
            reply('250 queued');
          } else {
            data.push(line.startsWith('..') ? line.slice(1) : line); // undo SMTP dot-stuffing
          }
          continue;
        }
        const command = line.trim().toUpperCase();
        if (command.startsWith('EHLO') || command.startsWith('HELO')) { socket.write('250-e2e-sink\r\n250 8BITMIME\r\n'); }
        else if (command.startsWith('RCPT TO')) { to.push(/<([^>]+)>/.exec(line)?.[1] ?? ''); reply('250 OK'); }
        else if (command === 'DATA') { data = []; reply('354 end with <CRLF>.<CRLF>'); }
        else if (command === 'QUIT') { reply('221 bye'); socket.end(); }
        else reply('250 OK');
      }
    });
    socket.on('error', () => {});
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve({ messages, close: () => server.close() }));
  });
}
