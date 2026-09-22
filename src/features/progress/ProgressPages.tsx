import { Link } from 'react-router-dom';
import { useProgress } from '../../app/ProgressContext';
import { EmptyState, PageHeader, kindLabel } from '../../components/Shared';
import { MediaFrame } from '../../components/MediaFrame';
import { contentRepository } from '../../data/repository';
import { aggregateProgress, selectMistakes, type ContentType } from '../../storage/progress';

export function MistakesPage() {
  const { records, ready } = useProgress();
  if (!ready) return <p>Загружаем ошибки…</p>;
  const mistakes = selectMistakes(records).map(record => ({ record, entry: contentRepository.byId(record.contentId) })).filter(item => item.entry);
  return <>
    <PageHeader title="Ошибки" description={mistakes.length ? `${mistakes.length} объектов для повторения` : 'Повторяйте то, что пока не удалось запомнить.'} />
    {!mistakes.length ? <EmptyState title="Ошибок для повторения пока нет" description="Пройдите квиз — сложные объекты появятся здесь." action={{ to: '/quiz', label: 'Начать квиз' }}/> : <>
      <Link className="button primary-button review-button" to={`/quiz/session?mode=mistakes&count=${Math.min(20, Math.max(5, mistakes.length))}`}>Повторить ошибки</Link>
      <h2 className="list-heading">Чаще всего ошибаетесь</h2>
      <div className="mistakes-list">{mistakes.map(({ record, entry }) => {
        const item = entry!;
        const media = contentRepository.media(item.mediaId)!;
        return <Link className="mistake-row" to={`/item/${item.id}`} key={item.id}>
          <MediaFrame media={media} alt="" />
          <div><span className="eyebrow">{kindLabel[item.kind]}</span><h3>{item.nameRu}</h3><p>Ошибок: {record.wrongCount} · Верно: {record.correctCount}</p></div><span className="row-arrow" aria-hidden="true">→</span>
        </Link>;
      })}</div>
    </>}
  </>;
}

export function ProgressPage() {
  const { records, ready } = useProgress();
  if (!ready) return <p>Загружаем прогресс…</p>;
  const total = aggregateProgress(records);
  return <>
    <PageHeader title="Прогресс" description="Ваши результаты сохраняются на этом устройстве." />
    {!total.total ? <EmptyState title="Прогресса пока нет" description="Начните тренировку, чтобы увидеть результаты." action={{ to: '/quiz', label: 'Начать квиз' }}/> : <>
      <div className="progress-overview"><div><strong>{total.total}</strong><span>ответов</span></div><div><strong>{total.percentage}%</strong><span>верных</span></div><div><strong>{total.needsReview}</strong><span>для повторения</span></div></div>
      <h2 className="list-heading">По темам</h2>
      <div className="domain-progress">{(['flag', 'emblem', 'landmark'] as ContentType[]).map(kind => {
        const group = records.filter(x => x.contentType === kind);
        const stats = aggregateProgress(group);
        return <div className="domain-row" key={kind}><div><h3>{kindLabel[kind]}</h3><span>{stats.total ? `${stats.correct} из ${stats.total} верно` : 'Пока без ответов'}</span></div><strong>{stats.percentage}%</strong><div className="bar-track"><span style={{ width: `${stats.percentage}%` }}/></div></div>;
      })}</div>
      <p className="progress-note">Изучено объектов: {total.studied} из {contentRepository.all().length}</p>
    </>}
  </>;
}
