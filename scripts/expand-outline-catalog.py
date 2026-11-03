"""Create all 195 reviewed study records from the base registry and pinned map geometry.

This is an offline editorial build, never runtime factual generation.
"""
import json
import math
from outline_geometry import ROOT, sources, feature_for, target_geometry, fit_box, point_label, shifted, polygons, box, unary_union, MARINE_URL

DATE='2026-11-04'
features,marine=sources()
library=json.loads((ROOT/'content/library.json').read_text(encoding='utf-8'))
data=json.loads((ROOT/'content/geography.json').read_text(encoding='utf-8'))
cues=json.loads((ROOT/'content/research/outline-cues.json').read_text(encoding='utf-8'))
short_names=json.loads((ROOT/'content/research/outline-map-names.json').read_text(encoding='utf-8'))
countries=library['countries']
map_names={feature_for(country,features)['properties']['ADM0_A3']:short_names.get(country['id'],country['nameRu']) for country in countries}
if set(cues)!=set(country['id'] for country in countries):
    raise ValueError(f'Editorial coverage mismatch: {set(country["id"] for country in countries)-set(cues)}')
previous={card['countryId']:card for card in data['outlines']}
by_code={f['properties']['ADM0_A3']:f for f in features}
region_names={'Africa':'Африка','Americas':'Америка','Asia':'Азия','Europe':'Европа','Oceania':'Океания'}
crop={
    'france':[-6,41,10,52], 'united-kingdom':[-9,49,2.5,61],
    'norway':[3,57,32,72], 'denmark':[7,54,16,59],
    'netherlands-kingdom-of-the':[3,50,8,54], 'australia':[112,-44,155,-10],
    'new-zealand':[165,-48,180,-33], 'chile':[-76.5,-58,-66,-17],
    'mauritius':[57,-21,58,-19.5],
}
scope_overrides={
    'france':'Показаны европейская часть и Корсика. Заморские территории не показаны.',
    'united-kingdom':'Показаны Великобритания, Северная Ирландия и ближайшие острова. Заморские территории и коронные владения не выделены.',
    'norway':'Показаны материковая часть и прибрежные острова. Шпицберген, Ян-Майен и удалённые территории не показаны.',
    'denmark':'Показана Дания в Европе. Гренландия и Фарерские острова не включены в этот силуэт.',
    'netherlands-kingdom-of-the':'Показана европейская часть Нидерландов. Карибские территории не показаны.',
    'australia':'Показаны материковая Австралия, Тасмания и ближайшие острова. Удалённые внешние территории не показаны.',
    'new-zealand':'Показаны два главных острова и ближайшие острова. Удалённые островные группы не показаны.',
    'mauritius':'Показан главный остров Маврикий. Родригес и другие удалённые острова не показаны.',
    'cyprus':'Для узнавания показан остров Кипр целиком. Такое выделение не означает единого административного контроля над островом.',
    'somalia':'Показан общий контур Сомали, включая Сомалиленд. Выделение не утверждает единый фактический контроль.',
}
panels={
    'united-states': [('Основная часть',[-126,24,-66,50]),('Аляска',[-190,50,-129,72]),('Гавайи',[-161,18,-154,23])],
    'spain':[('Основная часть',[-10,35.5,4.5,44.5]),('Канарские острова',[-18.5,27,-13,30]),('Балеарские острова',[.8,38.5,4.6,40.5])],
    'portugal':[('Основная часть',[-10,36.5,-6,42.5]),('Азорские острова',[-32,36.5,-24,40]),('Мадейра',[-17.5,32,-16,33.5])],
    'ecuador':[('Материковая часть',[-82,-5.5,-75,2]),('Галапагосские острова',[-92,-2,-89,1])],
    'equatorial-guinea':[('Материковая часть',[9.2,.7,11.6,2.5]),('Биоко',[8.3,3.1,9,3.9]),('Аннобон',[5.55,-1.6,5.7,-1.3])],
    'yemen':[('Основная часть',[42,12,54,19.5]),('Сокотра',[53,12,55,13])],
}
disputed={'russia','ukraine','serbia','israel','palestine','china','india','pakistan','georgia','azerbaijan','armenia','morocco','sudan','south-sudan','cyprus','somalia'}
marine_geometries={}
cards=[]; audit=[]
for country in countries:
    country_id=country['id']; old=previous.get(country_id,{})
    feature=feature_for(country,features); code=feature['properties']['ADM0_A3']
    center=180 if country_id in {'fiji','kiribati','tuvalu','new-zealand','russia','united-states'} else 0
    codes=[code]
    if country_id=='cyprus': codes=[c for c in ['CYP','CYN','CNM','ESB','WSB'] if c in by_code]
    if country_id=='somalia': codes=['SOM','SOL']
    card=dict(id=f'outline-{country_id}',kind='outline',countryId=country_id,nameRu=country['nameRu'],iso3=country['iso3'],
        regionRu=old.get('regionRu',country['region']),continentRu=region_names.get(feature['properties']['REGION_UN'],'Океания'),
        sourceIds=list(dict.fromkeys(old.get('sourceIds',[])+['geo-natural-earth','geo-un-m49','geo-marine'])),
        status='published',verifiedAt=DATE,map=dict(featureCodes=codes,centralMeridian=center))
    # Russia's local meridian needs both European territory and the far eastern coast.
    if country_id=='russia': card['map']['centralMeridian']=100
    if country_id=='united-states': card['map']['centralMeridian']=-100
    if country_id in crop: card['map']['geometryBox']=crop[country_id]
    geometry=target_geometry(card,features)
    if geometry.is_empty: raise ValueError(f'Empty country: {country_id}')
    parts=sorted(polygons(geometry),key=lambda p:p.area,reverse=True)
    w,s,e,n=geometry.bounds; cosine=max(.18,math.cos(math.radians((n+s)/2)))
    ratio=(e-w)*cosine/max(n-s,.00001)
    shape_ru=('Вытянутый контур' if ratio<.5 or ratio>2 else 'Компактный контур')
    if parts[0].area/geometry.area<.85: shape_ru='Несколько частей'
    card['shapeRu']=old.get('shapeRu',shape_ru)
    card['similarityTags']=[card['continentRu'],shape_ru,'wide' if ratio>1.5 else 'tall' if ratio<.65 else 'balanced']
    card['summaryRu']=old.get('summaryRu',f'{country["nameRu"]}. Регион: {country["region"]}. На карте выделен изучаемый контур.')
    card['explanationRu']=cues[country_id]
    card['scopeRu']=scope_overrides.get(country_id,old.get('scopeRu','Показана территория по Natural Earth; очень мелкие острова и детали берегов обобщены.'))
    if country_id in disputed:
        card['borderNoteRu']='Границы и спорные участки следуют указанной картографической версии Natural Earth. Это учебная схема, а не карта текущего контроля или утверждение о суверенитете.'
    # Default context extent: still shows microstates as actual polygons, with a locator if needed.
    extent=fit_box(geometry,.22,.35)
    if old and country_id not in crop: extent=old['map']['box']
    card['map']['box']=extent
    panel_specs=panels.get(country_id)
    if panel_specs:
        card['map']['panels']=[dict(labelRu=label,box=extent) for label,extent in panel_specs]
        card['scopeRu']='Показаны основная часть и вынесенные на врезки участки. Север вверху; у каждой врезки свой масштаб.'
        if country_id=='spain': card['scopeRu']+=' Сеута, Мелилья и очень мелкие участки не вынесены на отдельные врезки.'
    # Scattered tiny archipelagos: overview plus three real enlarged fragments, never inflated land.
    if country_id in {'kiribati','micronesia','marshall-islands','tuvalu','seychelles','maldives','palau','tonga'}:
        selected=[]
        for polygon in parts:
            point=polygon.representative_point()
            if all(point.distance(other.representative_point())>.3 for other in selected): selected.append(polygon)
            if len(selected)==3: break
        if len(selected)==3:
            card['map']['panels']=[dict(labelRu='Общий вид',box=extent)]+[dict(labelRu=f'Увеличенный фрагмент {i+1}',box=fit_box(part,.3,.02)) for i,part in enumerate(selected)]
            card['scopeRu']='Показаны общий рисунок архипелага и увеличенные фрагменты. Острова не увеличены условно; у каждой врезки свой масштаб. Очень мелкие острова обобщены.'
    # Fit labels once, store them in the reviewed record for the renderer and audit.
    labels=[]
    for panel_index,panel in enumerate(card['map'].get('panels',[dict(box=extent)])):
        panel_labels=[]
        bounds=box(*panel['box']); clipped=geometry.intersection(bounds)
        if not clipped.is_empty: panel_labels.append(dict(point_label(clipped,short_names.get(country_id,country['nameRu'])),target=True))
        neighbours=[]; land_parts=[clipped] if not clipped.is_empty else []
        for other in features:
            if other['properties']['ADM0_A3'] in codes: continue
            other_geometry=shifted(other,card['map']['centralMeridian'])
            visible=other_geometry.intersection(bounds)
            if visible.is_empty: continue
            land_parts.append(visible)
            if visible.area<bounds.area*.012: continue
            title=map_names.get(other['properties']['ADM0_A3'],other['properties'].get('NAME_RU') or other['properties']['NAME'])
            neighbours.append((visible.area,point_label(visible,title)))
        panel_labels.extend(label for _,label in sorted(neighbours,key=lambda item:item[0],reverse=True)[:7])
        water=[]; land=unary_union(land_parts)
        for index,sea in enumerate(marine):
            key=(index,card['map']['centralMeridian'])
            if key not in marine_geometries: marine_geometries[key]=shifted(sea,card['map']['centralMeridian'])
            visible=marine_geometries[key].intersection(bounds)
            if visible.is_empty: continue
            visible=visible.difference(land)
            if visible.area<bounds.area*.035: continue
            title=sea['properties'].get('name_ru') or sea['properties']['name']
            # A specific sea wins over an enclosing ocean, but include a visible ocean as fallback.
            priority=1 if sea['properties']['featurecla']=='ocean' else 0
            water.append((priority,-visible.area,point_label(visible,title,True)))
        panel_labels.extend(label for _,_,label in sorted(water,key=lambda item:(item[0],item[1]))[:3])
        labels.extend(dict(label,panelIndex=panel_index) for label in panel_labels)
    # Deduplicate labels shared by overlapping panels; each is geographically anchored.
    card['map']['labels']=list({(label['text'],label['lon'],label['lat'],label['panelIndex']):label for label in labels}.values())
    cards.append(card)
    audit.append(dict(countryId=country_id,iso3=country['iso3'],featureCodes=codes,panels=len(card['map'].get('panels',[])) or 1,
        parts=len(parts),geometryArea=round(geometry.area,8),shapeAspect=round(ratio,4),status='reviewed',sourceCommit='ca96624a56bd078437bca8184e78163e5039ad19'))
cards.sort(key=lambda card: card['nameRu'])
data['outlines']=cards
for source in [
    dict(id='geo-un-m49',title='Standard country or area codes for statistical use (M49)',publisher='United Nations Statistics Division',url='https://unstats.un.org/unsd/methodology/m49/overview/',accessedAt=DATE),
    dict(id='geo-marine',title='Natural Earth 1:10m Physical Vectors — Marine Areas',publisher='Natural Earth',url='https://www.naturalearthdata.com/downloads/10m-physical-vectors/',accessedAt=DATE),
]:
    data['sources']=[s for s in data['sources'] if s['id']!=source['id']]+[source]
data['marineSource']=dict(data['mapSource'],title='Natural Earth 1:10m Marine Areas',sourcePageUrl='https://www.naturalearthdata.com/downloads/10m-physical-vectors/',originalAssetUrl=MARINE_URL)
(ROOT/'content/geography.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'content/research/outline-coverage.json').write_text(json.dumps(dict(countryCount=len(cards),records=audit),ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Prepared {len(cards)} countries; {sum(item["panels"]>1 for item in audit)} with insets')
