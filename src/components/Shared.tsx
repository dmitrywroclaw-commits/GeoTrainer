import { Link } from 'react-router-dom';
import type { Entry } from '../data/schema';
import { contentRepository } from '../data/repository';
import { Icon } from './Icon';
import { MediaFrame } from './MediaFrame';

export const kindPath = { flag: 'flags', emblem: 'emblems', landmark: 'nature' } as const;
export const kindLabel = { flag: 'Флаги', emblem: 'Гербы', landmark: 'Природа' } as const;

export function PageHeader({ title, description, back }: { title: string; description?: string; back?: { to: string; label: string } }) {
  return <header className="page-header">
    {back && <Link className="back-link" to={back.to}><Icon name="arrow" size={18}/>{back.label}</Link>}
    <h1>{title}</h1>{description && <p>{description}</p>}
  </header>;
}

export function EntryCard({ entry }: { entry: Entry }) {
  const media = contentRepository.media(entry.mediaId)!;
  const extra = entry.kind === 'landmark' ? entry.subtitleRu : entry.symbols.map(x => x.nameRu).slice(0, 2).join(' · ');
  return <Link className={`entry-card ${entry.kind === 'landmark' ? 'landmark-card' : ''}`} to={`/item/${entry.id}`}>
    <MediaFrame media={media} alt={entry.kind === 'landmark' ? `Вид: ${entry.nameRu}` : `${entry.subtitleRu}: ${entry.nameRu}`} />
    <div className="entry-card-text"><h2>{entry.nameRu}</h2><p>{extra}</p></div>
  </Link>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: { to: string; label: string } }) {
  return <div className="empty-state"><h2>{title}</h2><p>{description}</p>{action && <Link className="button secondary-button" to={action.to}>{action.label}</Link>}</div>;
}

export function SourceBlock({ entry }: { entry: Entry }) {
  const media = contentRepository.media(entry.mediaId)!;
  return <section className="source-block" aria-labelledby="sources-heading"><h2 id="sources-heading">Источники и права</h2>
    <p className="source-label">Факты</p>
    <ul>{contentRepository.sources(entry.sourceIds).map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.publisher}: {source.title}</a></li>)}</ul>
    <p className="source-label">Изображение</p>
    <p><a href={media.sourcePageUrl} target="_blank" rel="noreferrer">{media.publisher}</a>{media.author ? ` · ${media.author}` : ''}</p>
    <p>{media.rightsUrl ? <a href={media.rightsUrl} target="_blank" rel="noreferrer">{media.license}</a> : media.license} · проверено {media.checkedAt}</p>
  </section>;
}
