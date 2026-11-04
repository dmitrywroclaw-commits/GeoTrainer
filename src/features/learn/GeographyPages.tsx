import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { geographyRepository, type GeographyKind, type Waterway } from '../../data/geography';
import { MediaFrame } from '../../components/MediaFrame';
import { CardNavigation } from '../../components/CardNavigation';
import { EmptyState, PageHeader } from '../../components/Shared';

export const geographyTopics = {
  outline: { title: 'Страны на карте', path: 'outlines', description: 'Узнавайте страны по силуэту и связывайте их с соседями и морями.' },
  waterway: { title: 'Проливы и каналы', path: 'waterways', description: '20 знаменитых проливов на картах и два искусственных канала для сравнения.' },
};

function WaterwayConnections({ card }: { card: Waterway }) {
  return <div className="water-connections" aria-label="Связи водного пути">
    <span className="eyebrow">Вода · соединяет</span><div className="water-connection-row"><strong>{card.connectsRu[0]}</strong><span aria-hidden="true">↔</span><strong>{card.connectsRu[1]}</strong></div>
    <div className="water-passage">{card.nameRu}</div>
    {card.banksRu.length > 0 && <><span className="eyebrow">Суша · разделяет</span><div className="water-connection-row water-banks"><strong>{card.banksRu[0]}</strong><span aria-hidden="true">│</span><strong>{card.banksRu[1]}</strong></div></>}
    <p>Схема показывает отношения. Географическое положение и очертания берегов смотрите на карте.</p>
  </div>;
}

