import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contentRepository } from '../../data/repository';
import type { Entry } from '../../data/schema';
import { useProgress } from '../../app/ProgressContext';
import { EntryCard, EmptyState, PageHeader, SourceBlock, kindLabel, kindPath } from '../../components/Shared';
import { Icon } from '../../components/Icon';
import { MediaFrame } from '../../components/MediaFrame';
import { flagMeaningHistory } from './flagCopy';
import { travelCards } from '../../data/travelCards';
import { borderRepository } from '../../data/borders';
import { capitalRepository } from '../../data/capitals';
import { TravelImage } from './TravelPages';

const categories = [
  { kind: 'flag' as const, title: 'Флаги', description: 'Узнайте страны по символам на флагах.', teaser: 'Орёл, лист, звёзды и другие детали' },
  { kind: 'emblem' as const, title: 'Гербы', description: 'Рассмотрите государственные гербы и эмблемы.', teaser: 'История в знаках и фигурах' },
  { kind: 'landmark' as const, title: 'Природа', description: 'Изучайте узнаваемые места планеты.', teaser: 'Горы, каньоны и водопады' },
];
const paths = { flags: 'flag', emblems: 'emblem', nature: 'landmark' } as const;
const filters: Record<Entry['kind'], { label: string; value: string }[]> = {
  flag: [{ label: 'Все', value: 'all' }, { label: 'Птицы', value: 'bird' }, { label: 'Животные', value: 'animal' }, { label: 'Растения', value: 'plant' }, { label: 'Звёзды', value: 'star' }, { label: 'Солнце', value: 'sun' }, { label: 'Луна', value: 'moon' }, { label: 'Гербы и эмблемы', value: 'coat_of_arms' }, { label: 'Надписи', value: 'inscription' }],
  emblem: [{ label: 'Все', value: 'all' }, { label: 'Птицы', value: 'bird' }, { label: 'Животные', value: 'animal' }, { label: 'Растения', value: 'plant' }, { label: 'Цветы', value: 'flower' }],
  landmark: [{ label: 'Все', value: 'all' }, { label: 'Каньоны', value: 'canyon' }, { label: 'Вулканы', value: 'volcano' }, { label: 'Водопады', value: 'waterfall' }, { label: 'Озёра', value: 'lake' }, { label: 'Реки и дельты', value: 'river' }, { label: 'Острова', value: 'island' }, { label: 'Рифы и чудеса', value: 'natural_wonder' }, { label: 'Скалы', value: 'geological_formation' }],
};

function objectCount(value: number) {
  const lastTwo = value % 100;
  const last = value % 10;
  const noun = lastTwo >= 11 && lastTwo <= 14 ? 'объектов' : last === 1 ? 'объект' : last >= 2 && last <= 4 ? 'объекта' : 'объектов';
  return `${value} ${noun}`;
}

