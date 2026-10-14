/* حاصد أدلة المحاصيل — جولة D60
 * usage: node scripts/advice-harvest.mjs [offset] [limit]
 *
 * القاعدة: بطاقة بلا دليل لا تُكتب. لكل محصول مرشَّح يُجلب:
 *   1) صفحة EPPO للمحصول (تحقق العنوان = الاسم العلمي المتوقع) + صفحة آفاته
 *      (جدول Organism × نوع علاقة المضيف) — الآفات تُرتَّب: Major host ثم Host.
 *   2) مطابقة GBIF (حالة ACCEPTED وثقة ≥ 90 وعائلة موجودة) — لا تطابق ضبابي.
 * كل طلب يُسجَّل بحالتته؛ المرشّح بلا دليل كافٍ (≥ 3 آفات) يُرفض ويُذكر سببه.
 * المخرج: data/advice/evidence/<id>.json (خارج حزمة التجهيز المسبق).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'data', 'advice');
const EV = join(DIR, 'evidence');
mkdirSync(EV, { recursive: true });

/* المرشحون: الاسم المتوقع للآلة هو مرشِّح لا حقيقة — الحقيقة تُثبت بالجلب. */
const CANDIDATES = [
  ['rice','الأرز','Rice','Riz','Oryza sativa',['ORYSA']],
  ['maize','الذرة الصفراء','Maize','Maïs','Zea mays',['ZEAMX']],
  ['sorghum','السورغوم','Sorghum','Sorgho','Sorghum bicolor',['SORVU','SORBI']],
  ['millet','الدخن','Pearl millet','Millet perlé','Pennisetum glaucum',['PESGL'],'Cenchrus americanus'],
  ['oat','الشوفان','Oat','Avoine','Avena sativa',['AVESA','AVESS']],
  ['rye','الجاودار','Rye','Seigle','Secale cereale',['SECCE']],
  ['soybean','الفول الصويا','Soybean','Soja','Glycine max',['GLXMA','GLYMA']],
  ['bean','الفاصولياء','Common bean','Haricot commun','Phaseolus vulgaris',['PHSVX']],
  ['chickpea','الحمص','Chickpea','Pois chiche','Cicer arietinum',['CIEAR']],
  ['lentil','العدس','Lentil','Lentille','Lens culinaris',['LENCU'],'Vicia lens'],
  ['pea','البازلاء','Pea','Pois','Pisum sativum',['PIBSX']],
  ['cowpea','اللوبيا','Cowpea','Niébé','Vigna unguiculata',['VIGSI']],
  ['pigeonpea','الحمص الهندی','Pigeon pea','Pois d’Angole','Cajanus cajan',['CAJCA','CAJCN']],
  ['groundnut','الفول السوداني','Groundnut','Cacahuète','Arachis hypogaea',['ARHHY','ARACH']],
  ['cassava','المانيوكا','Cassava','Manioc','Manihot esculenta',['MANES','MANIO']],
  ['sweetpotato','البطاطا الحلوة','Sweet potato','Patate douce','Ipomoea batatas',['IPOBA']],
  ['sunflower','دوار الشمس','Sunflower','Tournesol','Helianthus annuus',['HELAN']],
  ['rapeseed','الكولزا','Rapeseed','Colza','Brassica napus',['BRSNN']],
  ['sesame','السمسم','Sesame','Sésame','Sesamum indicum',['SEGIN']],
  ['cotton','القطن','Cotton','Coton','Gossypium hirsutum',['GOSSA','GOSSP','GOSHI']],
  ['sugarcane','قصب السكر','Sugarcane','Canne à sucre','Saccharum officinarum',['SACOF','SACOFF']],
  ['sugarbeet','شمندر السكر','Sugar beet','Betterave sucrière','Beta vulgaris',['BEAVX']],
  ['banana','الموز','Banana','Bananier','Musa acuminata',['MUBAC']],
  ['apple','التفاح','Apple','Pomier','Malus domestica',['MABSS','MABSD','MABSP']],
  ['pear','الكمثرى','Pear','Poirier','Pyrus communis',['PYUCO']],
  ['peach','الخوخ','Peach','Pêcher','Prunus persica',['PRNPS']],
  ['apricot','المشمش','Apricot','Abricotier','Prunus armeniaca',['PRNAR']],
  ['plum','البرقوق','Plum','Prunier','Prunus domestica',['PRNDO']],
  ['cherry','الكرز','Sweet cherry','Cerisier','Prunus avium',['PRNAV']],
  ['strawberry','الفراولة','Strawberry','Fragoyer','Fragaria ananassa',['FRAAN']],
  ['watermelon','البطيخ','Watermelon','Pastèque','Citrullus lanatus',['CITLA']],
  ['melon','الشمام','Melon','Melon','Cucumis melo',['CUMME']],
  ['cucumber','الخيار','Cucumber','Concombre','Cucumis sativus',['CUMSA']],
  ['pumpkin','القرع','Pumpkin','Courge','Cucurbita maxima',['CUUMA']],
  ['mango','المانجو','Mango','Mangue','Mangifera indica',['MNGIN']],
  ['pineapple','الأناناس','Pineapple','Ananas','Ananas comosus',['ANHCO']],
  ['avocado','الأفوكادو','Avocado','Avocat','Persea americana',['PEBAM']],
  ['papaya','البابايا','Papaya','Papayer','Carica papaya',['CIAPA']],
  ['fig','التين','Fig','Figue','Ficus carica',['FIUCA']],
  ['pomegranate','الرمان','Pomegranate','Grenadier','Punica granatum',['PUNGR','PUNPL']],
  ['onion','البصل','Onion','Oignon','Allium cepa',['ALLCE']],
  ['garlic','الثوم','Garlic','Ail','Allium sativum',['ALLSA','ALLIS']],
  ['carrot','الجزر','Carrot','Carotte','Daucus carota',['DAUCA']],
  ['cabbage','الملفوف','Cabbage','Chou','Brassica oleracea',['BRSOX']],
  ['cauliflower','القرنبيط','Cauliflower','Chou-fleur','Brassica oleracea botrytis',['BRSOX'],'Brassica oleracea'],
  ['lettuce','الخس','Lettuce','Laitue','Lactuca sativa',['LACSA']],
  ['eggplant','الباذنجان','Eggplant','Aubergine','Solanum melongena',['SOLME','SOLML']],
  ['okra','البامية','Okra','Gombo','Abelmoschus esculentus',['ABMES']],
  ['spinach','السبانخ','Spinach','Épinard','Spinacia oleracea',['SPQOL']],
  ['almond','اللوز','Almond','Amandier','Prunus dulcis',['PRNDU']],
  ['walnut','الجوز','Walnut','Noyer','Juglans regia',['IUGRE','JUGRE']],
  ['pistachio','الفستق الحلبي','Pistachio','Pistache','Pistacia vera',['PIAVE']],
  ['coffee','القهوة','Coffee','Caféier','Coffea arabica',['COFAR','COFAA','COFCO']],
  ['cocoa','الكاكاو','Cocoa','Cacaoyer','Theobroma cacao',['THOCA']],
  ['tea','الشاي','Tea','Thé','Camellia sinensis',['CAHSI']],
  ['tobacco','التبغ','Tobacco','Tabac','Nicotiana tabacum',['NIOTA']],
  ['oilpalm','نخيل الزيت','Oil palm','Palmier à huile','Elaeis guineensis',['EAIGU']],
  ['coconut','جوز الهند','Coconut','Cocoier','Cocos nucifera',['CCNNU']],
  /* العشرة ناقصة من الجولة السابقة (بطاقاتها المكتوبة يدوياً موجودة بلا أدلة) */
  ['tomato','الطماطم','Tomato','Tomate','Solanum lycopersicum',['LYPES']],
  ['wheat','القمح','Wheat','Blé','Triticum aestivum',['TRZAX']],
  ['potato','البطاطا','Potato','Pomme de terre','Solanum tuberosum',['SOLPU','SOLTU']],
  ['pepper','الفلفل','Pepper','Poivron','Capsicum annuum',['CPSAN']],
  ['citrus','الحمضيات','Citrus','Agrumes','Citrus',['1CIDG']],
  ['olive','الزيتون','Olive','Olivier','Olea europaea',['OLVEU']],
  ['grape','العنب','Grape','Vigne','Vitis vinifera',['VITVI','VITSD','VITVV']],
  ['barley','الشعير','Barley','Orge','Hordeum vulgare',['HORVX']],
  ['dates','التمور','Dates','Dattier','Phoenix dactylifera',['PHXDA']],
  ['alfalfa','البرسيم','Alfalfa','Luzerne','Medicago sativa',['MEDSA']],
];

