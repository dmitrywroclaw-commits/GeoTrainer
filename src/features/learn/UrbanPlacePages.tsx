import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { MediaFrame } from '../../components/MediaFrame';
import { EmptyState, PageHeader } from '../../components/Shared';
import { urbanPlaces, urbanPlaceTitle, type UrbanPlace } from '../../data/urbanPlaces';

function location(card: UrbanPlace) {
  return card.country ? `${card.city}, ${card.country}` : card.city;
}

export function UrbanPlaceImage({ card, expandable = false }: { card: UrbanPlace; expandable?: boolean }) {
  const media = urbanPlaces.media(card.id);
  if (!media) return null;
  return <MediaFrame media={media} alt={`${urbanPlaceTitle(card)}, ${card.city}`} className="urban-place-photo" expandable={expandable}/>;
}

export function UrbanPlaceCatalogPage() {
  const [search, setSearch] = useState('');
  const cards = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');
    return urbanPlaces.all().filter(card => !query ||
      [card.nameRu, card.name, card.city, card.country ?? '', card.placeTypeRu, card.whyFamousRu]
        .join(' ').toLocaleLowerCase('ru').includes(query));
  }, [search]);
  return <>
    <PageHeader title="Городские места" description="Площади, улицы, рынки и набережные из редакционного списка. Фотографии добавлены, факты проходят проверку." back={{ to: '/learn', label: 'Изучать' }}/>
    <div className="catalog-toolbar"><label className="search-field"><Icon name="search" size={20}/><span className="sr-only">Поиск городских мест</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Место, город или страна"/></label></div>
    <p className="catalog-count">{cards.length} из {urbanPlaces.all().length} карточек</p>
    {cards.length ? <div className="entry-grid grid-landmark urban-grid">{cards.map(card => <Link key={card.id} className="entry-card urban-card" to={`/urban-place/${card.id}`}>
      <UrbanPlaceImage card={card}/>
      <div className="entry-card-text"><span className="eyebrow">№ {card.rank} · {card.placeTypeRu}</span><h2>{urbanPlaceTitle(card)}</h2><p>{location(card)}</p></div>
    </Link>)}</div> : <EmptyState title="Ничего не найдено" description="Попробуйте название места, города или страны."/>}
  </>;
}

export function UrbanPlaceDetailPage() {
  const { id } = useParams();
  const card = urbanPlaces.byId(id ?? '');
  if (!card) return <EmptyState title="Карточка не найдена" description="Проверьте адрес страницы." action={{ to: '/learn/urban-places', label: 'К городским местам' }}/>;
  return <article className="detail-page urban-detail">
    <PageHeader title={urbanPlaceTitle(card)} description={`${card.placeTypeRu} · ${location(card)}`} back={{ to: '/learn/urban-places', label: 'Городские места' }}/>
    <div className="detail-hero detail-landmark">
      <div className="detail-media"><UrbanPlaceImage card={card} expandable/></div>
      <div className="detail-main">
        <span className="eyebrow">Место № {card.rank} в редакционном списке</span>
        <p className="lead">{card.whyFamousRu}</p>
        <p className="detail-location"><strong>Где находится:</strong> {location(card)}</p>
        <section className="detail-section"><h2>Что искать на фотографии</h2><p>{card.visualClueRu}</p></section>
      </div>
    </div>
    <div className="detail-lower">
      <section className="source-block"><h2>О фотографии</h2><p>{urbanPlaces.media(card.id)?.attributionText}</p><p><a href={urbanPlaces.media(card.id)?.sourcePageUrl} target="_blank" rel="noreferrer">Оригинал фотографии</a> · <a href={urbanPlaces.media(card.id)?.rightsUrl} target="_blank" rel="noreferrer">Условия лицензии</a></p></section>
      <section className="source-block"><h2>Статус карточки</h2><p>Черновик по редакционному списку «{card.sourceDocument}». Сведения о месте проходят проверку перед добавлением в квиз.</p></section>
    </div>
  </article>;
}
