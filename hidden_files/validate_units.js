global.window = {};
const fs = require('fs');
const tags = fs.readFileSync('/tmp/scriptlist.txt', 'utf8').trim().split('\n');
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
  if (c.units) t.units = c.units;
  t.items = t.items.concat(c.apply || []).concat(c.deep || []);
});
TOPICS.forEach(t => {
  const seen = {};
  t.items = t.items.filter(it => { const k = it.q + '|' + it.a; if (seen[k]) return false; seen[k] = true; return true; });
});
let problems = [];
let totalFacts = 0, totalCards = 0, totalPast = 0, totalUnits = 0;
TOPICS.forEach(t => {
  totalFacts += t.items.length; totalCards += (t.cards || []).length; totalPast += (t.past || []).length;
  if (!t.units || !t.units.length) { problems.push(t.name + ': no units'); return; }
  totalUnits += t.units.length;
  if (t.units.length < 4 || t.units.length > 6) problems.push(t.name + ': units=' + t.units.length);
  const perUnit = new Array(t.units.length).fill(0);
  t.items.forEach(it => {
    if (typeof it.u !== 'number') problems.push(t.name + ': item without u: ' + String(it.q).slice(0, 40));
    else if (it.u < 0 || it.u >= t.units.length) problems.push(t.name + ': item u out of range');
    else perUnit[it.u]++;
    if (!it.st || it.st.indexOf(it.a) < 0) problems.push(t.name + ': st lacks a: ' + String(it.q).slice(0, 40));
  });
  perUnit.forEach((n, i) => { if (!n) problems.push(t.name + ': unit ' + i + ' empty'); });
  (t.cards || []).forEach(c => {
    if (typeof c.u !== 'number' || c.u < 0 || c.u >= t.units.length) problems.push(t.name + ': card u invalid');
  });
  t.units.forEach((un, i) => {
    const lines = String(un.d || '').split('\n').filter(x => x.trim()).length;
    if (lines < 4) problems.push(t.name + ': unit ' + i + ' teach text only ' + lines + ' lines');
  });
  if (t.items.length < 32) problems.push(t.name + ': only ' + t.items.length + ' items');
  if ((t.cards || []).length < 5) problems.push(t.name + ': only ' + (t.cards || []).length + ' cards');
});
console.log('topics:', TOPICS.length, '| facts:', totalFacts, '| cards:', totalCards, '| past merged:', totalPast, '| units total:', totalUnits);
console.log('PAST_EXTRA:', EXTRA.length);
console.log('problems:', problems.length);
problems.slice(0, 25).forEach(p => console.log(' -', p));
let dashHits = 0;
function scan(s) { if (typeof s === 'string' && /[-–—]/.test(s)) dashHits++; }
TOPICS.forEach(t => (t.units || []).forEach(un => { scan(un.t); scan(un.d); }));
console.log('dash hits in unit texts (all subjects):', dashHits);
const en = TOPICS.filter(t => t.subject === 'english');
const bnT = TOPICS.filter(t => t.subject !== 'english');
console.log('english topics:', en.length, 'facts:', en.reduce((s, t) => s + t.items.length, 0), 'cards:', en.reduce((s, t) => s + (t.cards || []).length, 0));
console.log('bangla topics:', bnT.length, 'facts:', bnT.reduce((s, t) => s + t.items.length, 0), 'cards:', bnT.reduce((s, t) => s + (t.cards || []).length, 0));
