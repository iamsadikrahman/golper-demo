global.window = {};
const fs = require('fs');
function loadInto(file, key) {
  const w = {};
  global.window = w;
  eval(fs.readFileSync(file, 'utf8'));
  return w[key] || [];
}
function normName(s) { return String(s || '').replace(/,/g, '').replace(/\s+/g, ' ').trim(); }

const concepts = loadInto('data/concept_byakoron.js', '__C');
const topics = loadInto('data/byakoron.js', '__T');
const overlays = loadInto('hidden_files/u_bn6.js', '__U');
const cByNorm = {};
concepts.forEach(c => { cByNorm[normName(c.topic)] = c; });
const tByNorm = {};
topics.forEach(t => { tByNorm[normName(t.name)] = t; });

let errors = [];
overlays.forEach(ov => {
  const key = normName(ov.topic);
  const c = cByNorm[key];
  const t = tByNorm[key];
  if (!c || !t) { errors.push('not found: ' + ov.topic); return; }
  c.units = ov.units;
  if ((c.cards || []).length !== ov.cards.length) errors.push(ov.topic + ': cards ' + (c.cards || []).length + ' vs ' + ov.cards.length);
  else c.cards.forEach((card, i) => { card.u = ov.cards[i]; });
  const ordered = (c.apply || []).concat(c.deep || []);
  if (ordered.length !== ov.items.length) errors.push(ov.topic + ': concept items ' + ordered.length + ' vs overlay ' + ov.items.length);
  const used = new Array(ordered.length).fill(false);
  ov.items.forEach(entry => {
    let found = -1;
    for (let i = 0; i < ordered.length; i++) { if (!used[i] && ordered[i].q === entry[0]) { found = i; break; } }
    if (found < 0) { errors.push(ov.topic + ': unmatched q ' + String(entry[0]).slice(0, 40)); return; }
    used[found] = true;
    ordered[found].u = entry[1];
  });
  const left = used.filter(x => !x).length;
  if (left) errors.push(ov.topic + ': ' + left + ' concept items unmatched');
  const baseNoU = (t.items || []).filter(i => typeof i.u !== 'number').length;
  if (baseNoU) errors.push(ov.topic + ': ' + baseNoU + ' base items missing u');
  console.log(ov.topic + ': units set, cards ' + ov.cards.length + ', items matched ' + ov.items.length);
});
if (errors.length) { errors.forEach(e => console.log('ERR', e)); process.exit(1); }
fs.writeFileSync('data/concept_byakoron.js', 'window.__C=(window.__C||[]).concat(' + JSON.stringify(concepts) + ');');
console.log('BAKE2 DONE');