export function GeographyCatalogPage({ kind }: { kind: GeographyKind }) {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [waterwayType, setWaterwayType] = useState('strait');
  const [visibleCount, setVisibleCount] = useState(24);
  const topic = geographyTopics[kind];
  const all = geographyRepository.byKind(kind);
  const regions = [...new Set(all.flatMap(card => card.kind === 'outline' ? [card.continentRu] : []))].sort((a,b) => a.localeCompare(b,'ru'));
  const cards = all.filter(card => (region === 'all' || card.kind === 'outline' && card.continentRu === region) && (card.kind !== 'waterway' || waterwayType === 'all' || card.waterwayType === waterwayType) && `${card.nameRu} ${card.regionRu} ${card.explanationRu} ${card.kind === 'waterway' ? card.distinctionRu : ''}`.toLocaleLowerCase('ru').replaceAll('ё','е').includes(search.trim().toLocaleLowerCase('ru').replaceAll('ё','е')));
  return <>
    <PageHeader title={topic.title} description={topic.description} back={{ to: '/learn', label: 'Изучать' }}/>
    <div className="geography-intro"><span className="eyebrow">{kind === 'outline' ? `Карточек: ${all.length}` : '20 проливов · 2 канала'}</span><p>{kind === 'outline' ? 'Сначала запомните форму, затем посмотрите, где находится страна. Север на всех картах вверху.' : 'Самые известные морские ворота, широкие и протяжённые проходы, необычные течения. У каждого объекта указан критерий отбора. На картах выделен проход между настоящими берегами; север вверху.'}</p><Link className="button primary-button" to={`/quiz/session?mode=${kind}&count=5`}>Тренировать тему</Link></div>
    {kind === 'waterway' && <div className="chip-row waterway-filters" aria-label="Тип водного пути">{[['strait','Проливы · 20'],['canal','Каналы · 2'],['all','Все · 22']].map(([value,label]) => <button type="button" className={`chip ${waterwayType === value ? 'selected' : ''}`} aria-pressed={waterwayType === value} key={value} onClick={() => setWaterwayType(value)}>{label}</button>)}</div>}
    <div className="outline-catalog-filters"><label className="search-field"><span className="sr-only">Поиск по каталогу</span><input value={search} onChange={event => { setSearch(event.target.value); setVisibleCount(24); }} placeholder="Найти карточку"/></label>
    {kind === 'outline' && <label className="outline-region"><span className="sr-only">Регион</span><select aria-label="Регион" value={region} onChange={event => { setRegion(event.target.value); setVisibleCount(24); }}><option value="all">Все регионы</option>{regions.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}</div>
    <p className="catalog-count">Найдено: {cards.length}</p>
    <div className="entry-grid geography-grid">{cards.slice(0,visibleCount).map(card => <Link className="entry-card geography-card" to={`/geography/${card.id}`} key={card.id}>
      <MediaFrame media={geographyRepository.media(card, card.kind !== 'outline')} alt={card.kind === 'outline' ? `Силуэт страны: ${card.nameRu}` : `Карта берегов и водного прохода: ${card.nameRu}`}/>
      <div className="entry-card-text"><span className="eyebrow">{card.kind === 'outline' ? card.shapeRu : card.waterwayType === 'strait' ? 'Природный пролив' : 'Искусственный канал'}</span><h2>{card.nameRu}</h2><p>{card.kind === 'waterway' ? card.distinctionRu : card.regionRu}</p>{card.kind === 'waterway' && <span className="record-location">{card.regionRu}</span>}</div>
    </Link>)}</div>
    {cards.length > visibleCount && <div className="outline-load-more"><p>Показано {visibleCount} из {cards.length}</p><button type="button" className="button secondary-button" onClick={() => setVisibleCount(value => value + 24)}>Показать ещё</button></div>}
    {!cards.length && <EmptyState title="Ничего не найдено" description="Попробуйте другое название."/>}
  </>;
}

export function GeographyDetailPage() {
  const { id } = useParams();
  const card = geographyRepository.byId(id ?? '');
  if (!card) return <EmptyState title="Карточка недоступна" description="Объект не найден." action={{ to: '/learn', label: 'К разделам' }}/>;
  return <GeographyDetail key={card.id} cardId={card.id}/>;
}

function GeographyDetail({ cardId }: { cardId: string }) {
  const card = geographyRepository.byId(cardId)!;
  const topic = geographyTopics[card.kind];
  const [revealed, setRevealed] = useState(true);
  const [connections, setConnections] = useState(false);
  const media = geographyRepository.media(card, revealed);
  return <article className="detail-page geography-detail">
    <PageHeader title={card.nameRu} description={card.regionRu} back={{ to: `/learn/${topic.path}`, label: topic.title }}/>
    <div className="detail-hero">
      <div className="detail-media">
        {card.kind === 'outline' && <div className="map-switch" role="group" aria-label="Вид карты"><button className={`chip ${!revealed ? 'selected' : ''}`} aria-pressed={!revealed} onClick={() => setRevealed(false)}>Силуэт</button><button className={`chip ${revealed ? 'selected' : ''}`} aria-pressed={revealed} onClick={() => setRevealed(true)}>На карте</button></div>}
        {card.kind === 'waterway' && <div className="map-switch" role="group" aria-label="Вид водного пути"><button type="button" className={`chip ${!connections ? 'selected' : ''}`} aria-pressed={!connections} onClick={() => setConnections(false)}>На карте</button><button type="button" className={`chip ${connections ? 'selected' : ''}`} aria-pressed={connections} onClick={() => setConnections(true)}>Связи</button></div>}
        {card.kind === 'waterway' && connections ? <WaterwayConnections card={card}/> : <MediaFrame key={media.id} media={media} alt={card.kind === 'outline' ? revealed ? `${card.nameRu}: соседи и моря` : `Силуэт страны: ${card.nameRu}` : `${card.nameRu}: очертания берегов, водоёмы у входов и выделенный проход`} expandable/>}
        <p className="media-hint">{card.kind === 'outline' ? card.scopeRu : 'Север вверху. Красная линия выделяет водный проход, не судовой ход. Карта обобщена; масштабы разных карточек различаются. Нажмите на карту для увеличения.'}</p>
        {card.kind === 'outline' && card.borderNoteRu && <p className="media-hint">{card.borderNoteRu}</p>}
      </div>
      <div className="detail-main"><span className="eyebrow">{card.kind === 'outline' ? card.shapeRu : card.waterwayType === 'strait' ? 'Природный пролив' : 'Искусственный канал'}</span><p className="lead">{card.summaryRu}</p>{card.kind === 'waterway' && <p className="selection-reason"><strong>Почему в подборке:</strong> {card.distinctionRu}</p>}<section className="detail-section"><h2>Как запомнить</h2><p>{card.explanationRu}</p></section>
        {card.kind === 'waterway' && <dl className="facts"><div><dt>Соединяет</dt><dd>{card.connectsRu.join(' ↔ ')}</dd></div>{card.banksRu.length > 0 && <div><dt>Разделяет</dt><dd>{card.banksRu.join(' и ')}</dd></div>}<div><dt>Тип</dt><dd>{card.waterwayType === 'strait' ? 'Естественный пролив' : 'Искусственный канал'}</dd></div></dl>}
      </div>
    </div>
    <div className="detail-lower">
      {card.kind === 'waterway' && <section className="detail-section water-route"><h2>Проследите путь</h2><ol>{card.routeRu.map((step, index) => <li key={step}><span className="route-dot" aria-hidden="true">{index + 1}</span><span>{step}</span></li>)}</ol></section>}
      <Link className="button primary-button detail-cta" to={`/quiz/session?mode=${card.kind}&count=5&focus=${card.id}-identify`}>Проверить себя</Link>
      <CardNavigation ids={geographyRepository.byKind(card.kind).map(item => item.id)} currentId={card.id} path={id => `/geography/${id}`}/>
      <section className="source-block">
        <h2>Источники и права</h2><p className="source-label">Факты · проверено {card.verifiedAt}</p>
        <ul>{geographyRepository.sources(card.sourceIds).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a></li>)}</ul>
        <p className="source-label">Картографическая основа</p>
        <p><a href={media.sourcePageUrl} target="_blank" rel="noreferrer">{media.publisher}</a> · {media.author}</p>
        {card.kind === 'outline' && <p><a href={geographyRepository.marineSource.originalAssetUrl} target="_blank" rel="noreferrer">Морские подписи: Natural Earth Marine Areas</a></p>}
        <p><a href={media.rightsUrl} target="_blank" rel="noreferrer">{media.license}</a> · {media.attributionText}</p>
      </section>
    </div>
  </article>;
}
