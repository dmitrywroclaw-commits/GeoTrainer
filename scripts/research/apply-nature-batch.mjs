import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, stringifyCsv } from './csv.mjs';
import { writeIfChanged } from './write-if-changed.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const research = path.join(root, 'content/research');
const batchPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;
if (!batchPath) throw new Error('Передайте путь к JSON-файлу природного пакета.');

const files = {
  sources: 'sources.csv',
  landmarks: 'landmark-candidates.csv',
  catalog: 'nature-source-catalog.csv',
};
const [batchText, ...csvTexts] = await Promise.all([
  readFile(batchPath, 'utf8'),
  ...Object.values(files).map(file => readFile(path.join(research, file), 'utf8')),
]);
const batch = JSON.parse(batchText);
const tables = Object.fromEntries(Object.keys(files).map((key, index) => [key, parseCsv(csvTexts[index])]));
const catalogById = new Map(tables.catalog.map(row => [row.catalog_record_id, row]));
const sourceIds = new Set(tables.sources.map(row => row.source_id));
const landmarkIds = new Set(tables.landmarks.map(row => row.landmark_id));

for (const source of batch.sources ?? []) {
  if (!source.source_id || sourceIds.has(source.source_id)) throw new Error(`Повтор источника: ${source.source_id}`);
  sourceIds.add(source.source_id);
  tables.sources.push(source);
}
for (const item of batch.landmarks ?? []) {
  if (!item.landmark_id || landmarkIds.has(item.landmark_id)) throw new Error(`Повтор объекта: ${item.landmark_id}`);
  for (const sourceId of item.source_ids?.split('|') ?? []) {
    if (sourceId && !sourceIds.has(sourceId)) throw new Error(`Неизвестный источник: ${sourceId}`);
  }
  landmarkIds.add(item.landmark_id);
  tables.landmarks.push({ content_entry_id: '', review_status: 'sources_checked', checked_at: batch.checked_at, notes: '', ...item });
}
for (const update of batch.catalog_updates ?? []) {
  const row = catalogById.get(update.catalog_record_id);
  if (!row) throw new Error(`Неизвестная исходная запись: ${update.catalog_record_id}`);
  for (const landmarkId of update.landmark_ids ?? []) {
    if (!landmarkIds.has(landmarkId)) throw new Error(`Неизвестный выделенный объект: ${landmarkId}`);
  }
  row.review_status = 'sources_checked';
  row.candidate_decision = update.candidate_decision;
  row.decision_reason = update.decision_reason;
  row.checked_at = batch.checked_at;
  row.notes = `Выделенные объекты: ${(update.landmark_ids ?? []).join('|')}`;
}

const headers = {
  sources: ['source_id', 'title', 'publisher', 'source_type', 'url', 'accessed_at', 'supports'],
  landmarks: ['landmark_id', 'content_entry_id', 'name_original', 'name_ru', 'landmark_type', 'country_ids', 'region', 'coordinates', 'significance_basis', 'source_catalog', 'source_ids', 'source_urls', 'decision', 'decision_reason', 'review_status', 'checked_at', 'notes'],
  catalog: ['catalog_record_id', 'catalog', 'official_name', 'country_ids', 'source_url', 'catalog_status', 'review_status', 'candidate_decision', 'decision_reason', 'checked_at', 'notes'],
};
await Promise.all(Object.entries(files).map(([key, file], index) =>
  writeIfChanged(path.join(research, file), stringifyCsv(headers[key], tables[key]), csvTexts[index])));
console.log(`Применён природный пакет ${batch.batch_id}: ${batch.landmarks.length} конкретных объектов.`);
