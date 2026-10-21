import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CardNavigation } from '../../components/CardNavigation';
import { MediaFrame } from '../../components/MediaFrame';
import { EmptyState, PageHeader } from '../../components/Shared';
import { traditionalDishes, type TraditionalDish } from '../../data/traditionalDishes';

export function TraditionalDishImage({ dish, expandable = false }: { dish: TraditionalDish; expandable?: boolean }) {
  return <MediaFrame media={traditionalDishes.media(dish)} alt={`Фотография блюда: ${dish.nameRu}`} expandable={expandable}/>;
}

export function TraditionalDishCatalogPage() {
  const [search, setSearch] = useState('');
  const dishes = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');
    return traditionalDishes.all().filter(dish => `${dish.nameRu} ${dish.countryRu} ${dish.summaryRu}`.toLocaleLowerCase('ru').includes(query));
  }, [search]);
  return <>
    <PageHeader title="Традиционные блюда мира" description="Восемь блюд из разных стран: история, состав и обычаи." back={{ to: '/learn', label: 'Изучать' }}/>
    <div className="catalog-toolbar"><label className="search-field"><span className="sr-only">Поиск по каталогу</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Блюдо или страна"/></label></div>
    <p className="catalog-count">{dishes.length} из {traditionalDishes.all().length}</p>
    {dishes.length ? <div className="entry-grid grid-landmark">{dishes.map(dish => <Link key={dish.id} className="entry-card landmark-card" to={`/traditional-food/${dish.id}`}>
      <TraditionalDishImage dish={dish}/><div className="entry-card-text"><h2>{dish.nameRu}</h2><p>{dish.countryRu}</p></div>
    </Link>)}</div> : <EmptyState title="Ничего не найдено" description="Попробуйте другое блюдо или страну."/>}
  </>;
}

export function TraditionalDishDetailPage() {
  const { id } = useParams();
  const dish = traditionalDishes.byId(id ?? '');
  if (!dish) return <EmptyState title="Карточка не найдена" description="Проверьте адрес страницы." action={{ to: '/learn/traditional-food', label: 'Традиционные блюда мира' }}/>;
  const photo = traditionalDishes.media(dish);
  return <article className="detail-page travel-detail">
    <PageHeader title={dish.nameRu} description={dish.countryRu} back={{ to: '/learn/traditional-food', label: 'Традиционные блюда мира' }}/>
    <div className="detail-hero detail-landmark">
      <div className="detail-media"><TraditionalDishImage dish={dish} expandable/><p className="media-hint">Нажмите на изображение, чтобы рассмотреть крупнее.</p></div>
      <div className="detail-main"><p className="lead">{dish.summaryRu}</p>
        <section className="detail-section"><h2>История</h2><p>{dish.historyRu}</p></section>
        <section className="detail-section"><h2>Из чего готовят</h2><p>{dish.ingredientsRu}</p></section>
        <section className="detail-section"><h2>Традиции</h2><p>{dish.traditionsRu}</p></section>
      </div>
    </div>
    <div className="detail-lower">
      <CardNavigation ids={traditionalDishes.all().map(item => item.id)} currentId={dish.id} path={dishId => `/traditional-food/${dishId}`}/>
      <section className="source-block"><h2>Источники и права</h2><p className="source-label">О блюде</p>
        <ul>{traditionalDishes.sources(dish).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a> · {source.publisher}</li>)}</ul>
        <p className="source-label">Фотография</p>
        <p><a href={photo.sourcePageUrl} target="_blank" rel="noreferrer">Страница файла в Wikimedia Commons</a> · {photo.attributionText}</p>
        <p><a href={photo.rightsUrl} target="_blank" rel="noreferrer">Условия лицензии {photo.license}</a></p>
      </section>
    </div>
  </article>;
}
