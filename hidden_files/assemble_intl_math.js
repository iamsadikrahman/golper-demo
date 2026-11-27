global.window = {};
const fs = require('fs');
function load(file, key) {
  const w = {};
  global.window = w;
  eval(fs.readFileSync(file, 'utf8'));
  return w[key] || [];
}

/* ---------- ধাপ ১ক: আন্তর্জাতিক কনটেন্ট ---------- */
const INTL_FILES = ['content_1', 'content_2a', 'content_2b', 'content_3a', 'content_3b', 'content_4a', 'content_4b', 'content_5a', 'content_5b', 'content_6a', 'content_6b'];
let TI = [], CI = [];
INTL_FILES.forEach(n => {
  TI = TI.concat(load('hidden_files/gk_intl_frags/' + n + '.js', '__T'));
  CI = CI.concat(load('hidden_files/gk_intl_frags/' + n + '.js', '__C'));
});
console.log('INTL topics:', TI.length, 'concepts:', CI.length);
if (TI.length !== 36 || CI.length !== 36) { console.log('INTL COUNT MISMATCH'); process.exit(1); }
fs.writeFileSync('data/gk_intl.js', 'window.__T=(window.__T||[]).concat(' + JSON.stringify(TI) + ');');
fs.writeFileSync('data/concept_gk_intl.js', 'window.__C=(window.__C||[]).concat(' + JSON.stringify(CI) + ');');

/* ---------- ধাপ ১খ + ২: গণিত কনটেন্ট ও গ্যাপ তথ্য ---------- */
let TM = [], CM = [];
for (let i = 1; i <= 4; i++) {
  TM = TM.concat(load('hidden_files/math_frags/content_' + i + '.js', '__T'));
  CM = CM.concat(load('hidden_files/math_frags/content_' + i + '.js', '__C'));
}
console.log('MATH topics:', TM.length, 'concepts:', CM.length);
if (TM.length !== 24 || CM.length !== 24) { console.log('MATH COUNT MISMATCH'); process.exit(1); }
const GAP = [
  { q: 'দৈর্ঘ্যের একক রূপান্তরে ১ মিটার সমান প্রায় কত ইঞ্চি?', a: '৩৯.৩৭ ইঞ্চি', pool: 'একক রূপান্তর', st: 'দৈর্ঘ্যের একক রূপান্তরে ১ মিটার সমান প্রায় ৩৯.৩৭ ইঞ্চি।', fact: '১ মিটার সমান ১০০ সেন্টিমিটার, আর ১ ইঞ্চি সমান ২.৫৪ সেন্টিমিটার।\nতাই ১০০ কে ২.৫৪ দিয়ে ভাগ করলে পাওয়া যায় প্রায় ৩৯.৩৭ ইঞ্চি।', u: 2 },
  { q: '১ ইঞ্চি সমান কত সেন্টিমিটার?', a: '২.৫৪ সেন্টিমিটার', pool: 'একক রূপান্তর', st: '১ ইঞ্চি সমান ২.৫৪ সেন্টিমিটার।', fact: 'ইঞ্চি ও সেন্টিমিটারের এই সম্পর্ক আন্তর্জাতিকভাবে নির্দিষ্ট করে দেওয়া আছে।\nএই মান দিয়েই মিটার থেকে ইঞ্চি কিংবা ইঞ্চি থেকে মিটারের রূপান্তর হিসাব করা হয়।', u: 2 },
  { q: 'ভরের একক রূপান্তরে ১ কিলোগ্রাম সমান কত মিলিগ্রাম?', a: '১০ লাখ মিলিগ্রাম', pool: 'একক রূপান্তর', st: 'ভরের একক রূপান্তরে ১ কিলোগ্রাম সমান ১০ লাখ মিলিগ্রাম।', fact: '১ কিলোগ্রাম সমান ১০০০ গ্রাম, আর ১ গ্রাম সমান ১০০০ মিলিগ্রাম।\nতাই ১০০০ কে ১০০০ দিয়ে গুণ করলে ১ কিলোগ্রামে পাওয়া যায় ১০,০০,০০০ অর্থাৎ ১০ লাখ মিলিগ্রাম।', u: 2 }
];
const bastob = TM.find(t => t.name === 'বাস্তব সংখ্যা ও সংখ্যাপদ্ধতি');
if (!bastob) { console.log('বাস্তব সংখ্যা topic missing'); process.exit(1); }
bastob.items = bastob.items.concat(GAP);
console.log('gap facts added to বাস্তব সংখ্যা base items:', GAP.length, '| topic items now:', bastob.items.length);
fs.writeFileSync('data/math.js', 'window.__T=(window.__T||[]).concat(' + JSON.stringify(TM) + ');');
fs.writeFileSync('data/concept_math.js', 'window.__C=(window.__C||[]).concat(' + JSON.stringify(CM) + ');');

/* ---------- ধাপ ৩: বিগত প্রশ্ন ব্যাংক ---------- */
function keyOf(p) { return p.q + '||' + (p.opts || []).slice().sort().join('|'); }
const OLD_FILES = ['past_bank', 'past_primary', 'past_ntrca', 'past_admission', 'past_10_20', 'past_21_30', 'past_31_40', 'past_41_50', 'past_en_bcs', 'past_en_other', 'past_gk_bcs'];
const oldKeys = new Set();
OLD_FILES.forEach(n => { load('data/' + n + '.js', '__P').forEach(p => oldKeys.add(keyOf(p))); });
console.log('old bank keys:', oldKeys.size);

