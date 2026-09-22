import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contentRepository } from '../../data/repository';
import type { Entry } from '../../data/schema';
import { useProgress } from '../../app/ProgressContext';
import { EntryCard, EmptyState, PageHeader, SourceBlock, kindLabel, kindPath } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import { MediaFrame } from '../../components/MediaFrame';

const categories = [
  { kind: 'flag' as const, title: 'Флаги', description: 'Узнайте страны по символам на флагах.', teaser: 'Орёл, лист, звёзды и другие детали' },
  { kind: 'emblem' as const, title: 'Гербы', description: 'Рассмотрите государственные гербы и эмблемы.', teaser: 'История в знаках и фигурах' },
  { kind: 'landmark' as const, title: 'Природа', description: 'Изучайте узнаваемые места планеты.', teaser: 'Горы, каньоны и водопады' },
];
const paths = { flags: 'flag', emblems: 'emblem', nature: 'landmark' } as const;
const filters: Record<Entry['kind'], { label: string; value: string }[]> = {
  flag: [{ label: 'Все', value: 'all' }, { label: 'Птицы', value: 'bird' }, { label: 'Животные', value: 'animal' }, { label: 'Растения', value: 'plant' }, { label: 'Звёзды', value: 'constellation' }, { label: 'Надписи', value: 'inscription' }],
  emblem: [{ label: 'Все', value: 'all' }, { label: 'Птицы', value: 'bird' }, { label: 'Животные', value: 'animal' }, { label: 'Растения', value: 'plant' }, { label: 'Цветы', value: 'flower' }],
  landmark: [{ label: 'Все', value: 'all' }, { label: 'Каньоны', value: 'canyon' }, { label: 'Вулканы', value: 'volcano' }, { label: 'Водопады', value: 'waterfall' }, { label: 'Скалы', value: 'geological_formation' }],
};

export function LearnHome() {
  const { records } = useProgress();
  const latest = [...records].sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))[0];
  const continueEntry = latest && contentRepository.byId(latest.contentId);
  const reviewCount = records.filter(x => x.wrongCount > 0).length;
  return <>
    <PageHeader title="Изучать" description="География, которую легко узнать и запомнить." />
    <div className="category-grid">{categories.map(category => {
      const entries = contentRepository.byKind(category.kind);
      const media = contentRepository.media(entries[0].mediaId)!;
      return <Link key={category.kind} className={`category-card category-${category.kind}`} to={`/learn/${kindPath[category.kind]}`}>
        <div className="category-visual"><MediaFrame media={media} alt="" /></div>
        <div className="category-body"><span className="eyebrow">{entries.length} объекта</span><h2>{category.title}</h2><p>{category.description}</p><span className="category-teaser">{category.teaser}</span></div>
      </Link>;
    })}</div>
    {(continueEntry || reviewCount > 0) && <div className="home-secondary">
      {continueEntry && <section><h2>Продолжить изучение</h2><Link className="inline-card" to={`/item/${continueEntry.id}`}>{continueEntry.nameRu}<span>Открыть карточку →</span></Link></section>}
      {reviewCount > 0 && <section><h2>Повторить ошибки</h2><Link className="inline-card" to="/mistakes">{reviewCount} {reviewCount === 1 ? 'объект' : 'объекта'} для повторения<span>Перейти →</span></Link></section>}
    </div>}
  </>;
}

