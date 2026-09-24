"""Build research and publication batch files from verified flag notes.

Usage: python scripts/research/create-flag-batch.py notes.json
The notes file is an editorial input; the generated batch files are reviewed before use.
"""

import csv
import json
import sys
from pathlib import Path


root = Path(__file__).resolve().parents[2]
notes = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
date = notes['checkedAt']
roster = {
    row['country_id']: row
    for row in csv.DictReader((root / 'content/research/countries.csv').open(encoding='utf-8-sig', newline=''))
}
library = json.loads((root / 'content/library.json').read_text(encoding='utf-8'))
existing_countries = {country['id'] for country in library['countries']}
existing_entries = {entry['id'] for entry in library['entries']}
research = {'batch_id': notes['researchBatchId'], 'checked_at': date, 'owner': 'Codex', 'sources': [], 'countries': []}
publish = {'batch_id': notes['publishBatchId'], 'countries': [], 'sources': [], 'media': [], 'entries': []}

for row in notes['flags']:
    country_id = row['countryId']
    variant = row['variantType']
    entry_id = f'{country_id}-{variant}-flag'
    if entry_id in existing_entries:
        raise ValueError(f'Already published: {entry_id}')
    source = row['source']
    media = row['media']
    source_id = source['id']
    media_id = f'flag-{country_id}-{variant}'

    research['sources'].append({
        'source_id': source_id, 'title': source['title'], 'publisher': source['publisher'],
        'source_type': source['type'], 'url': source['url'], 'accessed_at': date,
        'supports': f'Официальное описание флага: {row["nameRu"]}',
    })
    research['countries'].append({
        'country_id': country_id, 'audit_status': 'in_progress',
        'notes': 'Флаг проверен и опубликован; герб или эмблема ещё в работе.',
        'flags': [{
            'variant_id': entry_id, 'variant_type': variant, 'is_primary_study_variant': 'true',
            'official_status': 'official', 'graphic_elements': row['elements'],
            'decision': 'eligible',
            'decision_reason': 'Выбран официальный национальный или государственный флаг с наиболее подробным рисунком.',
            'source_ids': source_id, 'primary_source_urls': source['url'],
        }],
        'emblems': [],
    })
    if country_id not in existing_countries:
        country = roster[country_id]
        publish['countries'].append({
            'id': country_id, 'nameRu': row['nameRu'], 'region': country['region_ru'],
            'm49': country['m49'], 'iso2': country['iso2'], 'iso3': country['iso3'],
        })
    publish['sources'].append({
        'id': source_id, 'title': source['title'], 'publisher': source['publisher'],
        'sourceType': source['type'], 'url': source['url'], 'accessedAt': date,
    })

    page = f"https://commons.wikimedia.org/wiki/File:{media['fileName']}"
    attribution = media.get('attributionText') or (
        f"{media['author']} / Wikimedia Commons; {media['license']}; "
        'исходный SVG без изменений; ограничения для государственной символики.'
    )
    publish['media'].append({
        'id': media_id, 'kind': 'flag', 'localPath': media['localPath'],
        'sourcePageUrl': page, 'originalAssetUrl': media['assetUrl'],
        'publisher': 'Wikimedia Commons', 'author': media['author'],
        'license': media['license'], 'rightsUrl': page,
        'attributionText': attribution, 'checkedAt': date,
    })
    publish['entries'].append({
        'id': entry_id, 'kind': 'flag', 'countryId': country_id,
        'nameRu': row['nameRu'], 'subtitleRu': row['subtitleRu'],
        'variantType': variant, 'isPrimaryStudyVariant': True, 'mediaId': media_id,
        'summaryRu': row['summaryRu'], 'explanationRu': row['explanationRu'],
        'symbols': [],
        'facts': [{'labelRu': label, 'valueRu': value} for label, value in row['facts']],
        'sourceIds': [source_id], 'quizHints': {'similarityTags': row['tags']},
        'status': 'published', 'verifiedAt': date,
    })

batch_dir = root / 'content/research/batches'
for batch in (research, publish):
    destination = batch_dir / f'{batch["batch_id"]}.json'
    if destination.exists():
        raise FileExistsError(destination)
    destination.write_text(json.dumps(batch, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(destination.relative_to(root))
