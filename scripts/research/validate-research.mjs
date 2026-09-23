import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const research = path.join(root, 'content/research');
const read = name => readFile(path.join(research, name), 'utf8').then(parseCsv);
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const split = value => value ? value.split('|').filter(Boolean) : [];

function unique(rows, field, label) {
  const seen = new Set();
  for (const row of rows) {
    assert(Boolean(row[field]), `${label}: пустое поле ${field}`);
    assert(!seen.has(row[field]), `${label}: повтор ${field}=${row[field]}`);
    seen.add(row[field]);
  }
  return seen;
}

const [countries, flags, emblems, landmarks, natureCatalog, sources, media] = await Promise.all([
  read('countries.csv'), read('flag-variants.csv'), read('emblems.csv'), read('landmark-candidates.csv'), read('nature-source-catalog.csv'), read('sources.csv'), read('media-review.csv'),
]);
const countryIds = unique(countries, 'country_id', 'countries.csv');
unique(countries, 'm49', 'countries.csv');
unique(countries, 'iso2', 'countries.csv');
unique(countries, 'iso3', 'countries.csv');
const sourceIds = unique(sources, 'source_id', 'sources.csv');
unique(flags, 'variant_id', 'flag-variants.csv');
unique(emblems, 'symbol_id', 'emblems.csv');
unique(landmarks, 'landmark_id', 'landmark-candidates.csv');
unique(natureCatalog, 'catalog_record_id', 'nature-source-catalog.csv');
unique(media, 'media_id', 'media-review.csv');

assert(countries.length === 195, `countries.csv: ожидалось 195 стран, найдено ${countries.length}`);
assert(countries.filter(row => row.membership_status === 'member').length === 193, 'countries.csv: должно быть 193 члена ООН');
assert(countries.filter(row => row.membership_status === 'observer').length === 2, 'countries.csv: должно быть 2 государства-наблюдателя');
const allowedCountryStatuses = new Set(['pending', 'in_progress', 'complete', 'deferred']);
for (const row of countries) {
  assert(/^\d{3}$/.test(row.m49), `countries.csv: неверный M49 у ${row.country_id}`);
  assert(/^[A-Z]{2}$/.test(row.iso2), `countries.csv: неверный ISO2 у ${row.country_id}`);
  assert(/^[A-Z]{3}$/.test(row.iso3), `countries.csv: неверный ISO3 у ${row.country_id}`);
  assert(allowedCountryStatuses.has(row.audit_status), `countries.csv: неверный audit_status у ${row.country_id}`);
}

const decisions = new Set(['eligible', 'excluded', 'deferred']);
const reviews = new Set(['needs_revalidation', 'sources_checked', 'media_checked', 'reviewed']);
for (const [name, rows, idField] of [['flag-variants.csv', flags, 'variant_id'], ['emblems.csv', emblems, 'symbol_id']]) {
  for (const row of rows) {
    assert(countryIds.has(row.country_id), `${name}: неизвестная страна ${row.country_id}`);
    assert(decisions.has(row.decision), `${name}: неверное решение у ${row[idField]}`);
    assert(reviews.has(row.review_status), `${name}: неверный review_status у ${row[idField]}`);
    for (const sourceId of split(row.source_ids)) assert(sourceIds.has(sourceId), `${name}: неизвестный источник ${sourceId}`);
    assert(Boolean(row.decision_reason), `${name}: нет причины решения у ${row[idField]}`);
  }
}
for (const row of landmarks) {
  for (const countryId of split(row.country_ids)) assert(countryIds.has(countryId), `landmark-candidates.csv: неизвестная страна ${countryId}`);
  for (const sourceId of split(row.source_ids)) assert(sourceIds.has(sourceId), `landmark-candidates.csv: неизвестный источник ${sourceId}`);
  assert(decisions.has(row.decision), `landmark-candidates.csv: неверное решение у ${row.landmark_id}`);
  assert(reviews.has(row.review_status), `landmark-candidates.csv: неверный review_status у ${row.landmark_id}`);
}
const catalogKinds = new Set(['world_heritage_natural', 'world_heritage_mixed', 'unesco_global_geopark']);
const catalogStatuses = new Set(['active', 'delisted']);
for (const row of natureCatalog) {
  for (const countryId of split(row.country_ids)) assert(countryIds.has(countryId), `nature-source-catalog.csv: неизвестная страна ${countryId}`);
  assert(catalogKinds.has(row.catalog), `nature-source-catalog.csv: неизвестный каталог у ${row.catalog_record_id}`);
  assert(catalogStatuses.has(row.catalog_status), `nature-source-catalog.csv: неверный catalog_status у ${row.catalog_record_id}`);
  assert(decisions.has(row.candidate_decision), `nature-source-catalog.csv: неверное решение у ${row.catalog_record_id}`);
  assert(/^https:\/\//.test(row.source_url), `nature-source-catalog.csv: источник ${row.catalog_record_id} должен использовать HTTPS`);
}
assert(natureCatalog.filter(row => row.catalog === 'world_heritage_natural' && row.catalog_status === 'active').length === 240, 'nature-source-catalog.csv: ожидалось 240 действующих natural объектов ЮНЕСКО');
assert(natureCatalog.filter(row => row.catalog === 'world_heritage_natural' && row.catalog_status === 'delisted').length === 1, 'nature-source-catalog.csv: ожидалась одна delisted natural запись');
assert(natureCatalog.filter(row => row.catalog === 'world_heritage_mixed').length === 42, 'nature-source-catalog.csv: ожидалось 42 mixed объекта ЮНЕСКО');
assert(natureCatalog.filter(row => row.catalog === 'unesco_global_geopark').length === 239, 'nature-source-catalog.csv: в детальном списке должно быть 239 уникальных названий геопарков');
for (const row of sources) assert(/^https:\/\//.test(row.url), `sources.csv: источник ${row.source_id} должен использовать HTTPS`);
const mediaDecisions = new Set(['needs_revalidation', 'approved', 'rejected', 'deferred']);
for (const row of media) {
  assert(mediaDecisions.has(row.decision), `media-review.csv: неверное решение у ${row.media_id}`);
  if (/CC BY(?:-|\s)/.test(row.license)) assert(Boolean(row.attribution_text), `media-review.csv: нет атрибуции у ${row.media_id}`);
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  const completed = countries.filter(row => row.audit_status === 'complete').length;
  const deferredCountries = countries.filter(row => row.audit_status === 'deferred').length;
    console.log(`Реестры корректны: страны ${countries.length} (complete ${completed}, deferred ${deferredCountries}), флаги ${flags.length}, символы ${emblems.length}, природные кандидаты ${landmarks.length}, строки исходных природных каталогов ${natureCatalog.length}, источники ${sources.length}, медиа ${media.length}.`);
}
