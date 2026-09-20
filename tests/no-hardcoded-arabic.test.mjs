/*
 * tests/no-hardcoded-arabic.test.mjs — Phase E guard (i18n completeness)
 * ----------------------------------------------------------------------------
 * Fails when hardcoded Arabic UI text appears in app.js/index.html OUTSIDE
 * the i18n dictionaries. Allowed Arabic in app.js:
 *   - the fallback string of a t()/tf() call (the fallback IS the ar dict
 *     content and I18N.t must never be bypassed at call sites)
 *   - the `label:` fallback in the SOURCES table (paired with labelKey)
 *   - comments
 * Allowed Arabic in index.html: text inside elements carrying data-i18n
 * (translated at runtime by src/i18n.js), and comments.
 *
 * Implementation: a small JS tokenizer that correctly handles
 *   - single/double-quoted strings with escapes,
 *   - template literals INCLUDING ${...} interpolations (scanned as code),
 *   - regex literals (which may contain quote characters!) via the classic
 *     "regex allowed after operator/keyword/open-paren" heuristic,
 *   - line and block comments.
 * A naive quote-pairing scanner misclassifies code after a regex like
 * /['"]/ and fails legitimate t() fallbacks — this tokenizer fixes that.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ar = /[\u0600-\u06FF]/;
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : ' ' + extra}`);
  ok ? pass++ : fail++;
};

/* ---------- tokenizer: returns string literals + call stack context ---------- */
function analyzeJs(src) {
  // strip comments first (they cannot contain meaningful tokens; Arabic in
  // comments is explicitly allowed)
  src = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
  src = src.replace(/(^|\s)\/\/.*$/gm, '$1');

  const offenders = [];
  const n = src.length;
  // paren call stack: { name } — innermost open call decides t/tf allowance
  const stack = [];
  // template interpolation stack: brace depth per open `${`
  const tmplBraces = [];
  let i = 0;
  let lastMeaningful = ''; // last non-space token char/word (for regex heuristic)

  const pushMeaningful = (c) => { if (!/\s/.test(c)) lastMeaningful = c; };

  const recordString = (startIdx, content) => {
    if (!ar.test(content)) return;
    const inner = stack[stack.length - 1];
    const isT = !!inner && (inner.name === 't' || inner.name === 'tf');
    let labelOk = false;
    if (!isT) {
      let k = startIdx - 1;
      while (k >= 0 && /\s/.test(src[k])) k--;
      labelOk = /label:$/.test(src.slice(Math.max(0, k - 8), k + 1));
    }
    if (!isT && !labelOk) {
      const lineNo = src.slice(0, startIdx).split('\n').length;
      offenders.push(`app.js:${lineNo}: ${content.slice(0, 40)}`);
    }
  };

  while (i < n) {
    const ch = src[i];
    if (ch === '\n' || ch === ' ' || ch === '\t' || ch === '\r') { i++; continue; }

    // ---- string literals ----
    if (ch === '"' || ch === "'") {
      const q = ch; let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === q) break;
        j++;
      }
      recordString(i, src.slice(i + 1, j));
      pushMeaningful(q);
      i = j + 1; continue;
    }

    // ---- template literal (with interpolation) ----
    if (ch === '`') {
      let j = i + 1;
      while (j < n) {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '`') break;
        if (src[j] === '$' && src[j + 1] === '{') {
          // static chunk before interpolation: flag Arabic here (hardcoded UI text)
          recordString(i, src.slice(i + 1, j));
          // scan interpolation as code: find matching } with brace counting
          let depth = 1; let k = j + 2;
          while (k < n && depth > 0) {
            const c = src[k];
            if (c === '{') depth++;
            else if (c === '}') depth--;
            else if (c === '"' || c === "'" || c === '`') {
              // skip nested strings/templates inside interpolation
              const q2 = c; k++;
              while (k < n) {
                if (src[k] === '\\') { k += 2; continue; }
                if (src[k] === q2) break;
                // nested template interpolation inside interpolation: rare; treat naively
                k++;
              }
            } else if (c === '/' && src[k + 1] === '/') {
              while (k < n && src[k] !== '\n') k++;
            } else if (c === '/' && src[k + 1] === '*') {
              k += 2; while (k < n && !(src[k] === '*' && src[k + 1] === '/')) k++; k++;
            }
            k++;
          }
          j = k; // position after closing }
          continue;
        }
        j++;
      }
      // final static chunk before closing backtick
      recordString(i, src.slice(i + 1, j));
      pushMeaningful('`');
      i = j + 1; continue;
    }

    // ---- regex literal (may contain quotes!) ----
    if (ch === '/') {
      const prev = lastMeaningful;
      const regexAllowed =
        prev === '' || '=(,:[!&|?{};+*%-<>~^'.includes(prev) ||
        /(^|\s)(return|typeof|case|in|of|new|delete|void|do|else)$/.test(src.slice(Math.max(0, i - 12), i));
      if (regexAllowed) {
        let j = i + 1, inClass = false;
        while (j < n) {
          const c = src[j];
          if (c === '\\') { j += 2; continue; }
          if (c === '[') inClass = true;
          else if (c === ']') inClass = false;
          else if (c === '/' && !inClass) break;
          else if (c === '\n') break; // malformed; bail out
          j++;
        }
        // consume flags
        let k = j + 1;
        while (k < n && /[a-z]/i.test(src[k])) k++;
        pushMeaningful('/');
        i = k; continue;
      }
      // division — fall through as operator
      pushMeaningful('/');
      i++; continue;
    }

    // ---- call opener: identifier followed by ( ----
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      let k = j;
      while (k < n && /\s/.test(src[k])) k++;
      if (src[k] === '(') {
        stack.push({ name: word });
        pushMeaningful('(');
        i = k + 1; continue;
      }
      pushMeaningful(word.slice(-1));
      i = j; continue;
    }

    if (ch === '(') { stack.push({ name: null }); pushMeaningful('('); i++; continue; }
    if (ch === ')') { if (stack.length) stack.pop(); pushMeaningful(')'); i++; continue; }

    pushMeaningful(ch);
    i++;
  }
  return offenders;
}

