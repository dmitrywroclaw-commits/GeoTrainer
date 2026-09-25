import { readFileSync, writeFileSync } from 'node:fs';
import { parseCsv, stringifyCsv } from './csv.mjs';

const dataPath = 'content/library.json';
const sourcePath = 'content/research/sources.csv';
const variantsPath = 'content/research/flag-variants.csv';
const library = JSON.parse(readFileSync(dataPath, 'utf8'));
const meanings = JSON.parse(readFileSync('content/research/flag-meaning-draft.json', 'utf8'));
const source = {
  id: 'cia-factbook-flags-2020',
  title: 'The World Factbook: Flags of the World (2020 archive)',
  publisher: 'U.S. Central Intelligence Agency; archived mirror by Simon Willison',
  url: 'https://simonw.github.io/cia-world-factbook-2020/docs/flagsoftheworld.html',
  sourceType: 'other_authoritative',
  accessedAt: '2026-09-25',
};
const specialSources = [
  { id: 'ps-flag-history', title: 'The Palestinian Flag', publisher: 'State of Palestine, Ministry of Foreign Affairs and Expatriates', url: 'https://www.mfae.gov.ps/en-us/palestine/thepalestinianflag', sourceType: 'government', accessedAt: '2026-09-25', supports: 'Происхождение рисунка от флага Арабского восстания и история использования.' },
  { id: 'sy-current-flag-meaning', title: 'About the Flag', publisher: 'Syrian Ministry of Culture', url: 'https://events.moc.gov.sy/en/about-flag', sourceType: 'government', accessedAt: '2026-09-25', supports: 'Значение цветов и трёх звёзд действующего флага.' },
  { id: 'af-emirate-flag-decree', title: 'The Constitution and Laws of the Taliban 1994–2001: Decree on the Flag', publisher: 'International IDEA', url: 'https://www.idea.int/sites/default/files/publications/the-constitution-and-laws-of-the-taliban-1994-2001-hints-from-the-past-and-the-future-en.pdf', sourceType: 'other_authoritative', accessedAt: '2026-09-25', supports: 'Белое полотнище и шахада в историческом декрете Исламского Эмирата.' },
  { id: 'lt-historical-state-flag', title: 'Historical Flag of the State of Lithuania', publisher: 'Seimas of the Republic of Lithuania', url: 'https://www.lrs.lt/sip/portal.show?p_k=2&p_kade_id=8&p_r=38112&printVersion=1', sourceType: 'government', accessedAt: '2026-09-25', supports: 'Исторический государственный флаг с Витисом и закон 2004 года.' },
];
const specialSourceByFlag = {
  'palestine-national-flag': 'ps-flag-history',
  'syria-national-flag': 'sy-current-flag-meaning',
  'afghanistan-national-flag': 'af-emirate-flag-decree',
  'lithuania-state-flag': 'lt-historical-state-flag',
};
const existingSourceOnly = new Set([
  'angola-national-flag', 'bhutan-national-flag', 'antigua-and-barbuda-national-flag',
  'myanmar-national-flag', 'burundi-national-flag', 'cambodia-national-flag',
  'cameroon-national-flag', 'cabo-verde-national-flag',
  'central-african-republic-national-flag', 'sri-lanka-national-flag',
  'democratic-republic-of-the-congo-national-flag', 'cuba-national-flag',
  'botswana-national-flag', 'armenia-national-flag', 'cyprus-national-flag',
]);
if (!library.sources.some(item => item.id === source.id)) library.sources.push(source);
for (const item of specialSources) if (!library.sources.some(source => source.id === item.id)) library.sources.push(item);
for (const [id, meaning] of Object.entries(meanings)) {
  const entry = library.entries.find(item => item.id === id && item.kind === 'flag');
  if (!entry) throw new Error(`Unknown flag ${id}`);
  entry.explanationRu = meaning;
  const sourceId = existingSourceOnly.has(id) ? null : (specialSourceByFlag[id] ?? source.id);
  if (sourceId && !entry.sourceIds.includes(sourceId)) entry.sourceIds.push(sourceId);
  entry.verifiedAt = '2026-09-25';
}
writeFileSync(dataPath, `${JSON.stringify(library, null, 2)}\n`);

const csvText = readFileSync(sourcePath, 'utf8');
const csvRows = parseCsv(csvText);
if (!csvRows.some(item => item.source_id === source.id)) csvRows.push({
  source_id: source.id, title: source.title, publisher: source.publisher,
  source_type: 'other_authoritative', url: source.url, accessed_at: source.accessedAt,
  supports: 'Архивные описания флагов и распространённые толкования элементов; актуальность варианта сверять отдельно.',
});
for (const item of specialSources) if (!csvRows.some(row => row.source_id === item.id)) csvRows.push({
  source_id: item.id, title: item.title, publisher: item.publisher,
  source_type: item.sourceType, url: item.url, accessed_at: item.accessedAt,
  supports: item.supports,
});
writeFileSync(sourcePath, stringifyCsv(Object.keys(csvRows[0]), csvRows));

const variantsText = readFileSync(variantsPath, 'utf8');
const variants = parseCsv(variantsText);
for (const id of Object.keys(meanings)) {
  const row = variants.find(item => item.content_entry_id === id);
  if (!row) throw new Error(`Missing research row for ${id}`);
  const sourceId = existingSourceOnly.has(id) ? null : (specialSourceByFlag[id] ?? source.id);
  if (sourceId && !row.source_ids.split('|').includes(sourceId)) row.source_ids = `${row.source_ids}|${sourceId}`;
  row.checked_at = '2026-09-25';
}
writeFileSync(variantsPath, stringifyCsv(Object.keys(variants[0]), variants));
console.log(`Updated ${Object.keys(meanings).length} flags`);
