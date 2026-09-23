import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, stringifyCsv } from './csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const batchPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;
if (!batchPath) throw new Error('Передайте путь к JSON-файлу публикационного пакета.');
const research = path.join(root, 'content/research');
const [batchText, libraryText, mediaText, flagText, emblemText, landmarkText, reviewText] = await Promise.all([
  readFile(batchPath, 'utf8'),
  readFile(path.join(root, 'content/library.json'), 'utf8'),
  readFile(path.join(root, 'content/media.json'), 'utf8'),
  ...['flag-variants.csv', 'emblems.csv', 'landmark-candidates.csv', 'media-review.csv']
    .map(file => readFile(path.join(research, file), 'utf8')),
]);
const batch = JSON.parse(batchText);
const library = JSON.parse(libraryText);
const media = JSON.parse(mediaText);
const tables = {
  flag: parseCsv(flagText), emblem: parseCsv(emblemText), landmark: parseCsv(landmarkText),
  media: parseCsv(reviewText),
};
const registryId = { flag: 'variant_id', emblem: 'symbol_id', landmark: 'landmark_id' };
const addUnique = (target, incoming, label) => {
  const ids = new Set(target.map(item => item.id));
  for (const item of incoming ?? []) {
    if (!item.id || ids.has(item.id)) throw new Error(`Повтор ${label}: ${item.id}`);
    ids.add(item.id);
    target.push(item);
  }
};

for (const item of batch.entries ?? []) {
  const rows = tables[item.kind];
  const row = rows?.find(candidate => candidate[registryId[item.kind]] === item.id);
  if (!row || row.decision !== 'eligible' || row.content_entry_id) {
    throw new Error(`Нет свободного eligible-решения реестра для ${item.id}`);
  }
  if (item.status !== 'published') throw new Error(`Карточка ${item.id} не помечена published`);
  if (!(batch.media ?? []).some(asset => asset.id === item.mediaId)) throw new Error(`Нет медиа в пакете для ${item.id}`);
  row.content_entry_id = item.id;
  row.review_status = 'reviewed';
}
for (const asset of batch.media ?? []) {
  const localFile = path.resolve(root, 'public', asset.localPath.replace(/^\//, ''));
  if (!localFile.startsWith(path.join(root, 'public') + path.sep)) throw new Error(`Недопустимый путь медиа: ${asset.localPath}`);
  await access(localFile);
  if (tables.media.some(row => row.media_id === asset.id)) throw new Error(`Медиа уже в реестре: ${asset.id}`);
  tables.media.push({
    media_id: asset.id, content_entry_ids: (batch.entries ?? []).filter(item => item.mediaId === asset.id).map(item => item.id).join('|'),
    source_page_url: asset.sourcePageUrl, original_asset_url: asset.originalAssetUrl ?? '',
    publisher: asset.publisher, author: asset.author ?? '', rights_holder: asset.rightsHolder ?? '',
    license: asset.license, rights_url: asset.rightsUrl ?? '', attribution_text: asset.attributionText ?? '',
    checked_at: asset.checkedAt, decision: 'approved', decision_reason: 'Проверены страница конкретного файла, права и локальный актив.', notes: '',
  });
}
addUnique(library.countries, batch.countries, 'страны');
addUnique(library.sources, batch.sources, 'источника');
addUnique(library.entries, batch.entries, 'карточки');
addUnique(media, batch.media, 'медиа');

const countryIds = new Set(library.countries.map(item => item.id));
for (const item of batch.entries ?? []) {
  const referencedCountries = item.kind === 'landmark' ? item.countryIds : [item.countryId];
  for (const countryId of referencedCountries) {
    if (!countryIds.has(countryId)) throw new Error(`Не найдена страна ${countryId} для ${item.id}`);
  }
}

const json = value => `${JSON.stringify(value, null, 2)}\n`;
const csv = (headers, rows) => stringifyCsv(headers, rows);
await Promise.all([
  writeFile(path.join(root, 'content/library.json'), json(library)),
  writeFile(path.join(root, 'content/media.json'), json(media)),
  writeFile(path.join(research, 'flag-variants.csv'), csv(['country_id', 'variant_id', 'content_entry_id', 'variant_type', 'is_primary_study_variant', 'official_status', 'graphic_elements', 'decision', 'decision_reason', 'source_ids', 'primary_source_urls', 'review_status', 'checked_at', 'notes'], tables.flag)),
  writeFile(path.join(research, 'emblems.csv'), csv(['country_id', 'symbol_id', 'content_entry_id', 'symbol_type', 'official_name_ru', 'elements', 'decision', 'decision_reason', 'source_ids', 'primary_source_urls', 'review_status', 'checked_at', 'notes'], tables.emblem)),
  writeFile(path.join(research, 'landmark-candidates.csv'), csv(['landmark_id', 'content_entry_id', 'name_original', 'name_ru', 'landmark_type', 'country_ids', 'region', 'coordinates', 'significance_basis', 'source_catalog', 'source_ids', 'source_urls', 'decision', 'decision_reason', 'review_status', 'checked_at', 'notes'], tables.landmark)),
  writeFile(path.join(research, 'media-review.csv'), csv(['media_id', 'content_entry_ids', 'source_page_url', 'original_asset_url', 'publisher', 'author', 'rights_holder', 'license', 'rights_url', 'attribution_text', 'checked_at', 'decision', 'decision_reason', 'notes'], tables.media)),
]);
console.log(`Опубликован пакет ${batch.batch_id}: ${batch.entries.length} карточек.`);
