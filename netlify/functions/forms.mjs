// Website form backend. Two separate paths, each with its own Airtable table and email automation:
//   /api/inquiry  -> "Let's talk" project inquiries  -> Inquiries table
//   /api/careers  -> job / crew candidates            -> Candidates table
//
// For each path:
//   GET  <path>/challenge  -> a signed spam-check question
//   POST <path>            -> checks spam, creates the Airtable record (Status empty)
//   POST <path>/file       -> uploads one file (<= 5 MB) into the record's Files field
//   POST <path>/finalize   -> sets Status = New, which triggers the email automation
//
// Env: AIRTABLE_TOKEN (required, a personal access token with data.records:read and
// data.records:write on the base). Optional: AIRTABLE_BASE_ID, FORM_SECRET, ALLOWED_ORIGINS.
//
// Storage lives in `store` below. To send submissions somewhere else later (e.g. Stagera),
// add another store with the same methods and call it from the handlers.

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appgYkcGw0nXOUdxm';
const TABLES = { inquiry: 'tblWaiL5ejkifUlIw', careers: 'tbluthP7XqMQCgx4I' };
const MAX_FILE_BYTES = 5 * 1024 * 1024; // Airtable's uploadAttachment limit
const MAX_FILES = 10;
const MIN_FILL_MS = 4000; // bots submit instantly
const MAX_FILL_MS = 6 * 60 * 60 * 1000;
const ALLOWED_EXT = /\.(pdf|png|jpe?g|gif|webp|heic|svg|tiff?|dwg|dxf|vwx|skp|doc|docx|xls|xlsx|csv|ppt|pptx|key|pages|numbers|txt|rtf|zip|mp4|mov)$/i;

const CHOICES = {
  site: ['Control Video', 'LED Truck Co.'],
  eventType: ['Gala / conference', 'Corporate / forum', 'Festival / concert', 'Sporting / activation', 'Government / civic', 'LED truck rental', 'Other'],
  audience: ['Under 100', '100–500', '500–2,000', '2,000–10,000', '10,000+', 'Not sure yet'],
  budget: ['Under $10k', '$10k–$25k', '$25k–$75k', '$75k–$150k', '$150k+', 'Not sure yet'],
  services: ['LED walls', 'Projection', 'Cameras / IMAG', 'Livestream / webcast', 'Audio', 'Lighting', 'LED truck or trailer', 'Show calling / crew'],
  roles: ['Video engineer', 'LED technician', 'Camera operator', 'Audio', 'Lighting', 'Project / production manager', 'Driver / rigger (LED trucks)', 'Other'],
  availability: ['Full-time', 'Freelance / crew call', 'Either'],
  experience: ['Under 1', '1–3', '3–7', '7+'],
};

// Maps a validated submission to Airtable fields, per path.
const BUILD = {
  inquiry(data, common) {
    const links = clean(data.links, 4000);
    return {
      ...common,
      Organization: clean(data.organization, 200) || undefined,
      Site: pick(data.site, CHOICES.site),
      'Event type': pick(data.eventType, CHOICES.eventType),
      'Event date': /^\d{4}-\d{2}-\d{2}$/.test(data.eventDate || '') ? data.eventDate : undefined,
      'Venue / location': clean(data.venue, 300) || undefined,
      'Audience size': pick(data.audience, CHOICES.audience),
      Budget: pick(data.budget, CHOICES.budget),
      Services: pickMany(data.services, CHOICES.services),
      Details: common.details || undefined,
      'Shared links': links || undefined,
      details: undefined,
    };
  },
  careers(data, common) {
    return {
      ...common,
      Location: clean(data.location, 200) || undefined,
      Roles: pickMany(data.roles, CHOICES.roles),
      Availability: pick(data.availability, CHOICES.availability),
      'Years of experience': pick(data.experience, CHOICES.experience),
      'Portfolio / LinkedIn': clean(data.links, 4000) || undefined,
      About: common.details || undefined,
      details: undefined,
    };
  },
};
const DETAILS_FIELD = { inquiry: 'Details', careers: 'About' };

