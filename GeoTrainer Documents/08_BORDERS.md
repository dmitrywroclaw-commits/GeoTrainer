# Borders topic: reviewed pilot

The 95-question Markdown list is an editorial candidate pool, not publishable content. `content/research/border-question-review.csv` records the current decision for every candidate. Nineteen questions (2, 6, 8–12, 16–18, 51–52, 62–64, 71–73, 75) are published. The other questions remain deferred or excluded; none should enter the app automatically. Candidates 3 and 13 remain deferred because the available Natural Earth Monaco and Vatican geometry is unsuitable for a readable, accurate close-up. Candidates 4 and 7 are excluded: [Malaysia and Brunei still discuss land-boundary sectors](https://www.kln.gov.my/web/guest/post/joint-statement-on-the-26th-annual-leaders-consultation-between-his-majesty-sultan-haji-hassanal-bolkiah-mu-izzaddin-waddaulah-sultan-and-yang-di-pert), and [Timor-Leste records unresolved sections of its land boundary with Indonesia](https://www.gftm.gov.tl/boundaries/indonesia/land/).

## Scope and exclusion rule

- Count land borders between sovereign states. Sea borders, bridges and tunnels do not count.
- Do not publish questions if the answer, the depicted land border, or the relevant state's territory depends on an unresolved boundary or sovereignty dispute. Review the focal country, answer choices and displayed region before advancing a deferred question.
- Do not infer a quiz answer from Natural Earth geometry alone. Each published adjacency list needs an authoritative factual source.
- Recheck sources and boundary status before each content batch. The source list in the candidate Markdown mentions the CIA World Factbook, but [the CIA retired it in February 2026](https://www.cia.gov/stories/story/spotlighting-the-world-factbook-as-we-bid-a-fond-farewell/); it is not a current verification source.

## Data and quiz

`content/borders.json` stores country adjacency, short Russian explanations, source IDs, map IDs and compact question specifications. `src/data/borders.ts` validates references and answer uniqueness. Answers to count, single-neighbor, pair and non-neighbor questions come from the adjacency record. The enclave questions use the same record's `enclaveWithinId`.

The Learn catalog is `/learn/borders`; a country detail links to a focused border quiz. Border questions participate in the Borders and Mixed modes, mistakes and local progress. The stable question ID (for example `border-064`) is the progress key.

## Maps and rights

`scripts/generate-border-maps.py` produces local 4:3 SVG question/reveal pairs from a pinned [Natural Earth 1:10m Admin 0 countries](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) GeoJSON. The script verifies the input SHA-256. [Natural Earth's terms](https://www.naturalearthdata.com/about/terms-of-use/) place the data in the public domain. `content/borders.json` records its source page, pinned asset URL, author, rights URL and check date. The generated SVGs are committed; the downloaded GeoJSON is only a local generation cache.

Before an answer, only the focus country is accented and neighboring countries have no names. After an answer, neighbors are highlighted. Small states use close views. Source SVGs are local PWA media, cached when accessed. The application shows an unavailable state if an uncached map is requested offline.

The map palette uses a dark muted teal for the focus (`#245c68`), blue-gray for revealed neighbors (`#9ab4bf`), warm gray land (`#e7e6e1`) and pale blue water (`#f2f6f7`). The answer text and neighbor list carry the meaning independently of color.

Natural Earth draws de facto boundaries by default. This pilot uses regional extents without disputed land borders; any later map must be checked against the stated editorial boundary rule before publication.
On 2026-09-25, the sixteen published map extents were checked against the pinned Natural Earth 1:10m disputed-areas layer (99 features); no feature bounding box intersected them. This is a screen for the maps, not a substitute for factual review of each adjacency record.

## Next content batch

Review the deferred rows of the CSV one at a time: check current official factual sources, the status of all relevant land borders, map depiction, rights, mobile legibility, and whether any option gives away the answer. Keep disputed cases excluded. Only then add a fact or question specification, map, validation coverage and focused UI test.
