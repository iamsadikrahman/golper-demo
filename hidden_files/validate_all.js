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
  if ((t.cards || []).length !== 6) problems.push(t.name + ': cards=' + (t.cards || []).length + ' (expected 6)');
  const perUnit = new Array(t.units.length).fill(0);
  t.items.forEach(it => {
    if (typeof it.u !== 'number') problems.push(t.name + ': item without u: ' + String(it.q).slice(0, 40));
    else if (it.u < 0 || it.u >= t.units.length) problems.push(t.name + ': item u out of range: ' + String(it.q).slice(0, 40));
    else perUnit[it.u]++;
    if (!it.st || it.st.indexOf(it.a) < 0) problems.push(t.name + ': st lacks a: ' + String(it.q).slice(0, 40));
  });
  perUnit.forEach((n, i) => { if (!n) problems.push(t.name + ': unit ' + i + ' empty'); });
  (t.cards || []).forEach(c => {
    if (typeof c.u !== 'number' || c.u < 0 || c.u >= t.units.length) problems.push(t.name + ': card u invalid');
  });
});
console.log('topics:', TOPICS.length, '(expected 177)');
console.log('facts:', totalFacts, '| cards:', totalCards, '| past merged:', totalPast, '| units total:', totalUnits);
console.log('PAST_EXTRA:', EXTRA.length);
if (EXTRA.length) EXTRA.slice(0, 10).forEach(e => console.log('  EXTRA:', e.bcs, e.q.slice(0, 50)));
console.log('problems:', problems.length);
problems.slice(0, 40).forEach(p => console.log(' -', p));

function agg(filter, label) {
  const ts = TOPICS.filter(filter);
  console.log(label, '| topics:', ts.length, '| facts:', ts.reduce((s, t) => s + t.items.length, 0), '| cards:', ts.reduce((s, t) => s + (t.cards || []).length, 0), '| past:', ts.reduce((s, t) => s + (t.past || []).length, 0), '| units:', ts.reduce((s, t) => s + (t.units || []).length, 0));
}
agg(t => t.subject === 'bangla', 'বাংলা');
agg(t => t.subject === 'english', 'English');
agg(t => t.subject === 'gk' && t.section === 'বাংলাদেশ বিষয়াবলী', 'GK বাংলাদেশ');
agg(t => t.subject === 'gk' && t.section === 'আন্তর্জাতিক বিষয়াবলী', 'GK আন্তর্জাতিক');
agg(t => t.subject === 'math', 'গণিত');

/* dash scan on the six new data files only */
const NEW = ['data/gk_intl.js', 'data/concept_gk_intl.js', 'data/past_gk_intl.js', 'data/math.js', 'data/concept_math.js', 'data/past_math.js'];
NEW.forEach(f => {
  const w = {}; global.window = w;
  eval(fs.readFileSync(f, 'utf8'));
  let hits = 0; const samples = [];
  function walk(o) {
    if (typeof o === 'string') { if (/[-–—]/.test(o)) { hits++; if (samples.length < 3) samples.push(o.slice(0, 70)); } return; }
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  }
  walk(w.__T || []); walk(w.__C || []); walk(w.__P || []);
  console.log('DASH', f, 'strings with dash:', hits);
  samples.forEach(s => console.log('   e.g.', s));
});
global.window = {};