// ---------- signing (spam challenge + upload tokens) ----------

const enc = new TextEncoder();
let keyPromise;
function key() {
  const secret = process.env.FORM_SECRET || 'cv-form:' + (process.env.AIRTABLE_TOKEN || '');
  keyPromise ||= crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return keyPromise;
}
async function sign(value) {
  const sig = await crypto.subtle.sign('HMAC', await key(), enc.encode(value));
  return Buffer.from(sig).toString('base64url');
}
async function verify(value, sig) {
  const expected = await sign(value);
  if (typeof sig !== 'string' || sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// ---------- Airtable store ----------

const store = {
  async create(table, fields) {
    const r = await airtable(`https://api.airtable.com/v0/${BASE_ID}/${table}`, {
      method: 'POST',
      body: JSON.stringify({ fields, typecast: false }),
    });
    return r.id;
  },
  async attach(recordId, filename, contentType, bytes) {
    await airtable(`https://content.airtable.com/v0/${BASE_ID}/${recordId}/Files/uploadAttachment`, {
      method: 'POST',
      body: JSON.stringify({ contentType, filename, file: Buffer.from(bytes).toString('base64') }),
    });
  },
  async update(table, recordId, fields) {
    await airtable(`https://api.airtable.com/v0/${BASE_ID}/${table}/${recordId}`, {
      method: 'PATCH',
      body: JSON.stringify({ fields }),
    });
  },
  async get(table, recordId) {
    return airtable(`https://api.airtable.com/v0/${BASE_ID}/${table}/${recordId}`, { method: 'GET' });
  },
};

async function airtable(url, init) {
  const token = process.env.AIRTABLE_TOKEN;
  if (!token) throw new HttpError(503, 'The form is not configured yet.');
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Airtable error', res.status, JSON.stringify(body));
    throw new HttpError(502, 'We couldn’t save that just now.');
  }
  return body;
}

// ---------- handlers ----------

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function challenge() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 1 + Math.floor(Math.random() * 9);
  const ts = Date.now();
  const payload = `${ts}.${a + b}`;
  return {
    question: `What is ${a} + ${b}?`,
    ts,
    token: await sign(`challenge:${payload}`),
  };
}

