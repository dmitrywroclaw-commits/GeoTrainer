import { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nextCardId, randomCardId } from '../features/learn/cardNavigation';

export function CardNavigation({ ids, currentId, path }: {
  ids: readonly string[];
  currentId: string;
  path: (id: string) => string;
}) {
  const navigate = useNavigate();
  const position = ids.indexOf(currentId);
  const nextId = nextCardId(ids, currentId);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentId]);

  return <nav className="card-navigation" aria-label="Навигация по карточкам">
    <div className="card-navigation-heading"><h2>Продолжить изучение</h2><p>Карточка {position + 1} из {ids.length}</p></div>
    <div className="card-navigation-actions">
      <button type="button" className="button primary-button" disabled={!nextId} onClick={() => nextId && navigate(path(nextId))}>Дальше</button>
      <button type="button" className="button secondary-button" disabled={!nextId} onClick={() => {
        const randomId = randomCardId(ids, currentId);
        if (randomId) navigate(path(randomId));
      }}>Случайная</button>
    </div>
  </nav>;
}
