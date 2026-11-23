const fs = require('fs');
const path = require('path');
const dir = __dirname;
const parts = ['part_42_44.js', 'part_45_47.js', 'part_47.js', 'part_48_49.js', 'part_50.js'];
let all = [];
for (const p of parts) {
  const window = {};
  const code = fs.readFileSync(path.join(dir, p), 'utf8');
  new Function('window', code)(window);
  if (!Array.isArray(window.__P)) throw new Error(p + ': no __P');
  console.log(p, '->', window.__P.length);
  all = all.concat(window.__P);
}
const order = ['৪২তম','৪৩তম','৪৪তম','৪৫তম','৪৬তম','৪৭তম','৪৮তম','৪৯তম','৫০তম'];
all.sort((a, b) => order.indexOf(a.bcs) - order.indexOf(b.bcs));

const topics = new Set([
'প্রাচীন বাংলার জনপদ ও প্রাচীন রাজবংশ','পাল ও সেন যুগ','সুলতানি আমল ও স্বাধীন সুলতানি','মুঘল আমল ও নবাবি শাসন','ব্রিটিশ শাসন ও প্রতিরোধ আন্দোলন','বঙ্গভঙ্গ থেকে দেশভাগ',
'ভাষা আন্দোলন','যুক্তফ্রন্ট ও ১৯৫৪ সালের নির্বাচন','ছয় দফা ও গণঅভ্যুত্থান','১৯৭০ সালের নির্বাচন ও অসহযোগ আন্দোলন','মুজিবনগর সরকার ও মুক্তিযুদ্ধের রণকৌশল','বীরত্বের খেতাব, গণহত্যা ও বিজয়','স্বাধীনতা পরবর্তী রাজনৈতিক ইতিহাস',
'সংবিধান প্রণয়ন ও প্রস্তাবনা','রাষ্ট্র পরিচালনার মূলনীতি ও রাষ্ট্রের কাঠামো','মৌলিক অধিকার','সংবিধানের সংশোধনীসমূহ','গুরুত্বপূর্ণ অনুচ্ছেদ ও তফসিল',
'জাতীয় সংসদ ও আইন প্রণয়ন','রাষ্ট্রপতি, প্রধানমন্ত্রী ও মন্ত্রিসভা','বিচার বিভাগ','প্রশাসনিক কাঠামো ও মাঠ প্রশাসন','স্থানীয় সরকার','সাংবিধানিক ও বিধিবদ্ধ কমিশনসমূহ',
'রাজনৈতিক দলসমূহ','জাতীয় নির্বাচন ও গণতন্ত্রের ধারা',
'জাতীয় আয়, বাজেট ও রাজস্ব','উন্নয়ন পরিকল্পনা ও দারিদ্র্য বিমোচন',
'শিল্প খাত ও তৈরি পোশাক শিল্প','বৈদেশিক বাণিজ্য, ব্যাংক ও অর্থপ্রেরণ',
'কৃষি ও খাদ্য উৎপাদন','মৎস্য, প্রাণিসম্পদ ও বনজ সম্পদ',
'জনসংখ্যা ও জনশুমারি','ক্ষুদ্র নৃগোষ্ঠী',
'নদনদী ও পানি সম্পদ','জেলা, বিভাগ ও সীমান্ত',
'জাতীয় প্রতীক ও জাতীয় দিবস','বিশিষ্ট ব্যক্তিত্ব','গুরুত্বপূর্ণ প্রতিষ্ঠান ও স্থাপনা','জাতীয় পুরস্কার ও সম্মাননা','খেলাধুলা','চলচ্চিত্র ও গণমাধ্যম','মেগা প্রকল্প ও আধুনিক স্থাপনা','সংস্কৃতি, ঐতিহ্য ও প্রত্নতত্ত্ব','আন্তর্জাতিক অঙ্গনে বাংলাদেশ','সমসাময়িক বাংলাদেশ',
'অন্যান্য'
]);
let errors = [];
const counts = {};
const seen = new Set();
for (const e of all) {
  counts[e.bcs] = (counts[e.bcs] || 0) + 1;
  if (!Array.isArray(e.opts) || e.opts.length !== 4) errors.push(e.bcs + ' opts!=4: ' + e.q);
  if (!(e.ans >= 0 && e.ans <= 3)) errors.push(e.bcs + ' ans out of range: ' + e.q);
  if (!topics.has(e.topic)) errors.push(e.bcs + ' bad topic "' + e.topic + '": ' + e.q);
  if (!order.includes(e.bcs)) errors.push('bad bcs: ' + e.bcs);
  const key = e.bcs + '|' + e.q;
  if (seen.has(key)) errors.push('dup in same exam: ' + key);
  seen.add(key);
}
console.log('counts per BCS:', JSON.stringify(counts));
console.log('total:', all.length);
if (errors.length) { console.log('ERRORS:'); errors.forEach(e => console.log(' -', e)); process.exit(1); }
const out = 'window.__P = (window.__P || []).concat([\n' +
  all.map(e => '  ' + JSON.stringify(e)).join(',\n') + '\n]);\n';
fs.writeFileSync(path.join(dir, 'past_42_50.js'), out);
console.log('WROTE past_42_50.js with', all.length, 'entries');
