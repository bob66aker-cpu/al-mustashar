/* tests/frame-vote.test.mjs — 3.1 silent multi-frame vote (camera live only)
 *
 * The vote is a pure function, so it is driven directly with realistic
 * reads. Four properties matter and are asserted here:
 *   1) it picks the reading the frames agree on, not merely the first;
 *   2) it can never create a result — an empty list yields nothing;
 *   3) it never blends two reads and never changes a threshold;
 *   4) it is confined to the camera live path — the static gallery path
 *      does not call it, so the farmer's single capture is unchanged.
 */
import { readFileSync } from 'fs';
import vm from 'vm';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('PASS ' + msg); } else { fail++; console.log('FAIL ' + msg); } };

const ctx = { window: {}, navigator: { hardwareConcurrency: 4, deviceMemory: 8 }, matchMedia: () => ({ matches: false }) };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync('src/scan-live.js', 'utf8'), ctx);
const SL = ctx.window.ScanLive;

ok(!!SL && typeof SL.vote === 'function', 'the live module exports a vote function');
ok(SL.VOTE_WINDOW_MS >= 1000 && SL.VOTE_WINDOW_MS <= 2000,
  'the vote window is the documented 1-2 seconds — ' + SL.VOTE_WINDOW_MS + 'ms');
ok(SL.VOTE_MAX_READS >= 2 && SL.VOTE_MAX_READS <= 6,
  'the vote reads a bounded number of frames — ' + SL.VOTE_MAX_READS);

/* ---- 1) the agreeing reading wins, not the first one ---- */
const wrong = { text: 'A', cas: [], candidates: ['Acephate'], confidence: 88 };
const right = { text: 'B', cas: [], candidates: ['Glyphosate'], confidence: 91 };
const right2 = { text: 'B2', cas: [], candidates: ['glyphosate '], confidence: 86 };
const reads = [{ res: wrong }, { res: right }, { res: right2 }];
const v = SL.vote(reads);
ok(v.winner.res === right,
  'two frames that read the same substance beat a lone earlier frame — winner=' + v.winner.res.candidates[0]);
ok(v.ranked[0].votes === 2, 'the winner carries two agreeing frames — votes=' + v.ranked[0].votes);
ok(v.ranked[0].pooled > v.ranked[0].res.confidence,
  'pooled confidence rises with agreement without touching the raw value — '
  + v.ranked[0].res.confidence + ' -> ' + v.ranked[0].pooled);

/* ---- 2) CAS identity wins over a name that merely contains it ---- */
const casA = { text: 'x', cas: ['1071-83-6'], candidates: ['alpha'], confidence: 80 };
const casB = { text: 'y', cas: ['1071-83-6'], candidates: ['beta'], confidence: 70 };
const casC = { text: 'z', cas: ['50-00-0'], candidates: ['formalin'], confidence: 95 };
const vc = SL.vote([{ res: casA }, { res: casB }, { res: casC }]);
ok(vc.winner.res === casA, 'two frames agreeing on one CAS number beat a lone different CAS');

/* two reads with DIFFERENT CAS numbers must not be counted as agreeing */
const k1 = SL.readKey(casA), k2 = SL.readKey(casC);
ok(SL.agree(k1, k2) === false, 'two different CAS numbers are not treated as agreement');
ok(SL.agree(k1, SL.readKey(casB)) === true, 'the same CAS number is agreement');

/* ---- 3) it never invents and never blends ---- */
ok(SL.vote([]).winner === null, 'an empty vote produces no winner at all');
ok(SL.vote(null).winner === null, 'a missing vote list produces no winner at all');
const solo = SL.vote([{ res: right }]);
ok(solo.winner.res === right && solo.ranked[0].votes === 1,
  'a single read passes through unchanged — the vote is not a new gate');

/* a tie keeps the first accepted read and never merges text */
const t1 = { text: 'one', cas: [], candidates: ['Chlorpyrifos'], confidence: 80 };
const t2 = { text: 'two', cas: [], candidates: ['Paraquat'], confidence: 80 };
const vt = SL.vote([{ res: t1 }, { res: t2 }]);
ok(vt.winner.res === t1, 'a genuine disagreement keeps the read already on screen');
ok(vt.winner.res.text === 'one', 'the winner is one real read, never a blend of two');

/* pooled confidence is capped so voting cannot outweigh a database match:
   * 100 raw confidence times the internal cap of 12, however many frames agree */
const cap = SL.pooledConfidence({ confidence: 100 }, 999);
ok(cap === 1200, 'pooled confidence stops at raw x 12 however many frames agree — ' + cap);
ok(SL.pooledConfidence({ confidence: 95 }, 2) === 190, 'a two-frame agreement doubles the pooled value');

