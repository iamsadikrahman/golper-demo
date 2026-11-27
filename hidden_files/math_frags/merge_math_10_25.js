global.window = {};
const fs = require('fs');
const TOPICS = ['বাস্তব সংখ্যা ও সংখ্যাপদ্ধতি','লসাগু ও গসাগু','শতকরা','সরল ও যৌগিক মুনাফা','অনুপাত ও সমানুপাত','লাভ ও ক্ষতি','গড়, সময় ও কাজ, গতি ও দূরত্ব','বীজগাণিতিক সূত্রাবলি ও উৎপাদকে বিশ্লেষণ','সূচক ও লগারিদম','সরল ও দ্বিঘাত সমীকরণ','সরল সহসমীকরণ ও অসমতা','সমান্তর ও গুণোত্তর ধারা','সেট ও ভেনচিত্র','সম্ভাবনা','রেখা, কোণ ও ত্রিভুজ','চতুর্ভুজ ও বহুভুজ','বৃত্ত','পরিমিতি: ক্ষেত্রফল ও পরিসীমা','পরিমিতি: ঘনবস্তুর আয়তন','ত্রিকোণমিতি','সংখ্যা ও বর্ণ ধারা','দিক, স্থানাঙ্ক ও অবস্থান যুক্তি','ঘড়ি ও ক্যালেন্ডার','ভাষাগত যুক্তি ও শ্রেণিবিন্যাস','অন্যান্য'];
let all = [];
['part_10_13','part_14_17','part_18_21','part_22_25'].forEach(f => {
  const w = {}; global.window = w;
  eval(fs.readFileSync('hidden_files/math_frags/parts/' + f + '.js', 'utf8'));
  all = all.concat(w.__P || []);
  console.log(f, (w.__P || []).length);
});
console.log('TOTAL:', all.length);
const problems = [];
const byBcs = {};
const seen = {};
all.forEach((p, i) => {
  if (!TOPICS.includes(p.topic)) problems.push(i + ' bad topic: ' + p.topic);
  if (!Array.isArray(p.opts) || p.opts.length !== 4) problems.push(i + ' opts != 4');
  if (!(p.ans >= 0 && p.ans <= 3)) problems.push(i + ' ans out of range');
  if (!p.q || !p.bcs) problems.push(i + ' missing q/bcs');
  byBcs[p.bcs] = (byBcs[p.bcs] || 0) + 1;
  const key = p.bcs + '|' + p.q;
  if (seen[key]) problems.push('duplicate in same exam: ' + key);
  seen[key] = 1;
});
console.log('by BCS:', JSON.stringify(byBcs));
console.log('অন্যান্য:', all.filter(p => p.topic === 'অন্যান্য').length);
all.filter(p => p.topic === 'অন্যান্য').forEach(p => console.log('  ', p.bcs, p.q));
console.log('problems:', problems.length);
problems.forEach(p => console.log(' !', p));
if (!problems.length) {
  fs.writeFileSync('hidden_files/math_frags/past_math_10_25.js', 'window.__P=(window.__P||[]).concat(' + JSON.stringify(all) + ');');
  console.log('WROTE past_math_10_25.js');
}