export function CatalogPage() {
  const { category } = useParams();
  const kind = paths[category as keyof typeof paths];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const entries = useMemo(() => {
    if (!kind) return [];
    const query = search.trim().toLocaleLowerCase('ru');
    return contentRepository.byKind(kind).filter(entry => {
      const text = [entry.nameRu, entry.subtitleRu, entry.summaryRu, ...(entry.kind === 'landmark' ? [] : entry.symbols.map(x => x.nameRu))].join(' ').toLocaleLowerCase('ru');
      return (!query || text.includes(query)) && (filter === 'all' || (entry.kind === 'landmark' ? entry.landmarkType === filter : entry.symbols.some(x => x.category === filter || (filter === 'plant' && ['leaf', 'flower', 'tree'].includes(x.category)))));
    });
  }, [kind, search, filter]);
  if (!kind) return <EmptyState title="Раздел не найден" description="Проверьте адрес страницы." action={{ to: '/learn', label: 'К разделам' }} />;
  return <>
    <PageHeader title={kindLabel[kind]} description={kind === 'flag' ? 'Изучайте символы на официальных флагах стран.' : kind === 'emblem' ? 'Смотрите, что изображено на государственных символах.' : 'Узнавайте природные места по фотографиям.'} back={{ to: '/learn', label: 'Изучать' }} />
    <div className="catalog-toolbar"><label className="search-field"><Icon name="search" size={20}/><span className="sr-only">Поиск по каталогу</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Страна, символ или объект" /></label>
      <div className="chip-row" aria-label="Фильтр">{filters[kind].map(item => <button key={item.value} type="button" className={`chip ${filter === item.value ? 'selected' : ''}`} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value}>{item.label}</button>)}</div>
    </div>
    <p className="catalog-count">{entries.length} {entries.length === 1 ? 'объект' : 'объекта'}</p>
    {entries.length ? <div className={`entry-grid grid-${kind}`}>{entries.map(entry => <EntryCard key={entry.id} entry={entry}/>)}</div> : <div className="empty-state"><h2>Ничего не найдено</h2><p>Попробуйте другое название или уберите фильтр.</p><button type="button" className="button secondary-button" onClick={() => { setSearch(''); setFilter('all'); }}>Сбросить фильтры</button></div>}
  </>;
}

export function DetailPage() {
  const { id } = useParams();
  const entry = contentRepository.byId(id ?? '');
  if (!entry) return <EmptyState title="Карточка недоступна" description="Объект не найден или ещё не опубликован." action={{ to: '/learn', label: 'К разделам' }} />;
  const media = contentRepository.media(entry.mediaId)!;
  return <article className="detail-page">
    <PageHeader title={entry.nameRu} description={entry.subtitleRu} back={{ to: `/learn/${kindPath[entry.kind]}`, label: kindLabel[entry.kind] }} />
    <div className={`detail-hero detail-${entry.kind}`}>
      <div className="detail-media"><MediaFrame media={media} alt={entry.kind === 'landmark' ? `Фотография: ${entry.nameRu}` : `${entry.subtitleRu} ${entry.nameRu}`} expandable/><p className="media-hint">Нажмите на изображение, чтобы рассмотреть крупнее.</p></div>
      <div className="detail-main"><p className="lead">{entry.summaryRu}</p>
        <section className="detail-section"><h2>{entry.kind === 'landmark' ? 'Ключевые факты' : 'Что изображено'}</h2>
          {entry.kind === 'landmark' ? <dl className="facts">{entry.facts.map(fact => <div key={fact.labelRu}><dt>{fact.labelRu}</dt><dd>{fact.valueRu}</dd></div>)}</dl> : <ul className="symbol-list">{entry.symbols.map(symbol => <li key={symbol.nameRu}><strong>{symbol.nameRu}</strong>{symbol.meaningRu && <span>{symbol.meaningRu}</span>}</li>)}</ul>}
        </section>
        <section className="detail-section"><h2>{entry.kind === 'landmark' ? 'Почему известно' : 'Что означает'}</h2><p>{entry.kind === 'landmark' ? entry.whyNotableRu : entry.explanationRu}</p></section>
      </div>
    </div>
    <div className="detail-lower"><section className="detail-section"><h2>{entry.kind === 'landmark' ? 'Как образовалось' : 'История и контекст'}</h2><p>{entry.kind === 'landmark' ? entry.explanationRu : entry.historyRu ?? entry.explanationRu}</p></section>
      <SourceBlock entry={entry}/>
      <Link className="button primary-button detail-cta" to={`/quiz/session?mode=${entry.kind}&count=5&focus=${entry.id}`}>Проверить себя</Link>
    </div>
  </article>;
}
