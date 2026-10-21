"""Collect unreviewed coat-of-arms image candidates for the 195-state roster.

Wikidata P94 and Commons metadata are discovery aids. This script never publishes
an entry or downloads an image; a human must verify symbol version and rights.
"""

import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ROSTER = ROOT / "content/research/countries.csv"
OUTPUT = ROOT / "content/research/emblem-image-candidates.json"
SPARQL = "SELECT ?iso2 ?coat WHERE { ?country wdt:P297 ?iso2; wdt:P94 ?coat. }"
WIKIDATA_URL = "https://query.wikidata.org/sparql?format=json&query=" + urllib.parse.quote(SPARQL)
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "GeoTrainerResearch/0.1 (educational content audit)"
MANUAL_ALTERNATIVES = {
    # Türkiye has no Wikidata P94 value. The presidency has an official emblem,
    # but that does not make it a national coat of arms.
    "turkiye": {
        "fileName": "Emblem of the Presidency of Turkey.svg",
        "symbolScope": "presidential_emblem_candidate",
        "officialDescriptionUrl": "https://www.tccb.gov.tr/cumhurbaskanligi/resmi-simgeler/arma/",
    },
}


def request_json(url):
    for attempt in range(5):
        try:
            request = urllib.request.Request(url, headers={
                "User-Agent": USER_AGENT,
                "Accept": "application/json",
            })
            with urllib.request.urlopen(request, timeout=90) as response:
                return json.load(response)
        except Exception:
            if attempt == 4:
                raise
            time.sleep(3 * (attempt + 1))


def chunks(items, size):
    for start in range(0, len(items), size):
        yield items[start:start + size]


def main():
    with ROSTER.open(encoding="utf-8-sig", newline="") as file:
        countries = list(csv.DictReader(file))
    by_iso2 = {country["iso2"]: country for country in countries}
    if len(countries) != 195 or len(by_iso2) != 195:
        raise ValueError("Expected 195 unique ISO2 codes in countries.csv")

    wikidata = request_json(WIKIDATA_URL)
    names_by_country = {country["country_id"]: [] for country in countries}
    for binding in wikidata["results"]["bindings"]:
        country = by_iso2.get(binding["iso2"]["value"])
        if not country:
            continue
        file_name = urllib.parse.unquote(binding["coat"]["value"].rsplit("/", 1)[-1])
        if file_name not in names_by_country[country["country_id"]]:
            names_by_country[country["country_id"]].append(file_name)
    for country_id, alternative in MANUAL_ALTERNATIVES.items():
        names_by_country[country_id].append(alternative["fileName"])

    file_names = sorted({name for names in names_by_country.values() for name in names})
    metadata = {}
    for group in chunks(file_names, 35):
        titles = "|".join("File:" + name for name in group)
        params = urllib.parse.urlencode({
            "action": "query", "format": "json", "prop": "imageinfo",
            "iiprop": "url|sha1|mime|size|extmetadata", "iilimit": "1",
            "titles": titles,
        })
        result = request_json(COMMONS_API + "?" + params)
        aliases = {}
        for key in ("normalized", "redirects"):
            for item in result.get("query", {}).get(key, []):
                aliases[item["from"].removeprefix("File:")] = item["to"].removeprefix("File:")
        for page in result["query"]["pages"].values():
            info = (page.get("imageinfo") or [{}])[0]
            ext = info.get("extmetadata", {})
            name = page["title"].removeprefix("File:")
            metadata[name] = {
                "filePageUrl": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(name.replace(" ", "_")),
                "originalAssetUrl": info.get("url"),
                "mime": info.get("mime"),
                "bytes": info.get("size"),
                "sha1": info.get("sha1"),
                "artistHtml": ext.get("Artist", {}).get("value"),
                "license": ext.get("LicenseShortName", {}).get("value"),
                "licenseUrl": ext.get("LicenseUrl", {}).get("value"),
                "creditHtml": ext.get("Credit", {}).get("value"),
            }
        for alias, canonical in aliases.items():
            if canonical in metadata:
                metadata[alias] = metadata[canonical]
        time.sleep(2)

    records = []
    for country in countries:
        names = names_by_country[country["country_id"]]
        records.append({
            "countryId": country["country_id"],
            "nameRu": country["name_ru"],
            "iso2": country["iso2"],
            "status": "unreviewed",
            "candidates": [
                {
                    "fileName": name,
                    "symbolScope": MANUAL_ALTERNATIVES[country["country_id"]]["symbolScope"]
                    if country["country_id"] in MANUAL_ALTERNATIVES else "coat_of_arms_candidate",
                    **({"officialDescriptionUrl": MANUAL_ALTERNATIVES[country["country_id"]]["officialDescriptionUrl"]}
                       if country["country_id"] in MANUAL_ALTERNATIVES else {}),
                    **metadata.get(name, {}),
                }
                for name in names
            ],
        })
    output = {
        "checkedAt": "2026-10-21",
        "purpose": "Image candidates only; verify current official design, copyright in the design, license of the specific file, and required attribution before publication.",
        "sourceQueryUrl": WIKIDATA_URL,
        "countries": records,
    }
    OUTPUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    covered = sum(bool(record["candidates"]) for record in records)
    with_metadata = sum(bool(candidate.get("originalAssetUrl")) for record in records for candidate in record["candidates"])
    print(f"Candidate image found for {covered}/195 countries; Commons metadata for {with_metadata}/{sum(len(record['candidates']) for record in records)} files.")
    print("Missing:", ", ".join(record["countryId"] for record in records if not record["candidates"]))


if __name__ == "__main__":
    main()