function buildBank(files, retagMap, dropSet, label) {
  let P = [];
  files.forEach(f => { P = P.concat(load(f, '__P')); });
  const rawTotal = P.length;
  const othIdx = [];
  P.forEach((p, i) => { if (p.topic === 'অন্যান্য') othIdx.push(i); });
  let retagged = 0, droppedOth = 0;
  const kept = [];
  let oi = -1;
  P.forEach(p => {
    if (p.topic === 'অন্যান্য') {
      oi++;
      if (dropSet.has(oi)) { droppedOth++; return; }
      const target = retagMap[oi];
      if (!target) { console.log(label, 'UNRESOLVED অন্যান্য index', oi, p.bcs, p.q.slice(0, 50)); process.exit(1); }
      p.topic = target; retagged++;
    }
    kept.push(p);
  });
  const seen = new Set();
  let dupIn = 0;
  const deduped = kept.filter(p => { const k = keyOf(p); if (seen.has(k)) { dupIn++; return false; } seen.add(k); return true; });
  let dupOld = 0;
  const final = deduped.filter(p => { if (oldKeys.has(keyOf(p))) { dupOld++; return false; } return true; });
  console.log(label, '| raw:', rawTotal, '| অন্যান্য:', othIdx.length, '| retagged:', retagged, '| dropped অন্যান্য:', droppedOth, '| dup within bank:', dupIn, '| dup vs old banks:', dupOld, '| FINAL:', final.length);
  return final;
}

const INTL_SHAS = 'বিশ্বের প্রধান দেশসমূহের শাসনব্যবস্থা ও রাষ্ট্রীয় প্রতিষ্ঠান';
const INTL_BOOK = 'বিখ্যাত গ্রন্থ, রচয়িতা ও বিশ্ব ব্যক্তিত্ব';
const intlRetag = {};
[0, 19, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 41, 43, 44, 46, 51, 54, 55, 59].forEach(i => intlRetag[i] = INTL_SHAS);
[1, 3, 20, 21, 22, 23, 24, 39, 42, 45, 48, 53, 57].forEach(i => intlRetag[i] = INTL_BOOK);
intlRetag[10] = 'দেশ, রাজধানী ও মুদ্রা';
intlRetag[11] = 'দেশ, রাজধানী ও মুদ্রা';
intlRetag[50] = 'ভূরাজনীতি ও কৌশলগত অঞ্চল';
intlRetag[2] = 'চলমান যুদ্ধ ও আঞ্চলিক সংঘাত';
intlRetag[15] = 'বিশ্ব ঐতিহ্য ও বিখ্যাত স্থাপনা';
intlRetag[56] = 'ঔপনিবেশিক শাসনের অবসান ও নতুন রাষ্ট্রের উত্থান';
intlRetag[58] = 'আন্তর্জাতিক আর্থিক প্রতিষ্ঠানসমূহ';
const intlDrop = new Set([4, 5, 6, 7, 8, 9, 12, 13, 14, 16, 17, 18, 33, 37, 38, 40, 47, 49, 52]);
const intlPast = buildBank(['hidden_files/gk_intl_frags/past_intl_10_25.js', 'hidden_files/gk_intl_frags/past_intl_26_41.js', 'hidden_files/gk_intl_frags/past_intl_42_50.js'], intlRetag, intlDrop, 'INTL PAST');
fs.writeFileSync('data/past_gk_intl.js', 'window.__P=(window.__P||[]).concat(' + JSON.stringify(intlPast) + ');');

const mathRetag = { 0: 'বাস্তব সংখ্যা ও সংখ্যাপদ্ধতি', 1: 'বাস্তব সংখ্যা ও সংখ্যাপদ্ধতি', 5: 'বাস্তব সংখ্যা ও সংখ্যাপদ্ধতি', 4: 'সম্ভাবনা', 9: 'ভাষাগত যুক্তি ও শ্রেণিবিন্যাস' };
const mathDrop = new Set([2, 3, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
const mathPast = buildBank(['hidden_files/math_frags/past_math_10_25.js', 'hidden_files/math_frags/past_math_26_41.js', 'hidden_files/math_frags/past_math_42_50.js'], mathRetag, mathDrop, 'MATH PAST');
fs.writeFileSync('data/past_math.js', 'window.__P=(window.__P||[]).concat(' + JSON.stringify(mathPast) + ');');

/* টপিকপ্রতি বিগত প্রশ্ন যাচাই */
function perTopic(P, T, label) {
  const counts = {};
  P.forEach(p => counts[p.topic] = (counts[p.topic] || 0) + 1);
  const names = new Set(T.map(t => t.name));
  Object.keys(counts).forEach(k => { if (!names.has(k)) console.log(label, 'PAST TOPIC NOT IN __T:', k); });
  const empty = T.filter(t => !counts[t.name]).map(t => t.name);
  console.log(label, 'topics without past questions:', empty.length, empty.join(' ; '));
}
perTopic(intlPast, TI, 'INTL');
perTopic(mathPast, TM, 'MATH');
console.log('ASSEMBLY DONE');