async function submit(kind, req) {
  const data = await req.json().catch(() => null);
  if (!data || typeof data !== 'object') throw new HttpError(400, 'Invalid submission.');

  // 1. Honeypot: a hidden field people never see.
  if (data.website) throw new HttpError(400, 'Submission rejected.');

  // 2. Signed challenge: correct answer, not too fast, not stale.
  const ts = Number(data.ts);
  const answer = String(data.answer ?? '').trim();
  const age = Date.now() - ts;
  if (!Number.isFinite(ts) || !(await verify(`challenge:${ts}.${answer}`, data.token))) {
    throw new HttpError(400, 'That answer doesn’t look right. Try the check again.');
  }
  if (age < MIN_FILL_MS || age > MAX_FILL_MS) {
    throw new HttpError(400, 'That took an unusual amount of time. Please try the check again.');
  }

  // 3. Content checks.
  const name = clean(data.name, 120);
  const email = clean(data.email, 200);
  if (!name) throw new HttpError(400, 'Please add your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, 'Please add a valid email address.');
  const details = clean(data.details, 10000);
  if ((details.match(/https?:\/\//g) || []).length > 8) throw new HttpError(400, 'Please put links in the links box.');

  const fields = BUILD[kind](data, {
    Name: name,
    Email: email,
    Phone: clean(data.phone, 40) || undefined,
    'Source page': /^https?:\/\//.test(data.page || '') ? String(data.page).slice(0, 500) : undefined,
    details,
  });
  for (const k of Object.keys(fields)) if (fields[k] === undefined) delete fields[k];

  const id = await store.create(TABLES[kind], fields);
  return { id, uploadToken: await sign(`upload:${kind}:${id}`) };
}

async function upload(kind, req) {
  const id = req.headers.get('x-record') || '';
  if (!/^rec[A-Za-z0-9]{14}$/.test(id) || !(await verify(`upload:${kind}:${id}`, req.headers.get('x-upload-token')))) {
    throw new HttpError(403, 'Upload not allowed.');
  }
  const filename = decodeURIComponent(req.headers.get('x-filename') || '').replace(/[\\/\r\n]/g, '_').slice(0, 200);
  if (!filename || !ALLOWED_EXT.test(filename)) throw new HttpError(415, `${filename || 'That file'} isn’t a supported file type.`);
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (!bytes.length) throw new HttpError(400, 'Empty file.');
  if (bytes.length > MAX_FILE_BYTES) throw new HttpError(413, `${filename} is over 5 MB. Share it as a link instead.`);

  const record = await store.get(TABLES[kind], id);
  if (record.fields?.Status) throw new HttpError(409, 'This inquiry is already submitted.');
  if ((record.fields?.Files || []).length >= MAX_FILES) throw new HttpError(413, `Up to ${MAX_FILES} files per inquiry.`);

  const type = req.headers.get('content-type') || 'application/octet-stream';
  await store.attach(id, filename, type, bytes);
  return { ok: true };
}

async function finalize(kind, req) {
  const data = await req.json().catch(() => ({}));
  const id = String(data.id || '');
  if (!/^rec[A-Za-z0-9]{14}$/.test(id) || !(await verify(`upload:${kind}:${id}`, data.uploadToken))) {
    throw new HttpError(403, 'Not allowed.');
  }
  const record = await store.get(TABLES[kind], id);
  if (record.fields?.Status) return { ok: true };
  const failed = Array.isArray(data.failedFiles) ? data.failedFiles.map((f) => clean(f, 200)).filter(Boolean) : [];
  const fields = { Status: 'New' };
  if (failed.length) {
    const f = DETAILS_FIELD[kind];
    fields[f] = [record.fields?.[f], `Files that failed to upload: ${failed.join(', ')}`].filter(Boolean).join('\n\n');
  }
  await store.update(TABLES[kind], id, fields);
  return { ok: true };
}

// ---------- helpers ----------

function clean(v, max) {
  return typeof v === 'string' ? v.replace(/\u0000/g, '').trim().slice(0, max) : '';
}
function pick(v, list) {
  return list.includes(v) ? v : undefined;
}
function pickMany(v, list) {
  const out = Array.isArray(v) ? v.filter((s) => list.includes(s)) : [];
  return out.length ? out : undefined;
}

function corsHeaders(req) {
  const origin = req.headers.get('origin');
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://controlvideodc5-tech.github.io').split(',').map((s) => s.trim());
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Record, X-Upload-Token, X-Filename',
    Vary: 'Origin',
  };
}

export default async (req) => {
  const cors = corsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const path = new URL(req.url).pathname.replace(/\/+$/, '');
  const [, , kind, action = ''] = path.split('/'); // /api/<kind>/<action>
  try {
    let body;
    if (!TABLES[kind]) throw new HttpError(404, 'Not found.');
    if (req.method === 'GET' && action === 'challenge') body = await challenge();
    else if (req.method === 'POST' && action === 'file') body = await upload(kind, req);
    else if (req.method === 'POST' && action === 'finalize') body = await finalize(kind, req);
    else if (req.method === 'POST' && action === '') body = await submit(kind, req);
    else throw new HttpError(404, 'Not found.');
    return Response.json(body, { headers: { ...cors, 'Cache-Control': 'no-store' } });
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    return Response.json({ error: status === 500 ? 'Something went wrong.' : err.message }, { status, headers: cors });
  }
};

export const config = { path: ['/api/inquiry', '/api/inquiry/*', '/api/careers', '/api/careers/*'] };