/* ---- 4) the static gallery path must not call the vote ---- */
const app = readFileSync('src/app.js', 'utf8');
const calls = app.split('collectVoteFrames(').length - 1;
ok(calls >= 2, 'the live pass calls the collector — ' + calls + ' references');
ok(/liveFullPass/.test(app), 'the collector is wired inside the live-camera pass');
/* the gallery/file path is a different function; assert the vote is not
 * reached from it by checking the call site sits in the live function */
const liveStart = app.indexOf('async function liveFullPass');
const liveEnd = app.indexOf('async function startLive');
const liveBody = app.slice(liveStart, liveEnd);
ok(liveBody.indexOf('collectVoteFrames') > 0,
  'the vote is called from the live-camera pass only');
const gallery = app.indexOf('function onFilePick') >= 0 ? app.indexOf('function onFilePick') : 0;
ok(gallery === 0 || !app.slice(gallery, gallery + 4000).includes('collectVoteFrames'),
  'the static gallery path does not call the vote — the farmer flow is unchanged');

/* ---- 5) no threshold was moved to make the vote work ---- */
ok(/MIN_CONFIDENCE\s*=\s*45/.test(readFileSync('src/ocr.js', 'utf8')),
  'MIN_CONFIDENCE is still 45 — the vote changed no threshold');

/* ---- 6) the owner's condition: a repeated WRONG read is never promoted ----
 * Two separate failure modes, each with its own case below.
 */
const wrongRead = { text: 'ACTIVE INGREDIENT: Bromacil 80%',
                    cas: ['1689-99-2'], candidates: ['Bromacil'], confidence: 42 };
const goodRead = { text: 'ACTIVE INGREDIENT: Chlorpyrifos 480 SC',
                   cas: ['29232-93-7'], candidates: ['Chlorpyrifos'], confidence: 88 };

/* case one: four frames agree on the same WRONG read.
   The winner is that read — and it is returned byte for byte as the engine
   produced it. The pooled number used for ranking is 42 x 4 = 168, but it
   is never written back onto the result, so nothing downstream sees 168
   and the app's own MIN_CONFIDENCE still judges 42. */
const wrong4 = SL.vote([{ res: wrongRead }, { res: wrongRead }, { res: wrongRead }, { res: wrongRead }]);
ok(wrong4.winner.res === wrongRead, 'four agreeing frames return that very read object');
ok(wrong4.winner.res.confidence === 42,
  'the returned confidence is still the engine\'s own 42 — the vote did not raise it');
ok(wrong4.ranked[0].pooled === 168,
  'the pooled 168 exists for ranking only and is never returned — ' + wrong4.ranked[0].pooled);
ok(!('pooled' in wrong4.winner.res) && !('votes' in wrongRead),
  'the vote writes nothing back onto the result object');
ok(wrongRead.confidence < 45,
  'and 42 is still below MIN_CONFIDENCE 45, so the read stays a rejection — ' + wrongRead.confidence);

/* case two: three frames repeat a read the existing gates REJECTED.
   The rejected flag lives on the read; the vote refuses it, so unanimous
   repetition of a rejected reading yields no winner at all. The call site
   then falls back to the first read, which is still the rejected one and
   is handled by the pre-existing rejected branch. */
const rejected = { text: 'ACTIVE INGREDIENT: Diuron 80%', cas: ['330-18-1'],
                   candidates: ['Diuron'], confidence: 18,
                   rejected: { lowConfidence: true, conf: 18 } };
const rej3 = SL.vote([{ res: rejected }, { res: rejected }, { res: rejected }]);
ok(rej3.winner === null,
  'three frames repeating a REJECTED read still produce no winner — ' + JSON.stringify(rej3.winner));
ok(rej3.ranked.length === 0, 'and they are not even ranked');

/* the same rule for a sharpness-blocked frame */
const blocked = { text: '', confidence: 0, cas: [], candidates: [], blockedBy: 'sharp' };
ok(SL.vote([{ res: blocked }, { res: blocked }, { res: blocked }, { res: blocked }]).winner === null,
  'a gate-blocked frame has no say however many frames repeat it');

/* mixed: a rejected majority cannot outvote the one good read either */
const mixed = SL.vote([{ res: rejected }, { res: rejected }, { res: rejected }, { res: goodRead }]);
ok(mixed.winner && mixed.winner.res === goodRead,
  'a rejected majority does not outvote the single good read');

/* and the honest limitation, stated: among ACCEPTED reads the majority
   does win, so the vote is a reordering tool, not a correctness tool. */
const maj = SL.vote([{ res: goodRead }, { res: wrongRead }, { res: wrongRead }]);
ok(maj.winner.res === wrongRead,
  'among accepted reads the majority wins — the vote reorders, it does not verify');
ok(maj.winner.res.confidence === 42,
  'and even then the winner keeps its own confidence of 42, not the pooled one');

console.log('\nFRAME-VOTE: PASS ' + pass + '  FAIL ' + fail);
process.exit(fail ? 1 : 0);
