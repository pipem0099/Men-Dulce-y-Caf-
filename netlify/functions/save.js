const crypto = require('crypto');
const out = (code, o) => ({ statusCode: code, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
exports.handler = async (ev) => {
  if (ev.httpMethod !== 'POST') return out(405, { ok: false });
  let b; try { b = JSON.parse(ev.body || '{}'); } catch (e) { return out(400, { ok: false }); }
  const a = Buffer.from(String(b.code || '')), k = Buffer.from(process.env.EDIT_CODE || '');
  const ok = k.length > 0 && a.length === k.length && crypto.timingSafeEqual(a, k);
  if (!ok) { await new Promise(r => setTimeout(r, 900)); return out(401, { ok: false }); }
  if (!b.data) return out(200, { ok: true });
  const d = b.data;
  if (!Array.isArray(d.m) || !d.star) return out(400, { ok: false });
  const repo = process.env.GITHUB_REPO, branch = process.env.GITHUB_BRANCH || 'main';
  const url = `https://api.github.com/repos/${repo}/contents/data.json`;
  const h = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'User-Agent': 'dulce-y-cafe', Accept: 'application/vnd.github+json' };
  const g = await fetch(`${url}?ref=${branch}`, { headers: h });
  const sha = g.ok ? (await g.json()).sha : undefined;
  const content = Buffer.from(JSON.stringify(d, null, 1)).toString('base64');
  const r = await fetch(url, { method: 'PUT', headers: h, body: JSON.stringify({ message: 'Actualizar menú', content, branch, sha }) });
  return out(r.ok ? 200 : 502, { ok: r.ok });
};
