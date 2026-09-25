import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, PageHeader } from '../../components/Shared';
import { travelCards, type TravelCard } from '../../data/travelCards';
import { MediaFrame } from '../../components/MediaFrame';

const meta = {
  food: { title: 'Еда мира', description: 'Необычные блюда и традиции разных мест.' },
  architecture: { title: 'Архитектура', description: 'Здания и сооружения, которые узнают во всём мире.' },
};

export function TravelImage({ card, expandable = false }: { card: TravelCard; expandable?: boolean }) {
  const media = travelCards.media(card.id)!;
  return <MediaFrame media={{ ...media, id: card.id, kind: 'photo' }} alt={card.kind === 'food' ? `Блюдо или ингредиент: ${card.nameRu}` : `Вид на ${card.nameRu}`} expandable={expandable}/>;
}

function cardText(card: TravelCard) {
  return card.kind === 'food' ? card.locationRu : `${card.structureTypeRu} · ${card.locationRu}`;
}

export function TravelCatalogPage({ kind }: { kind: TravelCard['kind'] }) {
  const [search, setSearch] = useState('');
  const cards = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');
    return travelCards.byKind(kind).filter(card =>
      `${card.nameRu} ${card.locationRu} ${card.descriptionRu}`.toLocaleLowerCase('ru').includes(query));
  }, [kind, search]);
  return <>
    <PageHeader title={meta[kind].title} description={meta[kind].description} back={{ to: '/learn', label: 'Изучать' }}/>
    <div className="catalog-toolbar"><label className="search-field"><span className="sr-only">Поиск по каталогу</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Название или место"/></label></div>
    <p className="catalog-count">{cards.length} из {travelCards.byKind(kind).length}</p>
    {cards.length ? <div className="entry-grid grid-landmark">{cards.map(card => <Link key={card.id} className="entry-card landmark-card" to={`/travel/${card.id}`}>
      <TravelImage card={card}/><div className="entry-card-text"><h2>{card.nameRu}</h2><p>{cardText(card)}</p></div>
    </Link>)}</div> : <EmptyState title="Ничего не найдено" description="Попробуйте другое название."/>}
  </>;
}

export function TravelDetailPage() {
  const { id } = useParams();
  const card = travelCards.byId(id ?? '');
  if (!card) return <EmptyState title="Карточка не найдена" description="Проверьте адрес страницы." action={{ to: '/learn', label: 'Изучать' }}/>
  const kind = card.kind;
  return <article className="detail-page travel-detail">
    <PageHeader title={card.nameRu} description={cardText(card)} back={{ to: `/learn/${kind}`, label: meta[kind].title }}/>
    <div className="detail-hero detail-landmark">
      <div className="detail-media"><TravelImage card={card} expandable/>{travelCards.media(card.id)?.matchKind === 'illustrative' && <p className="media-hint">{travelCards.media(card.id)?.matchNoteRu}</p>}</div>
      <div className="detail-main">
        <p className="lead">{card.descriptionRu}</p>
        <p className="detail-location"><strong>Где встречается:</strong> {card.locationRu}</p>
        <section className="detail-section"><h2>Почему интересно</h2><p>{card.whyInterestingRu}</p></section>
        {card.kind === 'food' && <section className="detail-section"><h2>Примечание</h2><p>{card.noteRu}</p></section>}
      </div>
    </div>
    <div className="detail-lower"><section className="source-block"><h2>Источники и права</h2>
      <p>Карточка подготовлена по локальному документу «{card.sourceDocument}».</p>
      {card.kind === 'architecture' && <p>Для проверки отдельных архитектурных сведений: <a href="https://whc.unesco.org/en/list" target="_blank" rel="noreferrer">Список всемирного наследия ЮНЕСКО</a>.</p>}
      <p className="source-label">Изображение</p>
      <p><a href={travelCards.media(card.id)!.sourcePageUrl} target="_blank" rel="noreferrer">{travelCards.media(card.id)!.publisher}: {travelCards.media(card.id)!.originalTitle.replace(/^File:/, '')}</a> · {travelCards.media(card.id)!.author}</p>
      <p><a href={travelCards.media(card.id)!.rightsUrl} target="_blank" rel="noreferrer">{travelCards.media(card.id)!.license}</a> · уменьшено и преобразовано в WebP</p>
    </section></div>
  </article>;
}