export function LearnHome() {
  const { records } = useProgress();
  const latest = [...records].sort((a, b) => b.lastAttemptAt.localeCompare(a.lastAttemptAt))[0];
  const continueEntry = latest && contentRepository.byId(latest.contentId);
  const continueBorder = latest && borderRepository.question(latest.contentId);
  const continueCapital = latest && capitalRepository.question(latest.contentId);
  const reviewCount = records.filter(x => x.wrongCount > 0).length;
  return <>
    <PageHeader title="Изучать" description="География, которую легко узнать и запомнить." />
    <div className="category-grid">{categories.map(category => {
      const entries = contentRepository.byKind(category.kind);
      const media = contentRepository.media(entries[0].mediaId)!;
      return <Link key={category.kind} className={`category-card category-${category.kind}`} to={`/learn/${kindPath[category.kind]}`}>
        <div className="category-visual"><MediaFrame media={media} alt="" /></div>
        <div className="category-body"><span className="eyebrow">{objectCount(entries.length)}</span><h2>{category.title}</h2><p>{category.description}</p><span className="category-teaser">{category.teaser}</span></div>
      </Link>;
    })}
    <Link className="category-card category-border" to="/learn/borders">
      <div className="category-visual"><MediaFrame media={borderRepository.map('switzerland', true)} alt="" /></div>
      <div className="category-body"><span className="eyebrow">{objectCount(borderRepository.allFacts().length)}</span><h2>Границы</h2><p>Изучайте соседей стран по картам.</p><span className="category-teaser">{borderRepository.allQuestions().length} вопросов для тренировки</span></div>
    </Link>
    <Link className="category-card category-landmark" to="/learn/capitals">
      <div className="category-visual"><div className="capital-category-mark" aria-hidden="true"><span>Страна</span><strong>→</strong><span>Столица</span></div></div>
      <div className="category-body"><span className="eyebrow">{objectCount(capitalRepository.all().length)}</span><h2>Столицы</h2><p>Запоминайте пары страна — столица.</p></div>
    </Link>
    {(['food', 'architecture'] as const).map(kind => <Link key={kind} className="category-card category-landmark" to={`/learn/${kind}`}>
      <div className="category-visual"><TravelImage card={travelCards.byKind(kind)[0]}/></div>
      <div className="category-body"><span className="eyebrow">{objectCount(travelCards.byKind(kind).length)}</span><h2>{kind === 'food' ? 'Еда мира' : 'Архитектура'}</h2><p>{kind === 'food' ? 'Необычные блюда и традиции.' : 'Известные здания и сооружения.'}</p></div>
    </Link>)}</div>
    {(continueEntry || continueBorder || continueCapital || reviewCount > 0) && <div className="home-secondary">
      {continueEntry && <section><h2>Продолжить изучение</h2><Link className="inline-card" to={`/item/${continueEntry.id}`}>{continueEntry.nameRu}<span>Открыть карточку →</span></Link></section>}
      {continueBorder && <section><h2>Продолжить изучение</h2><Link className="inline-card" to={`/border/${continueBorder.countryId}`}>{borderRepository.countryName(continueBorder.countryId)}<span>Открыть карту →</span></Link></section>}
      {continueCapital && <section><h2>Продолжить изучение</h2><Link className="inline-card" to={`/capital/${continueCapital.cardId}`}>{capitalRepository.byId(continueCapital.cardId)?.cityNameRu}<span>Открыть карточку →</span></Link></section>}
      {reviewCount > 0 && <section><h2>Повторить ошибки</h2><Link className="inline-card" to="/mistakes">{objectCount(reviewCount)} для повторения<span>Перейти →</span></Link></section>}
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
      return (!query || text.includes(query)) && (filter === 'all' || (entry.kind === 'landmark' ? entry.landmarkType === filter : entry.symbols.some(x => x.category === filter || (filter === 'star' && x.category === 'constellation') || (filter === 'plant' && ['leaf', 'flower', 'tree'].includes(x.category)) || (filter === 'coat_of_arms' && x.category === 'emblem'))));
    });
  }, [kind, search, filter]);
  if (!kind) return <EmptyState title="Раздел не найден" description="Проверьте адрес страницы." action={{ to: '/learn', label: 'К разделам' }} />;
  return <>
    <PageHeader title={kindLabel[kind]} description={kind === 'flag' ? 'Изучайте национальные и государственные флаги стран.' : kind === 'emblem' ? 'Смотрите, что изображено на государственных символах.' : 'Узнавайте природные места по фотографиям.'} back={{ to: '/learn', label: 'Изучать' }} />
    <div className="catalog-toolbar"><label className="search-field"><Icon name="search" size={20}/><span className="sr-only">Поиск по каталогу</span><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Страна, символ или объект" /></label>
      <div className="chip-row" aria-label="Фильтр">{filters[kind].map(item => <button key={item.value} type="button" className={`chip ${filter === item.value ? 'selected' : ''}`} onClick={() => setFilter(item.value)} aria-pressed={filter === item.value}>{item.label}</button>)}</div>
    </div>
    <p className="catalog-count">{objectCount(entries.length)}</p>
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
      <div className="detail-main">{entry.kind !== 'flag' && <p className="lead">{entry.summaryRu}</p>}
        {entry.kind === 'landmark' && entry.regionRu && <p className="detail-location"><strong>Где находится:</strong> {entry.regionRu}</p>}
        {entry.kind === 'flag' ? <>
          <section className="detail-section"><h2>Описание флага</h2><p>{entry.summaryRu}</p></section>
          <section className="detail-section"><h2>Значение и история</h2><p>{flagMeaningHistory(entry)}</p></section>
        </> : <>
        <section className="detail-section"><h2>{entry.kind === 'landmark' ? 'Ключевые факты' : 'Что изображено'}</h2>
          {entry.kind === 'landmark' ? <dl className="facts">{entry.facts.map(fact => <div key={fact.labelRu}><dt>{fact.labelRu}</dt><dd>{fact.valueRu}</dd></div>)}</dl> : <ul className="symbol-list">{entry.symbols.map(symbol => <li key={symbol.nameRu}><strong>{symbol.nameRu}</strong>{symbol.meaningRu && <span>{symbol.meaningRu}</span>}</li>)}</ul>}
        </section>
        <section className="detail-section"><h2>{entry.kind === 'landmark' ? 'Почему известно' : 'Что означает'}</h2><p>{entry.kind === 'landmark' ? entry.whyNotableRu : entry.explanationRu}</p></section>
        </>}
      </div>
    </div>
    <div className="detail-lower">{entry.kind !== 'flag' && <section className="detail-section"><h2>{entry.kind === 'landmark' ? 'Подробнее об этом месте' : 'История и контекст'}</h2><p>{entry.kind === 'landmark' ? entry.explanationRu : entry.historyRu ?? entry.explanationRu}</p></section>}
      <SourceBlock entry={entry}/>
      <Link className="button primary-button detail-cta" to={`/quiz/session?mode=${entry.kind}&count=5&focus=${entry.id}`}>Проверить себя</Link>
    </div>
  </article>;
}
