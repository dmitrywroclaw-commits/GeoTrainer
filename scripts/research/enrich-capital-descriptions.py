"""Apply individually reviewed city descriptions to cards without changing media or quiz IDs."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESEARCH = ROOT / "content/research"
GETTY = {item["index"]: item for item in json.loads((RESEARCH / "capital-getty-research.json").read_text(encoding="utf-8"))}
EXTRA = json.loads((RESEARCH / "capital-description-sources.json").read_text(encoding="utf-8"))
CONTENT = ROOT / "content/capitals.json"


def main():
    content = json.loads(CONTENT.read_text(encoding="utf-8"))
    descriptions = {}
    with (RESEARCH / "capital-description-copy.tsv").open(encoding="utf-8", newline="") as source:
        for index_text, description, source_key in csv.reader(source, delimiter="\t"):
            if index_text.startswith("#"):
                continue
            index = int(index_text)
            if index in descriptions:
                raise ValueError(f"Duplicate capital description: {index}")
            if len(description.strip()) < 50 or "Связка для запоминания" in description:
                raise ValueError(f"Weak capital description: {index}")
            descriptions[index] = (description.strip(), source_key.strip())
    expected = set(range(len(content["entries"])))
    if set(descriptions) != expected:
        raise ValueError(f"Missing descriptions: {sorted(expected - set(descriptions))}; extra: {sorted(set(descriptions) - expected)}")
    sources = {source["id"]: source for source in content["sources"]}
    for index, entry in enumerate(content["entries"]):
        description, source_keys = descriptions[index]
        entry["explanationRu"] = description
        for source_key in source_keys.split(","):
            if source_key == "getty":
                item = GETTY[index]
                if not item.get("tgnId") or not (item.get("note") or item.get("placeTypes")):
                    raise ValueError(f"No Getty city record for {index}")
                source = {"id": f"capital-source-getty-{item['tgnId']}",
                          "title": f"Getty Thesaurus of Geographic Names: {entry['cityNameEn']}", "publisher": "Getty Research Institute",
                          "url": item["recordUrl"], "checkedAt": "2026-09-26"}
            elif source_key.startswith("getty:"):
                tgn_id = source_key.removeprefix("getty:")
                if not tgn_id.isdigit():
                    raise ValueError(f"Invalid Getty ID for {index}")
                source = {"id": f"capital-source-getty-{tgn_id}",
                          "title": f"Getty Thesaurus of Geographic Names: {entry['cityNameEn']}",
                          "publisher": "Getty Research Institute",
                          "url": f"https://www.getty.edu/vow/TGNFullDisplay?english=Y&find=&nation=&place=&subjectid={tgn_id}",
                          "checkedAt": "2026-09-26"}
            elif source_key in EXTRA:
                title, publisher, url = EXTRA[source_key]
                source = {"id": "capital-source-description-" + source_key, "title": title,
                          "publisher": publisher, "url": url, "checkedAt": "2026-09-26"}
            else:
                raise ValueError(f"Unknown description source {source_key} for {index}")
            sources[source["id"]] = source
            if source["id"] not in entry["sourceIds"]:
                entry["sourceIds"].append(source["id"])
    content["sources"] = [sources[key] for key in sorted(sources)]
    CONTENT.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("updated", len(descriptions), "cards with city descriptions")


if __name__ == "__main__":
    main()
