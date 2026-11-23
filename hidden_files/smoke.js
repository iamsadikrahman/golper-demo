const fs = require('fs');
function makeEl() {
  const el = {
    children: [], style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    innerHTML: '', textContent: '', value: '', disabled: false,
    appendChild(c) { this.children.push(c); return c; },
    addEventListener() {}, removeEventListener() {}, setAttribute() {}, getAttribute() { return null; },
    querySelector() { return makeEl(); }, querySelectorAll() { return []; },
    closest() { return null; }, focus() {}, click() {}, scrollIntoView() {}
  };
  return el;
}
const els = {};
global.document = {
  getElementById(id) { if (!els[id]) els[id] = makeEl(); return els[id]; },
  createElement() { return makeEl(); },
  querySelector() { return makeEl(); },
  querySelectorAll() { return []; },
  addEventListener() {},
  body: makeEl(),
  documentElement: makeEl(),
  title: ''
};
const store = {};
global.localStorage = { getItem(k) { return store[k] || null; }, setItem(k, v) { store[k] = String(v); }, removeItem(k) { delete store[k]; } };
global.location = { hash: '', href: 'http://local/', reload() {} };
global.window = global;
global.addEventListener = function () {};
global.setInterval = function () { return 0; };
global.setTimeout = function (fn) { return 0; };
global.clearInterval = function () {};
global.scrollTo = function () {};
global.alert = function () {};
global.confirm = function () { return true; };

const tags = fs.readFileSync('/tmp/scriptlist.txt', 'utf8').trim().split('\n');
tags.forEach(f => { eval(fs.readFileSync(f, 'utf8')); });
const html = fs.readFileSync('index.html', 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
const testCode = `
console.log('engine loaded, TOPICS:', TOPICS.length);
let fails = 0;
TOPICS.forEach((t, i) => {
  try { renderStudy(i); } catch (e) { fails++; console.log('renderStudy FAIL', t.name, e.message); }
});
console.log('renderStudy all topics done, fails:', fails);
try {
  const si = TOPICS.findIndex(x => x.name === 'সমাস');
  startUnit(si, 0);
  console.log('startUnit সমাস unit0 OK');
  const ei = TOPICS.findIndex(x => x.subject === 'english');
  startUnit(ei, TOPICS[ei].units.length - 1);
  console.log('startUnit english last unit OK');
  renderHome();
  console.log('renderHome OK');
} catch (e) { console.log('SMOKE FAIL:', e.message); }
`;
eval(m[1].replace(/<\/?script>/g, '') + '\n' + testCode);
