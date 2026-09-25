import { Link, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProgressProvider, useProgress } from './ProgressContext';
import { Icon } from '../components/Icon';
import { LearnHome, CatalogPage, DetailPage } from '../features/learn/LearnPages';
import { BorderCatalogPage, BorderDetailPage } from '../features/learn/BorderPages';
import { TravelCatalogPage, TravelDetailPage } from '../features/learn/TravelPages';
import { QuizSetupPage, QuizSessionPage } from '../features/quiz/QuizPages';
import { MistakesPage, ProgressPage } from '../features/progress/ProgressPages';
import { EmptyState, PageHeader } from '../components/Shared';
import { contentRepository } from '../data/repository';

const navigation = [
  { to: '/learn', label: 'Изучать', icon: 'learn' as const },
  { to: '/quiz', label: 'Квиз', icon: 'quiz' as const },
  { to: '/mistakes', label: 'Ошибки', icon: 'mistakes' as const },
  { to: '/progress', label: 'Прогресс', icon: 'progress' as const },
];

function NavItems() {
  return <>{navigation.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon name={item.icon}/><span>{item.label}</span></NavLink>)}</>;
}

function AppShell() {
  const location = useLocation();
  const focus = location.pathname.startsWith('/quiz/session');
  const { error } = useProgress();
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return <div className={`app-shell ${focus ? 'focus-shell' : ''}`}>
    {!focus && <><aside className="desktop-sidebar"><Link className="brand" to="/learn"><span className="brand-mark">G<span>•</span></span><span>GeoTrainer</span></Link><nav aria-label="Основная навигация"><NavItems/></nav><div className="sidebar-foot"><Link to="/about/sources">О проекте и источники</Link></div></aside><header className="mobile-appbar"><Link className="mobile-brand" to="/learn">GeoTrainer</Link>{offline && <span className="offline-badge">Нет сети</span>}</header></>}
    {offline && focus && <span className="offline-focus">Нет сети</span>}
    {error && <div className="storage-error" role="alert">{error}</div>}
    <div className="main-area"><div className="main-inner"><Routes>
      <Route path="/" element={<Navigate to="/learn" replace/>}/>
      <Route path="/learn" element={<LearnHome/>}/>
      <Route path="/learn/food" element={<TravelCatalogPage kind="food"/>}/>
      <Route path="/learn/architecture" element={<TravelCatalogPage kind="architecture"/>}/>
      <Route path="/learn/borders" element={<BorderCatalogPage/>}/>
      <Route path="/learn/:category" element={<CatalogPage/>}/>
      <Route path="/border/:countryId" element={<BorderDetailPage/>}/>
      <Route path="/item/:id" element={<DetailPage/>}/>
      <Route path="/travel/:id" element={<TravelDetailPage/>}/>
      <Route path="/quiz" element={<QuizSetupPage/>}/>
      <Route path="/quiz/session" element={<QuizSessionPage/>}/>
      <Route path="/mistakes" element={<MistakesPage/>}/>
      <Route path="/progress" element={<ProgressPage/>}/>
      <Route path="/about/sources" element={<SourcesPage/>}/>
      <Route path="*" element={<EmptyState title="Страница не найдена" description="Проверьте адрес или вернитесь к изучению." action={{ to: '/learn', label: 'Изучать' }}/>}/>
    </Routes></div></div>
    {!focus && <nav className="mobile-bottom-nav" aria-label="Основная навигация"><NavItems/></nav>}
  </div>;
}

function SourcesPage() {
  const entries = contentRepository.all();
  return <><PageHeader title="О проекте и источники" description="GeoTrainer помогает изучать географию через изображения, короткие объяснения и тренировку." back={{ to: '/learn', label: 'Изучать' }}/>
    <div className="about-prose"><p>Факты для карточек проверены по государственным, научным и природоохранным источникам. Изображения хранятся в приложении; автор и условия использования указаны в каждой карточке.</p><p>Сейчас доступны {entries.length} проверенных объектов. Прогресс хранится только в этом браузере.</p><h2>Как устроен квиз</h2><p>Вопросы создаются из тех же карточек, которые вы изучаете. После каждого ответа приложение показывает объяснение и сохраняет результат для повторения.</p></div>
  </>;
}

export function App() { return <ProgressProvider><AppShell/></ProgressProvider>; }
