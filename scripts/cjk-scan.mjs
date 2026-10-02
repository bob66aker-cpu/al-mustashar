/* CJK / FFFD / fullwidth injection scanner.
 * usage: node scripts/cjk-scan.mjs <file> [<file> ...]
 * The Arabic block is deliberately NOT flagged: this project is written in
 * Arabic. What must never appear is CJK, kana, fullwidth forms, or the
 * replacement character — those are the signature of a corrupted heredoc.
 */
import { readFileSync } from 'node:fs';

const RE = new RegExp('[\\uFFFD\\u4E00-\\u9FFF\\u3040-\\u30FF\\uFF00-\\uFFEF\\uFF0C]', 'g');

let bad = 0;
for (const f of process.argv.slice(2)) {
  const lines = readFileSync(f, 'utf8').split('\n');
  let hits = 0;
  lines.forEach((l, i) => {
    const m = l.match(RE);
    if (m) { hits += m.length; console.log('  ' + f + ':' + (i + 1) + '  ' + JSON.stringify(m)); }
  });
  console.log((hits ? 'FAIL ' : 'ok   ') + f + '  CJK/FFFD=' + hits);
  bad += hits;
}
process.exit(bad ? 1 : 0);
