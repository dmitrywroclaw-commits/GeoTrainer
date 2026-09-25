import { Link, useParams } from 'react-router-dom';
import { borderRepository } from '../../data/borders';
import { MediaFrame } from '../../components/MediaFrame';
import { EmptyState, PageHeader } from '../../components/Shared';

function neighborCount(count: number) {
  const noun = count === 1 ? 'сухопутный сосед' : count >= 2 && count <= 4 ? 'сухопутных соседа' : 'сухопутных соседей';
  return `${count} ${noun}`;
}

export function BorderCatalogPage() {
  const facts = borderRepository.allFacts();
  return <>
    <PageHeader title="Границы" description="Смотрите, какие страны соседствуют по суше, а затем проверяйте себя по карте." back={{ to: '/learn', label: 'Изучать' }}/>
    <p className="catalog-count">{facts.length} стран · {borderRepository.allQuestions().length} вопросов</p>
    <div className="entry-grid grid-border">{facts.map(fact => <Link className="entry-card" to={`/border/${fact.countryId}`} key={fact.countryId}>
      <MediaFrame media={borderRepository.map(fact.mapId, true)} alt={`Карта границ: ${borderRepository.countryName(fact.countryId)}`}/>
      <div className="entry-card-text"><h2>{borderRepository.countryName(fact.countryId)}</h2><p>{neighborCount(fact.neighborIds.length)}</p></div>
    </Link>)}</div>
  </>;
}

export function BorderDetailPage() {
  const { countryId } = useParams();
  const fact = borderRepository.fact(countryId ?? '');
  if (!fact) return <EmptyState title="Карточка недоступна" description="Данные о границах не найдены." action={{ to: '/learn/borders', label: 'К границам' }}/>;
  const name = borderRepository.countryName(fact.countryId);
  const questions = borderRepository.allQuestions().filter(item => item.countryId === fact.countryId);
  const map = borderRepository.map(fact.mapId, true);
  return <article className="detail-page border-detail">
    <PageHeader title={name} description="Сухопутные границы" back={{ to: '/learn/borders', label: 'Границы' }}/>
    <div className="detail-hero"><div className="detail-media"><MediaFrame media={map} alt={`Карта: ${name} и соседние страны`} expandable/></div>
      <div className="detail-main"><p className="lead">{fact.summaryRu}</p><section className="detail-section"><h2>Соседи по суше</h2><ul className="symbol-list">{fact.neighborIds.map(id => <li key={id}>{borderRepository.countryName(id)}</li>)}</ul></section>
        <p>Морские границы в этой теме не учитываются.</p></div></div>
    <div className="detail-lower"><section className="source-block"><h2>Источники и права</h2><p className="source-label">Границы</p><ul>{borderRepository.sources(fact.sourceIds).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a></li>)}</ul>
      <p className="source-label">Карта</p><p><a href={map.sourcePageUrl} target="_blank" rel="noreferrer">{map.publisher}: Natural Earth 1:10m</a></p><p><a href={map.rightsUrl} target="_blank" rel="noreferrer">{map.license}</a> · {map.attributionText} · проверено {map.checkedAt}</p></section>
      {questions.length > 0 && <Link className="button primary-button detail-cta" to={`/quiz/session?mode=border&count=5&focus=${questions[0].id}`}>Проверить себя</Link>}</div>
  </article>;
}
