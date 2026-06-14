// Vercel serverless function: saves the work list to the repo on the client's
// behalf, authenticated by a shared passcode — NOT the client's GitHub account.
//
// Requires two environment variables in Vercel:
//   ADMIN_PASSWORD  the passcode you give the client
//   GITHUB_TOKEN    a fine-grained Personal Access Token (your account) with
//                   "Contents: Read and write" on the fiveofifty repo only
// Optional: GITHUB_REPO (default oceanssaint-bot/fiveofifty), GITHUB_BRANCH (main)
const crypto = require('crypto');

function safeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    if (typeof req.body === 'string') { try { return resolve(JSON.parse(req.body)); } catch { return resolve(null); } }
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const send = (code, obj) => { res.statusCode = code; res.end(JSON.stringify(obj)); };

  if (req.method !== 'POST') return send(405, { error: 'Method not allowed' });

  const ADMIN = process.env.ADMIN_PASSWORD;
  const TOKEN = process.env.GITHUB_TOKEN;
  const REPO = process.env.GITHUB_REPO || 'oceanssaint-bot/fiveofifty';
  const BRANCH = process.env.GITHUB_BRANCH || 'main';
  const FILE = 'data/videos.json';

  if (!ADMIN || !TOKEN) return send(500, { error: 'Server not configured (missing ADMIN_PASSWORD or GITHUB_TOKEN).' });

  const body = await readBody(req);
  if (!body) return send(400, { error: 'Invalid request body.' });
  if (!safeEqual(body.key || '', ADMIN)) return send(401, { error: 'Wrong passcode.' });

  // lock-screen check: valid passcode, nothing to save
  if (body.verify) return send(200, { ok: true });

  if (!Array.isArray(body.videos)) return send(400, { error: 'Missing videos array.' });

  // normalise to the known shape and drop incomplete rows
  const clean = body.videos.map((v) => ({
    title: String(v.title || '').trim(),
    category: String(v.category || '').trim(),
    year: String(v.year || '').trim(),
    platform: String(v.platform || 'youtube').toLowerCase() === 'vimeo' ? 'vimeo' : 'youtube',
    url: String(v.url || '').trim(),
    description: String(v.description || '').trim(),
    thumbnail: String(v.thumbnail || '').trim(),
    featured: !!v.featured,
  })).filter((v) => v.title && v.url);

  const json = JSON.stringify({ videos: clean }, null, 2) + '\n';
  const api = `https://api.github.com/repos/${REPO}/contents/${FILE}`;
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'fiveofifty-cms',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  try {
    // current file SHA (required to update an existing file)
    let sha;
    const cur = await fetch(`${api}?ref=${BRANCH}`, { headers });
    if (cur.ok) sha = (await cur.json()).sha;
    else if (cur.status !== 404) throw new Error(`read ${cur.status}: ${await cur.text()}`);

    const put = await fetch(api, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Update work list via CMS',
        content: Buffer.from(json, 'utf8').toString('base64'),
        branch: BRANCH,
        sha,
      }),
    });
    if (!put.ok) throw new Error(`write ${put.status}: ${await put.text()}`);

    const result = await put.json();
    return send(200, { ok: true, count: clean.length, commit: result.commit && result.commit.sha });
  } catch (e) {
    return send(502, { error: String((e && e.message) || e) });
  }
};
