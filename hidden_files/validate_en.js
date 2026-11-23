global.window = {};
const fs = require('fs');
const tags = fs.readFileSync('/tmp/scriptlist.txt', 'utf8').trim().split('\n');
console.log('script files in order:', tags.length);
tags.forEach(f => { eval(fs.readFileSync(f, 'utf8')); });
const TOPICS = (window.__T || []).slice();
function normName(s) { return String(s || '').replace(/,/g, '').replace(/\s+/g, ' ').trim(); }
const BY = {};
TOPICS.forEach(t => { BY[normName(t.name)] = t; t.past = t.past || []; });
const EXTRA = [];
(window.__P || []).forEach(p => {
  const t = BY[normName(p.topic)];
  const e = { q: p.q, opts: p.opts, ans: p.ans, bcs: p.bcs, tag: p.tag || null };
  if (t) { if (!t.past.some(x => x.q === p.q)) t.past.push(e); }
  else if (!EXTRA.some(x => x.q === p.q && x.bcs === p.bcs)) EXTRA.push(e);
});
(window.__C || []).forEach(c => {
  const t = BY[normName(c.topic)];
  if (!t) { console.log('ORPHAN concept:', c.topic); return; }
  t.cards = c.cards || [];
  t.items = t.items.concat(c.apply || []).concat(c.deep || []);
});
TOPICS.forEach(t => {
  const seen = {};
  t.items = t.items.filter(it => { const k = it.q + '|' + it.a; if (seen[k]) return false; seen[k] = true; return true; });
});
const en = TOPICS.filter(t => t.subject === 'english');
const bnTopics = TOPICS.filter(t => t.subject !== 'english');
console.log('TOTAL topics:', TOPICS.length, '| english:', en.length, '| bangla:', bnTopics.length);
let ef = 0, ec = 0, ep = 0, issues = [];
en.forEach(t => {
  ef += t.items.length; ec += (t.cards || []).length; ep += (t.past || []).length;
  if (t.items.length < 41) issues.push(t.name + ' items=' + t.items.length);
  if ((t.cards || []).length !== 6) issues.push(t.name + ' cards=' + (t.cards || []).length);
});
console.log('english facts:', ef, '| english cards:', ec, '| english past merged:', ep);
console.log('PAST_EXTRA (অন্যান্য):', EXTRA.length);
EXTRA.slice(0, 5).forEach(p => console.log('  extra:', p.topic, '|', String(p.q).slice(0, 50)));
console.log('issues:', issues.length ? issues : 'none');
let bf = 0, bp = 0;
bnTopics.forEach(t => { bf += t.items.length; bp += (t.past || []).length; });
console.log('bangla facts:', bf, '| bangla past merged:', bp);
const pools = {};
en.forEach(t => t.items.forEach(it => { (pools[it.pool] = pools[it.pool] || new Set()).add(it.a); }));
const small = Object.entries(pools).filter(([k, v]) => v.size < 4).map(([k, v]) => k + '=' + v.size);
console.log('english pools:', Object.keys(pools).length, '| pools with <4 answers:', small.length ? small : 'none');
let dashHits = [];
function scan(s, where) { if (typeof s === 'string' && /[-–—]/.test(s)) dashHits.push(where + ': ' + s.slice(0, 60)); }
en.forEach(t => {
  scan(t.intro, t.name + ' intro');
  t.items.forEach(it => { scan(it.q, 'q'); scan(it.a, 'a'); scan(it.st, 'st'); scan(it.fact, 'fact'); });
  (t.cards || []).forEach(c => { scan(c.h, 'card h'); scan(c.lead, 'card lead'); scan(c.trap, 'card trap'); scan(JSON.stringify(c.viz), 'card viz'); });
  (t.past || []).forEach(p => { scan(p.q, 'past q'); p.opts.forEach(o => scan(o, 'past opt')); });
});
console.log('dash hits in english content:', dashHits.length);
dashHits.slice(0, 10).forEach(h => console.log(' ', h));
const secs = {};
en.forEach(t => { secs[t.section] = (secs[t.section] || 0) + 1; });
console.log('english sections:', JSON.stringify(secs));
let badAns = 0;
en.forEach(t => (t.past || []).forEach(p => { if (!(p.ans >= 0 && p.ans < p.opts.length)) badAns++; }));
console.log('english past with invalid ans index:', badAns);
en.forEach(t => console.log('  EN:', t.name, '| items', t.items.length, '| cards', (t.cards || []).length, '| past', (t.past || []).length));
