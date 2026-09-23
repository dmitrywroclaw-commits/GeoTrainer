import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, stringifyCsv } from './csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const research = path.join(root, 'content/research');
const batchPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : null;

if (!batchPath) {
  throw new Error('Передайте путь к JSON-файлу пакета.');
}

const headers = {
  countries: ['membership_status', 'm49', 'iso2', 'iso3', 'country_id', 'official_name_en', 'name_ru', 'region_en', 'region_ru', 'audit_status', 'checked_at', 'owner', 'roster_source_url', 'codes_source_url', 'notes'],
  flags: ['country_id', 'variant_id', 'content_entry_id', 'variant_type', 'is_primary_study_variant', 'official_status', 'graphic_elements', 'decision', 'decision_reason', 'source_ids', 'primary_source_urls', 'review_status', 'checked_at', 'notes'],
  emblems: ['country_id', 'symbol_id', 'content_entry_id', 'symbol_type', 'official_name_ru', 'elements', 'decision', 'decision_reason', 'source_ids', 'primary_source_urls', 'review_status', 'checked_at', 'notes'],
  sources: ['source_id', 'title', 'publisher', 'source_type', 'url', 'accessed_at', 'supports'],
};

const files = {
  countries: 'countries.csv',
  flags: 'flag-variants.csv',
  emblems: 'emblems.csv',
  sources: 'sources.csv',
};

const [batchText, ...csvTexts] = await Promise.all([
  readFile(batchPath, 'utf8'),
  ...Object.values(files).map(file => readFile(path.join(research, file), 'utf8')),
]);
const batch = JSON.parse(batchText);
const tables = Object.fromEntries(Object.keys(files).map((key, index) => [key, parseCsv(csvTexts[index])]));
const countryById = new Map(tables.countries.map(row => [row.country_id, row]));

for (const source of batch.sources ?? []) {
  if (tables.sources.some(row => row.source_id === source.source_id)) {
    throw new Error(`Источник уже существует: ${source.source_id}`);
  }
  tables.sources.push(source);
}

for (const item of batch.countries ?? []) {
  const country = countryById.get(item.country_id);
  if (!country) throw new Error(`Неизвестная страна: ${item.country_id}`);
  country.audit_status = item.audit_status;
  country.checked_at = batch.checked_at;
  country.owner = batch.owner;
  country.notes = item.notes ?? '';

  for (const flag of item.flags ?? []) {
    if (tables.flags.some(row => row.variant_id === flag.variant_id)) {
      throw new Error(`Вариант флага уже существует: ${flag.variant_id}`);
    }
    tables.flags.push({
      content_entry_id: '',
      is_primary_study_variant: 'false',
      review_status: 'sources_checked',
      checked_at: batch.checked_at,
      notes: '',
      ...flag,
      country_id: item.country_id,
    });
  }

  for (const emblem of item.emblems ?? []) {
    if (tables.emblems.some(row => row.symbol_id === emblem.symbol_id)) {
      throw new Error(`Национальный символ уже существует: ${emblem.symbol_id}`);
    }
    tables.emblems.push({
      content_entry_id: '',
      review_status: 'sources_checked',
      checked_at: batch.checked_at,
      notes: '',
      ...emblem,
      country_id: item.country_id,
    });
  }
}

await Promise.all(Object.entries(files).map(([key, file]) =>
  writeFile(path.join(research, file), stringifyCsv(headers[key], tables[key]), 'utf8')));

console.log(`Применён пакет ${batch.batch_id}: ${batch.countries.length} стран.`);
