"""Generate north-up outlines/context maps and original waterway diagrams from reviewed JSON.

Natural Earth source is pinned by generate-border-maps.py; no other maps are modified.
"""
import json
import math
from html import escape
from outline_geometry import ROOT, sources, target_geometry, shifted, polygons, fit_box, box, transform

features,_ = sources()
data = json.loads((ROOT/'content/geography.json').read_text(encoding='utf-8'))
OUT = ROOT/'public/media/geography'
OUT.mkdir(parents=True, exist_ok=True)

def svg(body):
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">' + body + '</svg>'

def text(x,y,value,size=25,color='#234b51',anchor='middle'):
    return f'<text x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}" font-family="Arial,sans-serif" font-size="{size}" font-weight="600" fill="{color}" stroke="#f4f8f7" stroke-width="5" paint-order="stroke">{escape(value)}</text>'

def path_svg(geometry,color,stroke,project):
    commands=[]
    screen=transform(project,geometry).simplify(.55,preserve_topology=True)
    for polygon in polygons(screen):
        for ring in [polygon.exterior,*polygon.interiors]:
            commands.append('M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in ring.coords)+' Z')
    return f'<path d="{" ".join(commands)}" fill="{color}" stroke="{stroke}" stroke-width="1.1" fill-rule="evenodd"/>' if commands else ''

def wrap_label(value,limit=18):
    result=[]; line=''
    for word in value.split():
        if line and len(line+' '+word)>limit: result.append(line); line=word
        else: line=(line+' '+word).strip()
    result.append(line)
    return result

def map_svg(card, revealed):
    target=target_geometry(card,features)
    panels=card['map'].get('panels',[dict(box=card['map']['box'],labelRu='')])
    if len(panels)==1: slots=[(0,0,800,600)]
    elif len(panels)==2: slots=[(4,4,392,592),(404,4,392,592)]
    elif len(panels)==3: slots=[(4,4,504,592),(516,4,280,292),(516,304,280,292)]
    else: slots=[(4+(index%2)*400,4+(index//2)*300,392,292) for index in range(len(panels))]
    body='<rect width="800" height="600" fill="#edf5f5"/>'
    metrics=[]
    for index,(panel,slot) in enumerate(zip(panels,slots)):
        sx,sy,width,height=slot
        bounds=panel['box']
        visible_target=target.intersection(box(*bounds))
        if visible_target.is_empty: raise ValueError(f'Empty inset: {card["id"]} {index}')
        if not revealed and len(panels)==1: bounds=fit_box(visible_target,.075)
        w,s,e,n=bounds
        cosine=max(.18,math.cos(math.radians((s+n)/2)))
        scale=min((width-64)/((e-w)*cosine),(height-76)/(n-s))
        left=sx+(width-(e-w)*cosine*scale)/2
        top=sy+(height-(n-s)*scale)/2+6
        def point(lon,lat): return left+(lon-w)*cosine*scale,top+(n-lat)*scale
        clip=f'panel-{index}'
        body+=f'<defs><clipPath id="{clip}"><rect x="{sx}" y="{sy}" width="{width}" height="{height}" rx="10"/></clipPath></defs>'
        body+=f'<g clip-path="url(#{clip})">'
        viewport=box(w,s,e,n)
        if revealed:
            for f in features:
                if f['properties']['ADM0_A3'] in card['map']['featureCodes']: continue
                geometry=shifted(f,card['map']['centralMeridian'])
                if geometry.intersects(viewport): body+=path_svg(geometry.intersection(viewport),'#dce6df','#a7bfbb',point)
        clipped=target.intersection(viewport)
        body+=path_svg(clipped,'#176570','#176570',point)
        # Hollow locators indicate subpixel islands; the actual land polygon is never enlarged.
        if clipped.area/viewport.area<.015:
            parts=polygons(clipped)
            largest=max(part.area for part in parts)
            for part in parts:
                if part.area<largest*.015: continue
                if part.area*scale*scale*cosine<10:
                    p=part.representative_point(); x,y=point(p.x,p.y)
                    body+=f'<circle cx="{x:.1f}" cy="{y:.1f}" r="5" fill="none" stroke="#176570" stroke-width="1"/>'
        occupied=[(sx+width-49,sy+6,sx+width,sy+91)]
        if revealed:
            labels=[label for label in card['map']['labels'] if label['panelIndex']==index and w<=label['lon']<=e and s<=label['lat']<=n]
            labels.sort(key=lambda label:(not label.get('target'),label['water']))
            for label in labels:
                ax,ay=point(label['lon'],label['lat'])
                lines=wrap_label(label['text'],18 if width>400 else 14)
                size=22 if width>400 else 17
                tw=max(len(line) for line in lines)*size*.57+8; th=len(lines)*(size+3)+4
                offsets=[(0,0),(0,-32),(0,32),(-40,0),(40,0),(0,-64),(0,64)]
                if label.get('target') and clipped.area*scale*scale*cosine<500: offsets=offsets[1:]
                for ox,oy in offsets:
                    x=max(sx+tw/2+7,min(sx+width-tw/2-7,ax+ox)); y=ay+oy
                    rectangle=(x-tw/2,y-size-3,x+tw/2,y-size+th)
                    if rectangle[1]<sy+24 or rectangle[3]>sy+height-9: continue
                    if any(rectangle[0]<b[2]+4 and rectangle[2]>b[0]-4 and rectangle[1]<b[3]+4 and rectangle[3]>b[1]-4 for b in occupied): continue
                    occupied.append(rectangle)
                    if abs(x-ax)>12 or abs(y-ay)>12: body+=f'<path d="M{ax:.1f},{ay:.1f}L{x:.1f},{y:.1f}" stroke="#6e8e90" stroke-width=".8"/>'
                    for line_index,line in enumerate(lines): body+=text(x,y+line_index*(size+3),line,size,'#326b80' if label['water'] else '#223c40')
                    break
        body+='</g>'
        if len(panels)>1:
            body+=f'<rect x="{sx}" y="{sy}" width="{width}" height="{height}" rx="10" fill="none" stroke="#c1d4d2"/>'
            if revealed: body+=text(sx+12,sy+22,panel['labelRu'],17,anchor='start')
        nx,ny=sx+width-27,sy+30
        body+=f'<path d="M{nx} {ny+26}V{ny}m0 0-6 10m6-10 6 10" stroke="#234b51" fill="none" stroke-width="2"/>'+text(nx,ny+45,'С',15)
        metrics.append(dict(panel=index,landAreaPixels=round(clipped.area*scale*scale*cosine,2)))
    return svg(body),metrics

audit=[]
for card in data['outlines']:
    for revealed,state in [(False,'question'),(True,'answer')]:
        output,metrics=map_svg(card,revealed)
        (OUT/f'{card["id"]}-{state}.svg').write_text(output,encoding='utf-8')
        audit.append(dict(id=card['id'],state=state,bytes=len(output.encode()),panels=metrics))
# Waterway geometry now has its own generator; do not overwrite those maps with diagrams.
(ROOT/'content/research/outline-map-audit.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(data["outlines"])*2} outline maps; run generate-waterway-maps.py for waterways')
