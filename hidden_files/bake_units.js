global.window = {};
const fs = require('fs');
function loadInto(file, key) {
  const w = {};
  global.window = w;
  eval(fs.readFileSync(file, 'utf8'));
  return w[key] || [];
}
function normName(s) { return String(s || '').replace(/,/g, '').replace(/\s+/g, ' ').trim(); }

const topicFiles = ['data/sahitya_prachin.js', 'data/sahitya_adhunik.js', 'data/byakoron.js'];
const conceptFiles = ['data/concept_byakoron.js', 'data/concept_sahitya.js', 'data/concept_extra_bn.js'];
const overlayFiles = ['hidden_files/u_bn1.js', 'hidden_files/u_bn2.js', 'hidden_files/u_bn3.js', 'hidden_files/u_bn4.js', 'hidden_files/u_bn5.js'];

const topicsByFile = topicFiles.map(f => ({ file: f, list: loadInto(f, '__T') }));
const conceptsByFile = conceptFiles.map(f => ({ file: f, list: loadInto(f, '__C') }));
let overlays = [];
overlayFiles.forEach(f => { overlays = overlays.concat(loadInto(f, '__U')); });
console.log('overlays:', overlays.length);

const topicByNorm = {};
topicsByFile.forEach(tf => tf.list.forEach(t => { topicByNorm[normName(t.name)] = t; }));
const conceptByNorm = {};
conceptsByFile.forEach(cf => cf.list.forEach(c => { conceptByNorm[normName(c.topic)] = c; }));

let errors = [];
overlays.forEach(ov => {
  const key = normName(ov.topic);
  const t = topicByNorm[key];
  if (!t) { errors.push('topic not found: ' + ov.topic); return; }
  let c = conceptByNorm[key];
  if (!c) {
    c = { topic: t.name, cards: [], apply: [], deep: [] };
    conceptsByFile[2].list.push(c);
    conceptByNorm[key] = c;
    console.log('created concept entry for', t.name);
  }
  c.units = ov.units;
  if ((c.cards || []).length !== (ov.cards || []).length) {
    const allHaveU = (c.cards || []).every(card => typeof card.u === 'number');
    if (!allHaveU) errors.push(ov.topic + ': card count mismatch concept=' + (c.cards || []).length + ' overlay=' + (ov.cards || []).length);
  } else {
    (c.cards || []).forEach((card, i) => { card.u = ov.cards[i]; });
  }
  const ordered = [];
  (t.items || []).forEach(it => ordered.push(it));
  (c.apply || []).forEach(it => ordered.push(it));
  (c.deep || []).forEach(it => ordered.push(it));
  if (ordered.length !== ov.items.length) {
    console.log(ov.topic + ': note data items ' + ordered.length + ' vs overlay ' + ov.items.length + ' (extras must already carry u)');
  }
  const used = new Array(ordered.length).fill(false);
  let matched = 0;
  ov.items.forEach(entry => {
    const q = entry[0], u = entry[1], newFact = entry[2];
    let found = -1;
    for (let i = 0; i < ordered.length; i++) {
      if (!used[i] && ordered[i].q === q) { found = i; break; }
    }
    if (found < 0) { errors.push(ov.topic + ': unmatched overlay q: ' + String(q).slice(0, 50)); return; }
    used[found] = true;
    ordered[found].u = u;
    if (newFact) ordered[found].fact = newFact;
    matched++;
  });
  let left = 0;
  used.forEach((u2, i) => { if (!u2 && typeof ordered[i].u !== 'number') left++; });
  if (left) errors.push(ov.topic + ': ' + left + ' data items left without unit');
  console.log(ov.topic + ': matched ' + matched + '/' + ov.items.length + ', units ' + ov.units.length);
});

if (errors.length) {
  console.log('ERRORS:');
  errors.forEach(e => console.log(' -', e));
  process.exit(1);
}
topicsByFile.forEach(tf => {
  fs.writeFileSync(tf.file, 'window.__T=(window.__T||[]).concat(' + JSON.stringify(tf.list) + ');');
});
conceptsByFile.forEach(cf => {
  fs.writeFileSync(cf.file, 'window.__C=(window.__C||[]).concat(' + JSON.stringify(cf.list) + ');');
});
console.log('BAKE DONE, all files rewritten');
