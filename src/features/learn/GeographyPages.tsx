import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { geographyRepository, type GeographyKind } from '../../data/geography';
import { MediaFrame } from '../../components/MediaFrame';
import { CardNavigation } from '../../components/CardNavigation';
import { EmptyState, PageHeader } from '../../components/Shared';

export const geographyTopics = {
  outline: { title: 'Страны на карте', path: 'outlines', description: 'Узнавайте страны по силуэту и связывайте их с соседями и морями.' },
};

export function GeographyCatalogPage({ kind }: { kind: GeographyKind }) {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('all');
  const [visibleCount, setVisibleCount] = useState(24);
  const topic = geographyTopics[kind];
  const all = geographyRepository.byKind(kind);
  const regions = [...new Set(all.flatMap(card => card.kind === 'outline' ? [card.continentRu] : []))].sort((a,b) => a.localeCompare(b,'ru'));
  const cards = all.filter(card => (region === 'all' || card.kind === 'outline' && card.continentRu === region) && `${card.nameRu} ${card.regionRu} ${card.explanationRu}`.toLocaleLowerCase('ru').includes(search.trim().toLocaleLowerCase('ru')));
  return <>
    <PageHeader title={topic.title} description={topic.description} back={{ to: '/learn', label: 'Изучать' }}/>
    <div className="geography-intro"><span className="eyebrow">Новая тема · карточек: {geographyRepository.byKind(kind).length}</span><p>{kind === 'outline' ? 'Сначала запомните форму, затем посмотрите, где находится страна. Север на всех картах вверху.' : 'Запоминайте связи: какие водоёмы соединяются и какая суша остаётся по берегам.'}</p><Link className="button primary-button" to={`/quiz/session?mode=${kind}&count=5`}>Тренировать тему</Link></div>
    <div className="outline-catalog-filters"><label className="search-field"><span className="sr-only">Поиск по каталогу</span><input value={search} onChange={event => { setSearch(event.target.value); setVisibleCount(24); }} placeholder="Найти карточку"/></label>
    {kind === 'outline' && <label className="outline-region"><span className="sr-only">Регион</span><select aria-label="Регион" value={region} onChange={event => { setRegion(event.target.value); setVisibleCount(24); }}><option value="all">Все регионы</option>{regions.map(value => <option key={value} value={value}>{value}</option>)}</select></label>}</div>
    <p className="catalog-count">Найдено: {cards.length}</p>
    <div className="entry-grid geography-grid">{cards.slice(0,visibleCount).map(card => <Link className="entry-card geography-card" to={`/geography/${card.id}`} key={card.id}>
      <MediaFrame media={geographyRepository.media(card, false)} alt={`Силуэт страны: ${card.nameRu}`}/>
      <div className="entry-card-text"><span className="eyebrow">{card.shapeRu}</span><h2>{card.nameRu}</h2><p>{card.regionRu}</p></div>
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
  const media = geographyRepository.media(card, revealed);
  return <article className="detail-page geography-detail">
    <PageHeader title={card.nameRu} description={card.regionRu} back={{ to: `/learn/${topic.path}`, label: topic.title }}/>
    <div className="detail-hero">
      <div className="detail-media">
        {card.kind === 'outline' && <div className="map-switch" role="group" aria-label="Вид карты"><button className={`chip ${!revealed ? 'selected' : ''}`} aria-pressed={!revealed} onClick={() => setRevealed(false)}>Силуэт</button><button className={`chip ${revealed ? 'selected' : ''}`} aria-pressed={revealed} onClick={() => setRevealed(true)}>На карте</button></div>}
        <MediaFrame key={media.id} media={media} alt={revealed ? `${card.nameRu}: соседи и моря` : `Силуэт страны: ${card.nameRu}`} expandable/>
        <p className="media-hint">{card.kind === 'outline' ? card.scopeRu : 'Учебная схема связей. Расстояния, форма берегов и стороны света не передаются.'}</p>
        {card.kind === 'outline' && card.borderNoteRu && <p className="media-hint">{card.borderNoteRu}</p>}
      </div>
      <div className="detail-main"><span className="eyebrow">{card.shapeRu}</span><p className="lead">{card.summaryRu}</p><section className="detail-section"><h2>Как запомнить</h2><p>{card.explanationRu}</p></section>
      </div>
    </div>
    <div className="detail-lower">
      <Link className="button primary-button detail-cta" to={`/quiz/session?mode=${card.kind}&count=5&focus=${card.id}-identify`}>Проверить себя</Link>
      <CardNavigation ids={geographyRepository.byKind(card.kind).map(item => item.id)} currentId={card.id} path={id => `/geography/${id}`}/>
      <section className="source-block">
        <h2>Источники и права</h2><p className="source-label">Факты · проверено {card.verifiedAt}</p>
        <ul>{geographyRepository.sources(card.sourceIds).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a></li>)}</ul>
        <p className="source-label">{card.kind === 'outline' ? 'Картографическая основа' : 'Схема'}</p>
        {card.kind === 'outline' ? <p><a href={media.sourcePageUrl} target="_blank" rel="noreferrer">{media.publisher}</a> · {media.author}</p> : <p>Автор схемы: {media.author}</p>}
        {card.kind === 'outline' && <p><a href={geographyRepository.marineSource.originalAssetUrl} target="_blank" rel="noreferrer">Морские подписи: Natural Earth Marine Areas</a></p>}
        <p><a href={media.rightsUrl} target="_blank" rel="noreferrer">{media.license}</a> · {media.attributionText}</p>
      </section>
    </div>
  </article>;
}