/* ---- app.js ---- */
{
  const src = readFileSync(join(root, 'src/app.js'), 'utf8');
  const offenders = analyzeJs(src);
  check('app.js has no hardcoded Arabic outside t()/tf() fallbacks',
    offenders.length === 0, '\n  ' + offenders.slice(0, 8).join('\n  '));
}

/* ---- index.html: no Arabic text nodes outside data-i18n-marked elements ---- */
{
  let html = readFileSync(join(root, 'index.html'), 'utf8');
  const body = html.slice(html.indexOf('<body'));
  const noComments = body.replace(/<!--[\s\S]*?-->/g, '');
  const scripts = noComments.replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
  const offenders = [];
  const stack = [];
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
  let last = 0, m;
  while ((m = tagRe.exec(scripts)) !== null) {
    const text = scripts.slice(last, m.index);
    last = m.index + m[0].length;
    const isClose = m[0][1] === '/';
    const attrs = m[2] || '';
    if (ar.test(text) && !stack.some(e => e.i18n)) {
      offenders.push('index.html: ' + text.trim().slice(0, 30));
    }
    if (isClose) {
      while (stack.length && stack[stack.length - 1].tag !== m[1].toLowerCase()) stack.pop();
      stack.pop();
    } else if (!/\/>$/.test(m[0])) {
      stack.push({ tag: m[1].toLowerCase(), i18n: /data-i18n/.test(attrs) });
    }
  }
  check('index.html has no Arabic text outside data-i18n elements',
    offenders.length === 0, '\n  ' + offenders.slice(0, 8).join('\n  '));
}

console.log('==============================');
console.log(`PASS: ${pass}   FAIL: ${fail}`);
process.exit(fail ? 1 : 0);
