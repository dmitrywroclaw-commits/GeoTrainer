import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, stringifyCsv } from './csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const research = path.join(root, 'content/research');
const checkedAt = '2026-09-22';
const geoparksPath = process.argv[2];

if (!geoparksPath) throw new Error('Передайте путь к сохранённой официальной странице списка геопарков ЮНЕСКО.');

const decodeHtml = value => value
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replaceAll('&nbsp;', ' ')
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&#039;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>');
const textContent = value => decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const normalizeName = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const slug = value => normalizeName(value).replace(/\s+/g, '-');

const [whcText, countriesText, geoparksHtml] = await Promise.all([
  readFile(path.join(research, 'unesco-whc-source-catalog.json'), 'utf8'),
  readFile(path.join(research, 'countries.csv'), 'utf8'),
  readFile(path.resolve(geoparksPath), 'utf8'),
]);
const whc = JSON.parse(whcText);
const countries = parseCsv(countriesText);
const byIso2 = new Map(countries.map(country => [country.iso2.toLowerCase(), country.country_id]));
const byName = new Map(countries.map(country => [normalizeName(country.official_name_en), country.country_id]));
const aliases = new Map([
  ['netherlands kingdom of the', 'netherlands-kingdom-of-the'],
  ['republic of korea', 'south-korea'],
  ['tanzania', 'tanzania'],
  ['turkiye', 'turkiye'],
  ['vietnam', 'vietnam'],
]);
for (const [name, id] of aliases) byName.set(normalizeName(name), id);

const rows = [];
for (const [category, records] of [['world_heritage_natural', whc.natural], ['world_heritage_mixed', whc.mixed]]) {
  for (const record of records) {
    const countryIds = record.countries.map(code => byIso2.get(code)).filter(Boolean);
    if (countryIds.length !== record.countries.length) throw new Error(`Не сопоставлены страны WHC ${record.id}: ${record.countries.join(', ')}`);
    rows.push({
      catalog_record_id: `whc-${record.id}`,
      catalog: category,
      official_name: record.name,
      country_ids: [...new Set(countryIds)].join('|'),
      source_url: `https://whc.unesco.org/en/list/${record.id}`,
      catalog_status: record.delisted ? 'delisted' : 'active',
      review_status: 'pending_decomposition',
      candidate_decision: record.delisted ? 'excluded' : 'deferred',
      decision_reason: record.delisted
        ? 'Объект исключён из списка всемирного наследия; сохранён для воспроизводимости среза и не считается действующим кандидатом.'
        : 'Запись исходного каталога ещё нужно разложить на конкретные физические объекты и проверить визуальную узнаваемость.',
      checked_at: checkedAt,
      notes: category === 'world_heritage_mixed' ? 'Смешанный объект: природная составляющая требует отдельного редакционного выделения.' : '',
    });
  }
}

const start = geoparksHtml.indexOf('id="full-list-of-unesco-global-geoparks"');
const end = geoparksHtml.indexOf('id="transnational-unesco-global-geoparks"', start);
if (start < 0 || end < 0) throw new Error('Не найден раздел полного списка геопарков ЮНЕСКО.');
const section = geoparksHtml.slice(start, end);
const geoparks = new Map();
for (const chunk of section.split('<div class="field__item accordion-item">').slice(1)) {
  const countryMatch = chunk.match(/<button[^>]*>(.*?)<\/button>/s);
  if (!countryMatch) continue;
  const countryName = textContent(countryMatch[1]).replace(/\*+$/, '').trim();
  const countryId = byName.get(normalizeName(countryName));
  if (!countryId) throw new Error(`Не сопоставлена страна геопарка: ${countryName}`);

  const itemPattern = /<li[^>]*>(.*?)<\/li>/gs;
  for (const itemMatch of chunk.matchAll(itemPattern)) {
    const item = itemMatch[1];
    const name = textContent(item).replace(/\*.*$/, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    if (!/(?:unesco )?global geopark/i.test(name)) continue;
    const linkMatch = item.match(/<a[^>]+href="(https:\/\/www\.unesco\.org\/en\/iggp\/[^\"]+)"/s);
    let url = 'https://www.unesco.org/en/iggp/geoparks#full-list-of-unesco-global-geoparks';
    if (linkMatch) {
      const parsedUrl = new URL(decodeHtml(linkMatch[1]));
      parsedUrl.search = '';
      parsedUrl.hash = '';
      url = parsedUrl.toString();
    }
    const key = normalizeName(name);
    const existing = geoparks.get(key) ?? { url, name, countryIds: [] };
    if (existing.url.includes('#full-list') && !url.includes('#full-list')) existing.url = url;
    if (!existing.countryIds.includes(countryId)) existing.countryIds.push(countryId);
    geoparks.set(key, existing);
  }
}
const headlineCount = Number(geoparksHtml.match(/At present,\s*(\d+)\s*geoparks/i)?.[1]);
if (!headlineCount) throw new Error('Не найдено заявленное количество геопарков.');
if (geoparks.size > headlineCount) throw new Error(`Детальный список (${geoparks.size}) больше заявленного числа (${headlineCount}).`);

for (const geopark of geoparks.values()) {
  rows.push({
    catalog_record_id: `geopark-${slug(geopark.name.replace(/(?:unesco )?global geopark/ig, '').trim())}`,
    catalog: 'unesco_global_geopark',
    official_name: geopark.name,
    country_ids: geopark.countryIds.join('|'),
    source_url: geopark.url,
    catalog_status: 'active',
    review_status: 'pending_decomposition',
    candidate_decision: 'deferred',
    decision_reason: 'Статус геопарка не создаёт одну учебную карточку: требуется выделить конкретную формацию, каньон, пещеру, вулкан или иной физический объект.',
    checked_at: checkedAt,
    notes: '',
  });
}

const headers = ['catalog_record_id', 'catalog', 'official_name', 'country_ids', 'source_url', 'catalog_status', 'review_status', 'candidate_decision', 'decision_reason', 'checked_at', 'notes'];
const audit = {
  checkedAt,
  worldHeritage: {
    officialListUrl: whc.sourceUrl,
    naturalActive: whc.natural.filter(record => !record.delisted).length,
    naturalDelisted: whc.natural.filter(record => record.delisted).length,
    mixedActive: whc.mixed.length,
  },
  globalGeoparks: {
    officialListUrl: 'https://www.unesco.org/en/iggp/geoparks',
    headlineCount,
    uniqueDetailedEntries: geoparks.size,
    unresolvedCountDifference: headlineCount - geoparks.size,
    note: headlineCount === geoparks.size ? '' : 'Заявленный итог страницы не совпадает с числом уникальных названий в детальном списке; разницу нельзя заполнять догадками.',
  },
};
await Promise.all([
  writeFile(path.join(research, 'nature-source-catalog.csv'), stringifyCsv(headers, rows), 'utf8'),
  writeFile(path.join(research, 'nature-source-catalog-audit.json'), `${JSON.stringify(audit, null, 2)}\n`, 'utf8'),
]);
console.log(`Создан природный каталог: ${audit.worldHeritage.naturalActive} natural, ${audit.worldHeritage.mixedActive} mixed, ${geoparks.size}/${headlineCount} geoparks, ${rows.length} строк с исторической delisted-записью.`);
