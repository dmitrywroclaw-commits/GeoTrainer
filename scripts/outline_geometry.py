"""Pinned cartographic sources and build-only geometry helpers (Shapely 2.1.2)."""
import hashlib
import json
import math
import sys
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT/'artifacts/geography-tools'))
try:
    from shapely.geometry import shape, Polygon, MultiPolygon, GeometryCollection, box, Point
    from shapely.ops import transform, unary_union
    from shapely import make_valid
except ImportError as error:
    raise SystemExit('Install build tools: python -m pip install --target artifacts/geography-tools shapely==2.1.2') from error

COMMIT = 'ca96624a56bd078437bca8184e78163e5039ad19'
SOURCE_URL = f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{COMMIT}/geojson/ne_10m_admin_0_countries.geojson'
MARINE_URL = f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{COMMIT}/geojson/ne_10m_geography_marine_polys.geojson'
SOURCE_SHA = '239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255'
MARINE_SHA = '53f865e8ffa966cdd402145c82c5cd14ee7ce974cd0eb9a3f59f03a4cfd2d66c'

def read_source(path, url, checksum):
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(urlopen(url, timeout=60).read())
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != checksum:
        raise ValueError(f'Unreviewed source version: {path}')
    return json.loads(raw)['features']

def sources():
    return (read_source(ROOT/'artifacts/borders/natural-earth-10m.geojson', SOURCE_URL, SOURCE_SHA),
            read_source(ROOT/'artifacts/geography-pilot/marine.geojson', MARINE_URL, MARINE_SHA))

def polygons(geometry):
    if isinstance(geometry, Polygon): return [geometry]
    if isinstance(geometry, (MultiPolygon, GeometryCollection)):
        return [polygon for part in geometry.geoms for polygon in polygons(part)]
    return []

def shift_lon(lon, center):
    return (lon-center+180) % 360 - 180 + center

_shifted_cache={}
def shifted(feature, center=0):
    """Shift each ring together: splitting a dateline polygon vertex-by-vertex creates streaks."""
    key=(feature['properties'].get('NE_ID',feature['properties'].get('ne_id')),center)
    if key in _shifted_cache: return _shifted_cache[key]
    result=[]
    for polygon in polygons(make_valid(shape(feature['geometry']))):
        coords=list(polygon.exterior.coords)
        # Natural Earth polygons are already split at +/-180. Keep each ring continuous.
        midpoint=(min(p[0] for p in coords)+max(p[0] for p in coords))/2
        offset=shift_lon(midpoint,center)-midpoint
        result.append(transform(lambda x,y:(x+offset,y),polygon))
    _shifted_cache[key]=unary_union(result)
    return _shifted_cache[key]

def feature_for(country, features):
    for field in ['ISO_A3','ADM0_A3','ISO_A3_EH']:
        matches=[f for f in features if country['iso3']==f['properties'][field]]
        if len(matches)==1: return matches[0]
    raise ValueError(f'Ambiguous feature: {country["id"]}')

def target_geometry(card, features):
    chosen=[f for f in features if f['properties']['ADM0_A3'] in card['map']['featureCodes']]
    center=card['map'].get('centralMeridian',0)
    geometry=unary_union([shifted(f,center) for f in chosen])
    crop=card['map'].get('geometryBox')
    if crop: geometry=geometry.intersection(box(*crop))
    return geometry

def fit_box(geometry, padding=.15, minimum=.015):
    w,s,e,n=geometry.bounds
    cosine=max(.18,math.cos(math.radians((s+n)/2)))
    dx=max(e-w,minimum/cosine); dy=max(n-s,minimum)
    return [round(w-dx*padding,6),max(-89.9,round(s-dy*padding,6)),round(e+dx*padding,6),min(89.9,round(n+dy*padding,6))]

def point_label(geometry, title, water=False):
    point=geometry.representative_point()
    return dict(text=title,lon=round(point.x,6),lat=round(point.y,6),water=water)
