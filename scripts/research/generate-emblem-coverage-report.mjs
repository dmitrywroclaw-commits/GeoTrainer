import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './csv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const research = path.join(root, 'content/research');
const [countryText, emblemText, libraryText] = await Promise.all([
  readFile(path.join(research, 'countries.csv'), 'utf8'),
  readFile(path.join(research, 'emblems.csv'), 'utf8'),
  readFile(path.join(root, 'content/library.json'), 'utf8'),
]);
const countries = parseCsv(countryText);
const emblems = parseCsv(emblemText);
const library = JSON.parse(libraryText);
const publishedCountries = new Set(library.entries
  .filter(entry => entry.kind === 'emblem' && entry.status === 'published')
  .map(entry => entry.countryId));

const rows = countries.map(country => {
  const symbols = emblems.filter(emblem => emblem.country_id === country.country_id);
  const eligible = symbols.filter(emblem => emblem.decision === 'eligible');
  let state = 'research_needed';
  if (publishedCountries.has(country.country_id)) state = 'published';
  else if (eligible.length) state = 'eligible_unpublished';
  else if (symbols.some(emblem => emblem.decision === 'deferred')) state = 'deferred';
  else if (symbols.length && symbols.every(emblem => emblem.decision === 'excluded')) state = 'excluded';
  return { countryId: country.country_id, nameRu: country.name_ru, state,
    symbolIds: symbols.map(emblem => emblem.symbol_id) };
});
const counts = Object.fromEntries(['published', 'eligible_unpublished', 'deferred', 'excluded', 'research_needed']
  .map(state => [state, rows.filter(row => row.state === state).length]));
const report = { totalCountries: countries.length, counts, countries: rows };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
