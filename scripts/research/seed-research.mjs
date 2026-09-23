import { readFile, mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { stringifyCsv } from './csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDirectory = path.join(root, 'content/research');
const files = {
  countries: path.join(outputDirectory, 'countries.csv'),
  flags: path.join(outputDirectory, 'flag-variants.csv'),
  emblems: path.join(outputDirectory, 'emblems.csv'),
  landmarks: path.join(outputDirectory, 'landmark-candidates.csv'),
  sources: path.join(outputDirectory, 'sources.csv'),
  media: path.join(outputDirectory, 'media-review.csv'),
};
const urls = {
  members: 'https://www.un.org/about-us/member-states',
  observers: 'https://www.un.org/en/node/123012',
  m49: 'https://unstats.un.org/unsd/methodology/m49/overview/',
};
const checkedAt = '2026-09-22';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === '--force') args.set('force', true);
  else if (argument.startsWith('--') && process.argv[index + 1]) args.set(argument.slice(2), process.argv[++index]);
}

function decodeHtml(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function tableRows(html, tableId) {
  const table = html.match(new RegExp(`<table[^>]+id\\s*=\\s*["']?${tableId}["']?[^>]*>([\\s\\S]*?)<\\/table>`, 'i'));
  if (!table) throw new Error(`Не найдена таблица ${tableId}`);
  return [...table[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
    .map(match => match[1].replace(/<!--[\s\S]*?-->/g, ''))
    .map(row => [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => decodeHtml(cell[1])))
    .filter(cells => cells.length >= 12 && /^[A-Z]{2}$/.test(cells[10]));
}

function memberStates(html) {
  const states = [...html.matchAll(/<div class="flags flags-([a-z]{2})">[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(match => ({ iso2: match[1].toUpperCase(), unName: decodeHtml(match[2]) }));
  const unique = new Map(states.map(state => [state.iso2, state]));
  if (unique.size !== 193) throw new Error(`На странице ООН ожидалось 193 государства, найдено ${unique.size}`);
  return [...unique.values()];
}

function slug(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const idOverrides = {
  BO: 'bolivia', BN: 'brunei', CD: 'democratic-republic-of-the-congo', CI: 'cote-divoire',
  CZ: 'czechia', FM: 'micronesia', GB: 'united-kingdom', IR: 'iran', KP: 'north-korea',
  KR: 'south-korea', LA: 'laos', MD: 'moldova', PS: 'palestine', RU: 'russia',
  SY: 'syria', TZ: 'tanzania', US: 'united-states', VA: 'holy-see', VE: 'venezuela', VN: 'vietnam',
};

async function loadHtml(argument, url) {
  if (argument) return readFile(argument, 'utf8');
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Не удалось загрузить ${url}: ${response.status}`);
  return response.text();
}

function sourceUrls(sourceIds, sourceMap) {
  return sourceIds.map(sourceId => sourceMap.get(sourceId)?.url).filter(Boolean).join('|');
}

async function main() {
  if (!args.has('force')) {
    for (const file of Object.values(files)) {
      try {
        await access(file);
        throw new Error(`Файл уже существует: ${path.relative(root, file)}. Для пересоздания используйте --force.`);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
  }

  const [membersHtml, m49Html, library, media] = await Promise.all([
    loadHtml(args.get('members'), urls.members),
    loadHtml(args.get('m49'), urls.m49),
    readFile(path.join(root, 'content/library.json'), 'utf8').then(JSON.parse),
    readFile(path.join(root, 'content/media.json'), 'utf8').then(JSON.parse),
  ]);

  const english = new Map(tableRows(m49Html, 'downloadTableEN').map(row => [row[10], row]));
  const russian = new Map(tableRows(m49Html, 'downloadTableRU').map(row => [row[10], row]));
  const roster = [...memberStates(membersHtml),
    { iso2: 'VA', unName: 'Holy See', membershipStatus: 'observer' },
    { iso2: 'PS', unName: 'State of Palestine', membershipStatus: 'observer' },
  ];
  const nationalContentCountries = new Set(library.entries.filter(entry => entry.kind !== 'landmark').map(entry => entry.countryId));

  const countryRows = roster.map(state => {
    const en = english.get(state.iso2);
    const ru = russian.get(state.iso2);
    if (!en || !ru) throw new Error(`В M49 не найдена страна ${state.unName} (${state.iso2})`);
    const countryId = idOverrides[state.iso2] ?? slug(en[8]);
    return {
      membership_status: state.membershipStatus ?? 'member', m49: en[9], iso2: en[10], iso3: en[11],
      country_id: countryId, official_name_en: en[8], name_ru: ru[8],
      region_en: en[7] || en[5] || en[3], region_ru: ru[7] || ru[5] || ru[3],
      audit_status: nationalContentCountries.has(countryId) ? 'in_progress' : 'pending',
      checked_at: '', owner: '', roster_source_url: state.membershipStatus === 'observer' ? urls.observers : urls.members,
      codes_source_url: urls.m49, notes: nationalContentCountries.has(countryId) ? 'Есть опубликованный контент; требуется повторная проверка по новому процессу.' : '',
    };
  }).sort((a, b) => a.m49.localeCompare(b.m49));
  if (countryRows.length !== 195) throw new Error(`Ожидалось 195 стран, получено ${countryRows.length}`);

  const sources = [...library.sources,
    { id: 'un-member-states', title: 'Member States', publisher: 'United Nations', url: urls.members, sourceType: 'other_authoritative', accessedAt: checkedAt, supports: 'Состав 193 государств — членов ООН' },
    { id: 'un-observer-states', title: 'Non-Member States', publisher: 'United Nations', url: urls.observers, sourceType: 'other_authoritative', accessedAt: checkedAt, supports: 'Святой Престол и Государство Палестина как государства-наблюдатели' },
    { id: 'un-m49', title: 'Standard country or area codes for statistical use (M49)', publisher: 'United Nations Statistics Division', url: urls.m49, sourceType: 'other_authoritative', accessedAt: checkedAt, supports: 'Коды и региональная классификация стран' },
  ];
  const sourceMap = new Map(sources.map(source => [source.id, source]));

  const flagRows = library.entries.filter(entry => entry.kind === 'flag').map(entry => ({
    country_id: entry.countryId, variant_id: entry.id, content_entry_id: entry.id, variant_type: entry.variantType,
    is_primary_study_variant: String(entry.isPrimaryStudyVariant), official_status: 'official',
    graphic_elements: entry.symbols.map(symbol => symbol.category).join('|'), decision: 'eligible',
    decision_reason: 'Уже опубликовано; требуется повторная проверка источников и варианта.',
    source_ids: entry.sourceIds.join('|'), primary_source_urls: sourceUrls(entry.sourceIds, sourceMap),
    review_status: 'needs_revalidation', checked_at: entry.verifiedAt, notes: '',
  }));
  const emblemRows = library.entries.filter(entry => entry.kind === 'emblem').map(entry => ({
    country_id: entry.countryId, symbol_id: entry.id, content_entry_id: entry.id, symbol_type: entry.symbolType,
    official_name_ru: entry.nameRu, elements: entry.symbols.map(symbol => symbol.category).join('|'), decision: 'eligible',
    decision_reason: 'Уже опубликовано; требуется повторная проверка источников и типа символа.',
    source_ids: entry.sourceIds.join('|'), primary_source_urls: sourceUrls(entry.sourceIds, sourceMap),
    review_status: 'needs_revalidation', checked_at: entry.verifiedAt, notes: '',
  }));
  const landmarkRows = library.entries.filter(entry => entry.kind === 'landmark').map(entry => ({
    landmark_id: entry.id, content_entry_id: entry.id, name_original: '', name_ru: entry.nameRu,
    landmark_type: entry.landmarkType, country_ids: entry.countryIds.join('|'), region: entry.regionRu ?? entry.subtitleRu,
    coordinates: entry.coordinates ? `${entry.coordinates.lat};${entry.coordinates.lon}` : '',
    significance_basis: entry.whyNotableRu, source_catalog: 'existing_content', source_ids: entry.sourceIds.join('|'),
    source_urls: sourceUrls(entry.sourceIds, sourceMap), decision: 'eligible',
    decision_reason: 'Уже опубликовано; требуется повторная проверка источников, измерений и медиа.',
    review_status: 'needs_revalidation', checked_at: entry.verifiedAt, notes: '',
  }));
  const mediaRows = media.map(asset => ({
    media_id: asset.id, content_entry_ids: library.entries.filter(entry => entry.mediaId === asset.id).map(entry => entry.id).join('|'),
    source_page_url: asset.sourcePageUrl, original_asset_url: asset.originalAssetUrl ?? '', publisher: asset.publisher,
    author: asset.author ?? '', rights_holder: '', license: asset.license, rights_url: asset.rightsUrl ?? '',
    attribution_text: asset.attributionText ?? '', checked_at: asset.checkedAt,
    decision: 'needs_revalidation', decision_reason: 'Существующий опубликованный файл; повторная проверка по единому процессу.', notes: '',
  }));

  await mkdir(outputDirectory, { recursive: true });
  const writes = [
    [files.countries, ['membership_status', 'm49', 'iso2', 'iso3', 'country_id', 'official_name_en', 'name_ru', 'region_en', 'region_ru', 'audit_status', 'checked_at', 'owner', 'roster_source_url', 'codes_source_url', 'notes'], countryRows],
    [files.flags, ['country_id', 'variant_id', 'content_entry_id', 'variant_type', 'is_primary_study_variant', 'official_status', 'graphic_elements', 'decision', 'decision_reason', 'source_ids', 'primary_source_urls', 'review_status', 'checked_at', 'notes'], flagRows],
    [files.emblems, ['country_id', 'symbol_id', 'content_entry_id', 'symbol_type', 'official_name_ru', 'elements', 'decision', 'decision_reason', 'source_ids', 'primary_source_urls', 'review_status', 'checked_at', 'notes'], emblemRows],
    [files.landmarks, ['landmark_id', 'content_entry_id', 'name_original', 'name_ru', 'landmark_type', 'country_ids', 'region', 'coordinates', 'significance_basis', 'source_catalog', 'source_ids', 'source_urls', 'decision', 'decision_reason', 'review_status', 'checked_at', 'notes'], landmarkRows],
    [files.sources, ['source_id', 'title', 'publisher', 'source_type', 'url', 'accessed_at', 'supports'], sources.map(source => ({ source_id: source.id, title: source.title, publisher: source.publisher, source_type: source.sourceType, url: source.url, accessed_at: source.accessedAt, supports: source.supports ?? 'Существующая опубликованная карточка' }))],
    [files.media, ['media_id', 'content_entry_ids', 'source_page_url', 'original_asset_url', 'publisher', 'author', 'rights_holder', 'license', 'rights_url', 'attribution_text', 'checked_at', 'decision', 'decision_reason', 'notes'], mediaRows],
  ];
  await Promise.all(writes.map(([file, headers, rows]) => writeFile(file, stringifyCsv(headers, rows), 'utf8')));
  console.log(`Создано: ${countryRows.length} стран, ${flagRows.length} флага, ${emblemRows.length} символа, ${landmarkRows.length} природных объекта, ${sources.length} источников, ${mediaRows.length} медиа.`);
}

await main();
