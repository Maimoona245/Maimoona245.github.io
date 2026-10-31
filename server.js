'use strict';
const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';          // set to enable GET /api/messages
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';    // e.g. https://yourname.github.io

app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '10kb' }));

// Basic security headers
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  next();
});

// Optional CORS, only needed if the frontend is hosted on another domain
app.use('/api', (req, res, next) => {
  if (ALLOWED_ORIGIN) {
    res.set({
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    });
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  next();
});

// ---------- Storage (JSON file) ----------
function readMessages() {
  try { return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')); }
  catch { return []; }
}
function saveMessage(msg) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const all = readMessages();
  all.push(msg);
  const tmp = MESSAGES_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(all, null, 2));
  fs.renameSync(tmp, MESSAGES_FILE);
}

// ---------- Tiny in-memory rate limiter: 5 messages / 10 min / IP ----------
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) {
    return res.status(429).json({ error: 'Too many messages. Please try again in a few minutes.' });
  }
  recent.push(now);
  hits.set(ip, recent);
  next();
}
setInterval(() => hits.clear(), 60 * 60 * 1000).unref();

// ---------- Validation ----------
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);

function validate(body) {
  const d = {
    name: clean(body.name, 100),
    email: clean(body.email, 150),
    phone: clean(body.phone, 20),
    subject: clean(body.subject, 120),
    message: String(body.message ?? '').trim().slice(0, 2000)
  };
  const errors = [];
  if (d.name.length < 2) errors.push('Please enter your full name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) errors.push('Please enter a valid email address.');
  const digits = d.phone.replace(/\D/g, '');
  if (!/^[0-9+\-\s()]+$/.test(d.phone) || digits.length < 10 || digits.length > 15) errors.push('Please enter a valid phone number.');
  if (d.subject.length < 3) errors.push('Please enter a subject.');
  if (d.message.length < 10) errors.push('Message must be at least 10 characters.');
  return { d, errors };
}

// ---------- API ----------
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.post('/api/contact', rateLimit, (req, res) => {
  const body = req.body || {};
  if (body.website) return res.json({ ok: true });          // honeypot: silently drop bots
  const { d, errors } = validate(body);
  if (errors.length) return res.status(400).json({ error: errors[0], errors });
  try {
    saveMessage({ id: Date.now().toString(36), receivedAt: new Date().toISOString(), ...d });
    console.log(`New message from ${d.name} <${d.email}> — ${d.subject}`);
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('Save failed:', err);
    res.status(500).json({ error: 'Could not save your message. Please call us instead.' });
  }
});

// Owner-only: GET /api/messages  with header  Authorization: Bearer <ADMIN_TOKEN>
app.get('/api/messages', (req, res) => {
  if (!ADMIN_TOKEN || req.get('Authorization') !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(readMessages().reverse());
});

// ---------- Static site (whitelist, so server.js and data/ are never exposed) ----------
const PAGES = ['index', 'about', 'services', 'contact'];
const sendFile = (file, maxAge) => (req, res) =>
  res.sendFile(path.join(ROOT, file), { maxAge });

app.get('/', sendFile('index.html', 0));
PAGES.forEach(p => {
  app.get(`/${p}.html`, sendFile(`${p}.html`, 0));
  if (p !== 'index') app.get(`/${p}`, sendFile(`${p}.html`, 0));
});
app.get('/style.css', sendFile('style.css', '7d'));
app.get('/script.js', sendFile('script.js', '7d'));
app.use('/images', express.static(path.join(ROOT, 'images'), { maxAge: '30d', immutable: true, index: false }));

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.status(404).type('html').send('<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found — Zaina Boutique</title><link rel="stylesheet" href="/style.css"></head><body><main class="section" style="text-align:center;min-height:70vh"><h1>404</h1><p>This page could not be found.</p><p><a class="btn btn-primary" href="/">Back to Home</a></p></main></body></html>');
});

app.listen(PORT, () => console.log(`Zaina Boutique running on http://localhost:${PORT}`));
