import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { MediaFrame } from '../../components/MediaFrame';
import { EmptyState, PageHeader } from '../../components/Shared';
import { capitalRepository } from '../../data/capitals';

export function CapitalCatalogPage() {
  const [search, setSearch] = useState('');
  const entries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');
    return capitalRepository.all().filter(entry =>
      !query || [entry.cityNameRu, entry.cityNameEn, capitalRepository.countryName(entry.countryId), entry.photoCaptionRu ?? '']
        .join(' ').toLocaleLowerCase('ru').includes(query));
  }, [search]);
  return <>
    <PageHeader title="Столицы" description="Изучайте пары страна — столица и различайте столичные роли." back={{ to: '/learn', label: 'Изучать' }}/>
    <div className="catalog-toolbar"><label className="search-field"><Icon name="search" size={20}/><span className="sr-only">Поиск по столицам и странам</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Город или страна" /></label></div>
    <p className="catalog-count">{entries.length} карточек</p>
    {entries.length ? <div className="entry-grid capital-grid">{entries.map(entry => {
      const media = capitalRepository.media(entry.mediaId);
      return <Link className={`entry-card capital-card ${media ? '' : 'capital-text-card'}`} to={`/capital/${entry.id}`} key={entry.id}>
        {media && <MediaFrame media={media} alt={`Фотография города ${entry.cityNameRu}`} />}
        <div className="entry-card-text"><p className="capital-card-country">{capitalRepository.countryName(entry.countryId)}</p><h2>{entry.cityNameRu}</h2><p>{entry.roleRu}</p></div>
      </Link>;
    })}</div> : <div className="empty-state"><h2>Ничего не найдено</h2><p>Попробуйте другое название города или страны.</p><button className="button secondary-button" type="button" onClick={() => setSearch('')}>Сбросить поиск</button></div>}
  </>;
}

export function CapitalDetailPage() {
  const { id } = useParams();
  const entry = capitalRepository.byId(id ?? '');
  if (!entry) return <EmptyState title="Карточка недоступна" description="Город не найден или ещё не опубликован." action={{ to: '/learn/capitals', label: 'К столицам' }}/ >;
  const media = capitalRepository.media(entry.mediaId);
  const country = capitalRepository.countryName(entry.countryId);
  const question = capitalRepository.allQuestions().find(spec => spec.cardId === entry.id && spec.type === 'country-to-city');
  return <article className="detail-page">
    <PageHeader title={entry.cityNameRu} description={`${country} · ${entry.roleRu}`} back={{ to: '/learn/capitals', label: 'Столицы' }}/>
    <div className={`detail-hero ${media ? 'detail-landmark' : 'detail-capital-text'}`}>
      {media && <div className="detail-media"><MediaFrame media={media} alt={`Фотография города ${entry.cityNameRu}`} expandable/><p className="media-hint">{entry.photoCaptionRu ?? `Вид города ${entry.cityNameRu}`}</p></div>}
      <div className="detail-main"><p className="lead">{entry.summaryRu}</p>
        <dl className="facts capital-facts"><div><dt>Страна</dt><dd>{country}</dd></div><div><dt>Город</dt><dd>{entry.cityNameRu}</dd></div><div><dt>Роль</dt><dd>{entry.roleRu}</dd></div></dl>
        <section className="detail-section"><h2>О городе</h2><p>{entry.explanationRu}</p></section>
      </div>
    </div>
    <div className="detail-lower"><section className="source-block"><h2>Источники</h2><ul>{capitalRepository.sources(entry.sourceIds).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a></li>)}</ul>
      {media && <><p className="source-label">Фотография и права</p><p><a href={media.sourcePageUrl} target="_blank" rel="noreferrer">{media.publisher}</a> · {media.author}</p><p><a href={media.rightsUrl} target="_blank" rel="noreferrer">{media.license}</a> · {media.attributionText} · проверено {media.checkedAt}</p></>}
    </section>
    {question && <Link className="button primary-button detail-cta" to={`/quiz/session?mode=capital&count=5&focus=${question.id}`}>Проверить себя</Link>}</div>
  </article>;
}
