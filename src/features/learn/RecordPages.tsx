import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { extremeTags, extremeKindFilters, recordsTopic, recordCatalogPath, isExtremeKind, extremesRepository, type Extreme, type EditorialSource } from '../../data/extremes';
import { geographyNamesRepository, nameTags, nameTypes, type GeographyName } from '../../data/geographyNames';
import { PageHeader, EmptyState } from '../../components/Shared';
import { CardNavigation } from '../../components/CardNavigation';

export function RecordMark({ card }: { card: Extreme | GeographyName }) {
  return <div className={`record-mark ${'kind' in card ? `record-${card.kind}` : 'record-name'}`}>
    <span className="eyebrow">{'metric' in card ? card.metric.labelRu : nameTypes[card.nameType]}</span>
    <strong>{'metric' in card ? card.metric.valueRu : card.markRu}</strong>
  </div>;
}

function Sources({ sources, date }: { sources: EditorialSource[]; date: string }) {
  return <section className="source-block"><h2>Источники</h2><p className="source-label">Проверено {date}</p><ul>{sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a></li>)}</ul></section>;
}

export function RecordCatalogPage({ kind }: { kind: 'records' | 'name' }) {
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('all');
  const [params, setParams] = useSearchParams();
  const requestedKind = params.get('kind');
  const selectedKind = isExtremeKind(requestedKind) ? requestedKind : 'all';
  const names = kind === 'name';
  const topic = names ? { title: 'Так называемые', description: 'Экспериментальная рубрика о необычных географических именах.' } : recordsTopic;
  const all: (Extreme | GeographyName)[] = names ? geographyNamesRepository.all() : extremesRepository.all();
  const byKind = all.filter(card => names || selectedKind === 'all' || 'kind' in card && card.kind === selectedKind);
  const tags = names ? nameTags : extremeTags;
  const activeTags = Object.entries(tags).filter(([value]) => byKind.some(card => (card.tags as string[]).includes(value)));
  const query = search.trim().toLocaleLowerCase('ru').replaceAll('ё', 'е');
  const cards = byKind.filter(card => (tag === 'all' || (card.tags as string[]).includes(tag)) &&
    [card.nameRu, card.regionRu, card.explanationRu, 'targetRu' in card ? card.targetRu : card.distinctionRu].join(' ').toLocaleLowerCase('ru').replaceAll('ё', 'е').includes(query));
  return <>
    <PageHeader title={topic.title} description={topic.description} back={{ to: '/learn', label: 'Изучать' }}/>
    <div className="geography-intro"><span className="eyebrow">{names ? 'Эксперимент' : 'Рекорды и уникальность'} · Карточек: {all.length}</span><p>{names
      ? 'Цвета, числа, звуки и запахи на карте. У каждого имени указан статус: термин, топоним, перевод, образное, историческое или условное название. Сравнивайте название, конкретный объект и оговорки об употреблении.'
      : 'Редакционная подборка знаменитых объектов по принципу «самые»: рекорды мира и регионов, необычные свойства и уникальные ландшафты. Это не рейтинг популярности. У каждой карточки есть критерий отбора и оговорка о методе измерения.'}</p>
      {!names && <Link className="button primary-button" to={`/quiz/session?mode=${selectedKind === 'all' ? 'records' : selectedKind}&count=5`}>Тренировать тему</Link>}
    </div>
    {!names && <div className="chip-row" role="group" aria-label="Тип объекта">{[{ value: 'all', label: 'Все' }, ...extremeKindFilters].map(({ value, label }) => <button type="button" className={`chip ${selectedKind === value ? 'selected' : ''}`} aria-pressed={selectedKind === value} key={value} onClick={() => {
      setTag('all');
      setParams(value === 'all' ? {} : { kind: value });
    }}>{label}</button>)}</div>}
    <div className="catalog-toolbar"><label className="search-field"><span className="sr-only">Поиск по каталогу</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder={names ? 'Название или настоящий объект' : 'Название или особенность'}/></label>
      <div className="chip-row" role="group" aria-label="Критерий отбора">{[['all', 'Все'], ...activeTags].map(([value, label]) => <button type="button" className={`chip ${tag === value ? 'selected' : ''}`} aria-pressed={tag === value} key={value} onClick={() => setTag(value)}>{label}</button>)}</div>
    </div>
    <p className="catalog-count">Найдено: {cards.length}</p>
    <div className="entry-grid record-grid">{cards.map(card => <Link className="entry-card record-card" key={card.id} to={`/${names ? 'name' : 'record'}/${card.id}${!names && selectedKind !== 'all' ? `?kind=${selectedKind}` : ''}`}>
      <RecordMark card={card}/><div className="entry-card-text"><h2>{card.nameRu}</h2><p>{'targetRu' in card ? card.targetRu : card.distinctionRu}</p><span className="record-location">{card.regionRu}</span></div>
    </Link>)}</div>
    {!cards.length && <EmptyState title="Ничего не найдено" description="Попробуйте другое название или критерий."/>}
  </>;
}

export function RecordDetailPage({ names = false }: { names?: boolean }) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const card = names ? geographyNamesRepository.byId(id ?? '') : extremesRepository.byId(id ?? '');
  if (!card) return <EmptyState title="Карточка недоступна" description="Объект не найден." action={{ to: '/learn', label: 'К разделам' }}/>;
  const name = 'targetRu' in card;
  const requestedKind = params.get('kind');
  const selectedKind = !name && isExtremeKind(requestedKind) && requestedKind === card.kind ? requestedKind : undefined;
  const all = name ? geographyNamesRepository.all() : selectedKind ? extremesRepository.byKind(selectedKind) : extremesRepository.all();
  return <article className="detail-page record-detail">
    <PageHeader title={card.nameRu} description={card.regionRu} back={{ to: name ? '/learn/names' : recordCatalogPath(selectedKind), label: name ? 'Так называемые' : recordsTopic.title }}/>
    <div className="detail-hero"><div className="detail-media"><RecordMark card={card}/></div>
      <div className="detail-main"><span className="eyebrow">{name ? `Эксперимент · ${nameTypes[card.nameType]}` : 'Почему в подборке'}</span><p className="lead">{name ? card.targetRu : card.distinctionRu}</p>
      <section className="detail-section"><h2>{name ? 'Что стоит за названием' : 'Как запомнить'}</h2><p>{card.explanationRu}</p></section>
      <section className="record-caveat"><h2>{name ? 'Не перепутайте' : 'Как понимать рекорд'}</h2><p>{name ? card.cautionRu : card.caveatRu}</p></section>
      </div>
    </div>
    <div className="detail-lower">
      {!name && <Link className="button primary-button detail-cta" to={`/quiz/session?mode=${card.kind}&count=5&focus=record-${card.id}`}>Проверить себя</Link>}
      <CardNavigation ids={all.map(item => item.id)} currentId={card.id} path={id => `/${name ? 'name' : 'record'}/${id}${selectedKind ? `?kind=${selectedKind}` : ''}`}/>
      <Sources date={card.verifiedAt} sources={(name ? geographyNamesRepository : extremesRepository).sources(card.sourceIds)}/>
    </div>
  </article>;
}
