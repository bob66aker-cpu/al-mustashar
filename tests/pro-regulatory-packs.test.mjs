import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const cards = readFileSync(new URL('../src/tawsiyat.js', import.meta.url), 'utf8');
const packs = readFileSync(new URL('../src/packs.js', import.meta.url), 'utf8');

test('professional mode installs the two additional jurisdiction packs', () => {
  assert.match(app, /document\.addEventListener\('modechange', ensurePacks\)/);
  assert.match(app, /if \(isPro\(\)\) ensurePacks\(\)/);
  assert.match(packs, /key: 'canada'[\s\S]*?data-optional\/canada\.json/);
  assert.match(packs, /key: 'australia'[\s\S]*?data-optional\/australia\.json/);
});

test('loaded and restored packs notify open recommendation cards to repaint', () => {
  assert.match(app, /pack-auto-installed[\s\S]*?document\.dispatchEvent\(new Event\('regulatorydbchange'\)\)/);
  assert.match(app, /Repaint any open recommendation card[\s\S]*?document\.dispatchEvent\(new Event\('regulatorydbchange'\)\)/);
  assert.match(cards, /document\.addEventListener\('regulatorydbchange', route\)/);
});

test('recommendation cards separate Libya from international jurisdictions by UI language', () => {
  assert.match(cards, /return isArabic \? \(h\.key === 'libya-248' \|\| h\.key === 'libya-500'\)/);
  assert.match(cards, /h\.key === 'eu' \|\| h\.key === 'epa' \|\| h\.key === 'canada' \|\| h\.key === 'australia'/);
});

test('unmatched ingredient remains explicitly unknown, not approved or prohibited', () => {
  assert.match(cards, /No confirmed match in the selected jurisdiction database/);
  assert.match(cards, /tws-reg-badge unknown/);
  assert.match(app, /if \(!exactCas && !exactName\) return/);
});