const norm = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 2; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20000),
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; advice-evidence/1.0)' } });
      return { status: r.status, text: await r.text() };
    } catch (e) { if (i === 1) return { status: 0, text: '', err: e.name }; await sleep(1200); }
  }
}

const offset = Number(process.argv[2] || 0), limit = Number(process.argv[3] || 999);
const batch = CANDIDATES.slice(offset, offset + limit);
let kept = 0, dropped = 0;
for (const [id, ar, en, fr, sci, alts, eppoSci] of batch) {
  const out = join(EV, id + '.json');
  if (existsSync(out)) { console.log('SKIP ' + id + ' (دليل موجود)'); continue; }
  /* 1) صفحة EPPO للمحصول — الأكواد تُجرَّب واحدة واحدة والعنوان يحسم */
  const codeList = alts.slice();
  if (!codeList.length) { console.log('DROP ' + id + ': بلا كود EPPO مرجقي'); dropped++; continue; }
  let eppo = null;
  for (const code of codeList) {
    await sleep(600);
    const ov = await get('https://gd.eppo.int/taxon/' + code);
    if (ov.status !== 200) { console.log('  .. ' + code + ' overview HTTP ' + ov.status); continue; }
    const m = ov.text.match(/<title>([^<]*)<\/title>/);
    const title = m ? m[1] : '';
    const tTokens = new Set(title.toLowerCase().match(/[a-z]{4,}/g) || []);
    const sTokens = (eppoSci || sci).toLowerCase().match(/[a-z]{4,}/g) || [];
    if (!sTokens.every((t, i) => i < 2 ? tTokens.has(t) : true)) {
      console.log("  .. " + code + " العنوان لا يطابق: " + title.slice(0, 60)); continue; }
    await sleep(600);
    const ps = await get('https://gd.eppo.int/taxon/' + code + '/pests');
    if (ps.status !== 200) { console.log('  .. ' + code + ' pests HTTP ' + ps.status); continue; }
    const pests = [];
    const re = /<a href="\/taxon\/([A-Z0-9]{5,6})">([^<]+)<\/a><\/td>\s*<td>([^<]+)<\/td>/g;
    const byType = {};
    for (const mm of ps.text.matchAll(re)) {
      byType[mm[3].trim()] = (byType[mm[3].trim()] || 0) + 1;
      if (mm[3].trim() === 'Major host' || mm[3].trim() === 'Host')
        pests.push({ code: mm[1], name: mm[2].trim().replace(/&#039;/g, "'").replace(/&amp;/g, "&"), type: mm[3].trim() });
    }
    pests.sort((a, b) => (a.type === 'Major host' ? 0 : 1) - (b.type === 'Major host' ? 0 : 1));
    if (pests.length < 3) { console.log('  .. ' + code + ' آفات كافية لا: ' + pests.length); continue; }
    eppo = { code, overview_url: 'https://gd.eppo.int/taxon/' + code, overview_title: title.replace(/\[.*$/, '').trim(),
      pests_url: 'https://gd.eppo.int/taxon/' + code + '/pests', http_status: 200,
      pests_total_rows: Object.values(byType).reduce((a, b) => a + b, 0), by_type: byType,
      pests };
    break;
  }
  if (!eppo) { console.log('DROP ' + id + ': لا دليل EPPO صالح'); dropped++; continue; }
  /* 2) GBIF — تطابق مقبول فقط */
  await sleep(500);
  const g = await get('https://api.gbif.org/v1/species/match?kingdom=Plantae&name=' + encodeURIComponent(eppoSci || sci));
  let gbif = null;
  try {
    const j = JSON.parse(g.text);
    if ((j.status === 'ACCEPTED' || j.status === 'SYNONYM') && j.confidence >= 90 && j.family && (j.usageKey || j.acceptedUsageKey)) {
      const key = j.status === 'SYNONYM' ? j.acceptedUsageKey : j.usageKey;
      gbif = { key, url: 'https://www.gbif.org/species/' + key,
        scientificName: j.scientificName, canonicalName: j.canonicalName, family: j.family,
        rank: j.rank, status: j.status, matchType: j.matchType, confidence: j.confidence };
    }
  } catch {}
  if (!gbif) { console.log('DROP ' + id + ': GBIF بلا تطابق مقبول (' + g.status + ')'); dropped++; continue; }
  writeFileSync(out, JSON.stringify({
    schema: 1, crop_id: id, generated_by: 'scripts/advice-harvest.mjs', fetched_at: new Date().toISOString().slice(0, 10),
    candidate: { ar, en, fr, sci_expected: sci }, eppo, gbif
  }, null, 2) + '\n');
  console.log('KEEP ' + id + ' (' + eppo.code + ' · آفات ' + eppo.pests.length + ' · ' + gbif.family + ')');
  kept++;
}
console.log('HARVEST-BATCH: kept=' + kept + ' dropped=' + dropped + ' offset=' + offset);
