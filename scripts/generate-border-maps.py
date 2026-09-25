"""Build local quiz maps from Natural Earth 1:10m Admin 0 GeoJSON.

Input: pinned Natural Earth GeoJSON, cached at artifacts/borders/natural-earth-10m.geojson.
Natural Earth data is public domain: https://www.naturalearthdata.com/about/terms-of-use/
"""

import json
import hashlib
import math
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "artifacts/borders/natural-earth-10m.geojson"
OUTPUT = ROOT / "public/media/maps"
SOURCE_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_0_countries.geojson"
SOURCE_SHA256 = "239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255"

# Tight regional extents keep small states legible on a phone.
MAPS = {
    "gambia": ((-17.4, 12.9, -13.5, 14.2), "GMB", ["SEN"]),
    "lesotho": ((26.5, -31.2, 30.2, -27.8), "LSO", ["ZAF"]),
    "san-marino": ((12.32, 43.83, 12.56, 44.04), "SMR", ["ITA"]),
    "liechtenstein": ((9.28, 46.98, 9.80, 47.36), "LIE", ["AUT", "CHE"]),
    "switzerland": ((5.3, 45.4, 11.1, 48.3), "CHE", ["FRA", "DEU", "AUT", "LIE", "ITA"]),
    "germany": ((4.2, 46.7, 17.2, 56.1), "DEU", ["DNK", "POL", "CZE", "AUT", "CHE", "FRA", "LUX", "BEL", "NLD"]),
    "austria": ((8.5, 45.6, 18.0, 49.5), "AUT", ["DEU", "CZE", "SVK", "HUN", "SVN", "ITA", "CHE", "LIE"]),
    "czechia": ((11.7, 48.1, 19.0, 51.4), "CZE", ["DEU", "POL", "SVK", "AUT"]),
    "qatar": ((50.3, 24.1, 52.1, 26.6), "QAT", ["SAU"]),
    "papua-new-guinea": ((139.8, -10.9, 149.0, -1.2), "PNG", ["IDN"]),
    "haiti": ((-75.0, 17.5, -68.0, 20.5), "HTI", ["DOM"]),
    "dominican-republic": ((-75.0, 17.5, -68.0, 20.5), "DOM", ["HTI"]),
    "andorra": ((1.1, 42.2, 2.1, 42.9), "AND", ["FRA", "ESP"]),
    "mongolia": ((86.0, 40.0, 121.0, 53.0), "MNG", ["RUS", "CHN"]),
    "peru": ((-82.0, -19.0, -68.0, 1.0), "PER", ["ECU", "COL", "BRA", "BOL", "CHL"]),
    "colombia": ((-80.0, -5.0, -66.0, 14.0), "COL", ["PAN", "VEN", "BRA", "PER", "ECU"]),
}


def polygons(geometry):
    if geometry["type"] == "Polygon":
        return [geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return geometry["coordinates"]
    return []


def in_view(ring, box):
    west, south, east, north = box
    xs = [point[0] for point in ring]
    ys = [point[1] for point in ring]
    return max(xs) >= west and min(xs) <= east and max(ys) >= south and min(ys) <= north


def make_svg(features, box, target, neighbours, revealed):
    west, south, east, north = box
    width, height = 800, 600
    latitude = (north + south) / 2
    xscale = math.cos(math.radians(latitude))
    box_width = (east - west) * xscale
    box_height = north - south
    scale = min((width - 48) / box_width, (height - 48) / box_height)
    left = (width - box_width * scale) / 2
    top = (height - box_height * scale) / 2

    def point(lon, lat):
        return (left + (lon - west) * xscale * scale, top + (north - lat) * scale)

    paths = []
    for feature in features:
        iso = feature["properties"]["ISO_A3"]
        rings = [ring for polygon in polygons(feature["geometry"]) for ring in polygon if in_view(ring, box)]
        if not rings:
            continue
        commands = []
        for ring in rings:
            coords = [point(*coordinate[:2]) for coordinate in ring]
            commands.append("M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in coords) + " Z")
        fill = "#245c68" if iso == target else "#9ab4bf" if revealed and iso in neighbours else "#e7e6e1"
        paths.append(f'<path d="{" ".join(commands)}" fill="{fill}" stroke="#aab5b7" stroke-width="1.4" fill-rule="evenodd"/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img">'
            '<rect width="800" height="600" fill="#f2f6f7"/>' + "".join(paths) + '</svg>')


def main():
    if SOURCE.exists():
        raw = SOURCE.read_bytes()
    else:
        with urlopen(SOURCE_URL, timeout=60) as response:
            raw = response.read()
        SOURCE.parent.mkdir(parents=True, exist_ok=True)
        SOURCE.write_bytes(raw)
    if hashlib.sha256(raw).hexdigest() != SOURCE_SHA256:
        raise ValueError("Unexpected Natural Earth version; review the source before regenerating maps")
    features = json.loads(raw)["features"]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (box, target, neighbours) in MAPS.items():
        for state, revealed in (("question", False), ("answer", True)):
            svg = make_svg(features, box, target, neighbours, revealed)
            path = OUTPUT / f"{name}-{state}.svg"
            path.write_text(svg, encoding="utf-8")
            print(path.relative_to(ROOT), len(svg))


if __name__ == "__main__":
    main()
