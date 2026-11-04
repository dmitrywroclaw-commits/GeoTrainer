"""Build only the waterway maps; reuse pinned, checksum-verified Natural Earth geometry."""
import json
import math
from html import escape
from outline_geometry import ROOT, sources, shifted, polygons, box, transform

features, _ = sources()
data=json.loads((ROOT/'content/geography.json').read_text(encoding='utf-8'))
out=ROOT/'public/media/geography'
out.mkdir(parents=True, exist_ok=True)

def path(geometry, project, fill, stroke='#8da6a0', width=1):
    screen=transform(project,geometry).simplify(.4,preserve_topology=True)
    parts=[]
    for polygon in polygons(screen):
        for ring in [polygon.exterior,*polygon.interiors]:
            parts.append('M'+'L'.join(f'{x:.2f},{y:.2f}' for x,y in ring.coords)+'Z')
    return f'<path d="{" ".join(parts)}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" fill-rule="evenodd"/>' if parts else ''

def label(x,y,value,water=False):
    # Deliberately wrap long water names so their labels remain readable on phones.
    words=value.split(); lines=[]; line=''
    for word in words:
        if line and len(line+' '+word)>18: lines.append(line); line=word
        else: line=(line+' '+word).strip()
    lines.append(line)
    size=26
    half=max(len(v) for v in lines)*size*.285+8
    x=max(half+8,min(792-half,x))
    y=max(42,min(548-(len(lines)-1)*31,y))
    return ''.join(f'<text x="{x:.1f}" y="{y+i*31:.1f}" text-anchor="middle" font-family="Arial,sans-serif" font-size="{size}" font-weight="600" fill="{"#235e80" if water else "#263e36"}" stroke="#f5faf8" stroke-width="6" paint-order="stroke">{escape(v)}</text>' for i,v in enumerate(lines))

def render(card):
    w,s,e,n=card['map']['box']; center=(w+e)/2
    cosine=max(.2,math.cos(math.radians((s+n)/2)))
    scale=min(752/((e-w)*cosine),500/(n-s))
    left=(800-(e-w)*cosine*scale)/2
    top=38+(500-(n-s)*scale)/2
    def project(lon,lat): return left+(lon-w)*cosine*scale,top+(n-lat)*scale
    # Extend the viewport to the entire frame instead of cutting floating rectangles
    # out of the land. Preserve the true geographic proportions and north-up view.
    vw=w-left/(cosine*scale); ve=vw+800/(cosine*scale)
    vn=n+top/scale; vs=vn-564/scale
    viewport=box(vw,vs,ve,vn)
    body='<rect width="800" height="600" fill="#dceff5"/>'
    for f in features:
        fw,fs,fe,fn=f['bbox']
        # Reject distant countries before expensive high-resolution geometry transforms.
        if fn<vs or fs>vn or not any(fw+offset<=ve and fe+offset>=vw for offset in [-360,0,360]): continue
        geometry=shifted(f,center)
        if geometry.intersects(viewport): body+=path(geometry.intersection(viewport),project,'#e3e7d4')
    points=[project(*point) for point in card['map']['trace']]
    route='M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in points)
    body+=f'<path d="{route}" fill="none" stroke="white" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/><path d="{route}" fill="none" stroke="#a83923" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>'
    for x,y in (points[0],points[-1]):
        body+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="8" fill="#a83923" stroke="white" stroke-width="3"/>'
    for item in card['map']['labels']:
        body+=label(*project(item['lon'],item['lat']),item['text'],item['water'])
    body+='<rect x="0" y="564" width="800" height="36" fill="#f5faf8"/>'
    body+='<path d="M18 582H61" stroke="#a83923" stroke-width="7" stroke-linecap="round"/>'
    body+='<text x="74" y="589" font-family="Arial,sans-serif" font-size="20" fill="#293f3a">Водный проход · учебный локатор</text>'
    body+='<rect x="726" y="10" width="60" height="89" rx="12" fill="#f5faf8" fill-opacity=".9"/><path d="M756 86V46m-7 12 7-12 7 12" fill="none" stroke="#263e36" stroke-width="3"/><text x="756" y="35" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#263e36">С</text>'
    # This map is always explanatory. Quiz labels are only revealed after answering.
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><title>{escape(card["nameRu"])}: расположение и берега</title>{body}</svg>'

for card in data['waterways']:
    (out/f'{card["id"]}-diagram.svg').write_text(render(card),encoding='utf-8')
print(f'Generated {len(data["waterways"])} waterway maps')
