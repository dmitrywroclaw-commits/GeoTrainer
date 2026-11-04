import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useProgress } from '../../app/ProgressContext';
import { Icon } from '../../components/Icon';
import { MediaFrame } from '../../components/MediaFrame';
import { EmptyState, PageHeader } from '../../components/Shared';
import { contentRepository } from '../../data/repository';
import { borderRepository } from '../../data/borders';
import { capitalRepository } from '../../data/capitals';
import { geographyRepository } from '../../data/geography';
import { extremesRepository, recordsTopic, extremeKindFilters, type ExtremeKind } from '../../data/extremes';
import { buildRecordQuestion, buildCapitalQuestion, buildGeographyQuestion, buildQuestion, createSession, type Question, type QuizMode } from './engine';

const modes: { value: QuizMode; label: string; description: string }[] = [
  { value: 'flag', label: 'Флаги', description: 'Узнайте страну по флагу' },
  { value: 'emblem', label: 'Гербы', description: 'Определите государственный символ' },
  { value: 'landmark', label: 'Природа', description: 'Узнайте место по фотографии' },
  { value: 'capital', label: 'Столицы', description: 'Запомните пары страна — столица' },
  { value: 'outline', label: 'Страны на карте', description: 'Узнайте силуэт и выберите контур' },
  { value: 'waterway', label: 'Проливы и каналы', description: '20 проливов и 2 канала на картах' },
  { value: 'records', label: recordsTopic.title, description: 'Озёра, реки и горы: рекорды и необычные свойства' },
  { value: 'mixed', label: 'Смешанный', description: 'Все темы вместе' },
];

export function QuizSetupPage() {
  const [mode, setMode] = useState<QuizMode>('mixed');
  const [recordKind, setRecordKind] = useState<ExtremeKind | 'all'>('all');
  const [count, setCount] = useState(5);
  const sessionMode = mode === 'records' && recordKind !== 'all' ? recordKind : mode;
  return <>
    <PageHeader title="Квиз" description="Выберите тему и проверьте, что уже запомнили." />
    <div className="setup-card">
      <fieldset className="setup-field"><legend>Что тренируем?</legend><div className="mode-grid">{modes.map(item => <button type="button" key={item.value} className={`mode-button ${mode === item.value ? 'selected' : ''}`} aria-pressed={mode === item.value} onClick={() => setMode(item.value)}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div></fieldset>
      {mode === 'records' && <fieldset className="setup-field"><legend>Тип объекта</legend><div className="chip-row">{[{ value: 'all' as const, label: 'Все' }, ...extremeKindFilters].map(({ value, label }) => <button type="button" className={`chip ${recordKind === value ? 'selected' : ''}`} aria-pressed={recordKind === value} key={value} onClick={() => setRecordKind(value)}>{label}</button>)}</div></fieldset>}
      <fieldset className="setup-field"><legend>Количество вопросов</legend><div className="count-row">{[5, 10, 20].map(value => <button type="button" key={value} className={`count-button ${count === value ? 'selected' : ''}`} aria-pressed={count === value} onClick={() => setCount(value)}>{value}</button>)}</div></fieldset>
      <Link className="button primary-button setup-start" to={`/quiz/session?mode=${sessionMode}&count=${count}`}>Начать тренировку</Link>
    </div>
  </>;
}

function sessionFromParams(mode: QuizMode, count: number, reviewIds: string[], focus: string | null) {
  const all = contentRepository.all();
  const selected = createSession(all, mode, count, reviewIds);
  const focusEntry = focus && all.find(x => x.id === focus);
  if (focusEntry && (mode === focusEntry.kind || mode === 'mixed')) {
    selected[0] = buildQuestion(focusEntry, all);
  }
  const focusRecord = focus && extremesRepository.question(focus);
  if (focusRecord && (mode === focusRecord.kind || mode === 'records' || mode === 'mixed' || mode === 'mistakes')) selected[0] = buildRecordQuestion(focusRecord);
  const focusCapital = focus && capitalRepository.question(focus);
  if (focusCapital && (mode === 'capital' || mode === 'mixed' || mode === 'mistakes')) selected[0] = buildCapitalQuestion(focusCapital);
  const focusGeography = focus && geographyRepository.question(focus);
  if (focusGeography && (mode === geographyRepository.byId(focusGeography.cardId)?.kind || mode === 'mixed' || mode === 'mistakes')) selected[0] = buildGeographyQuestion(focusGeography);
  return selected;
}

export function QuizSessionPage() {
  const [params] = useSearchParams();
  const modeValue = params.get('mode') ?? 'mixed';
  const mode = (['flag', 'emblem', 'landmark', 'capital', 'outline', 'waterway', 'records', 'river', 'mountain', 'lake', 'mixed', 'mistakes'].includes(modeValue) ? modeValue : 'mixed') as QuizMode;
  const count = Math.max(1, Math.min(20, Number(params.get('count')) || 5));
  const { records, ready } = useProgress();
  if (modeValue === 'border') return <EmptyState title="Тема больше недоступна" description="Выберите одну из опубликованных тем." action={{ to: '/quiz', label: 'К темам квиза' }}/>;
  if (mode === 'mistakes' && !ready) return <div className="quiz-loading">Загружаем ошибки…</div>;
  const reviewIds = records.filter(x => x.wrongCount > 0).map(x => x.contentId);
  return <ActiveQuiz key={params.toString()} mode={mode} count={count} reviewIds={reviewIds} focus={params.get('focus')}/>;
}

function ActiveQuiz({ mode, count, reviewIds, focus }: { mode: QuizMode; count: number; reviewIds: string[]; focus: string | null }) {
  const navigate = useNavigate();
  const { recordAnswer } = useProgress();
  const [questions] = useState<Question[]>(() => sessionFromParams(mode, count, reviewIds, focus));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const finished = index >= questions.length;
  const question = questions[index];
  const exit = () => {
    if (!finished && (index > 0 || selected) && !window.confirm('Завершить текущую тренировку? Уже данные ответы сохранены.')) return;
    navigate(mode === 'mistakes' ? '/mistakes' : '/quiz');
  };
  if (!questions.length) return <div className="quiz-focus"><header className="quiz-top"><button type="button" className="quiet-button" onClick={exit}><Icon name="arrow" size={18}/> Выйти</button></header><div className="empty-state"><h1>Пока нечего повторять</h1><p>Ошибки появятся здесь после тренировки.</p><Link className="button primary-button" to="/quiz">К квизу</Link></div></div>;
  if (finished) return <div className="quiz-focus"><header className="quiz-top"><button type="button" className="quiet-button" onClick={exit}><Icon name="arrow" size={18}/> Выйти</button></header><div className="quiz-finish"><span className="eyebrow">Тренировка завершена</span><h1>{correctCount} из {questions.length}</h1><p>Ответы сохранены на этом устройстве. К ошибкам можно вернуться в любой момент.</p><div className="finish-actions"><Link className="button primary-button" to="/mistakes">Посмотреть ошибки</Link><Link className="button secondary-button" to="/quiz">Новая тренировка</Link></div></div></div>;
  const media = question.questionMedia ?? (question.entry.kind === 'border' ? borderRepository.map(question.entry.mediaId, selected !== null) : question.entry.kind === 'capital' ? capitalRepository.media(question.entry.mediaId) : question.entry.mediaId ? contentRepository.media(question.entry.mediaId) : undefined);
  const geographyCard = 'cardId' in question.entry && (question.entry.kind === 'outline' || question.entry.kind === 'waterway') ? geographyRepository.byId(question.entry.cardId) : undefined;
  const correct = selected === question.correctOption;
  const answer = (value: string) => {
    if (selected !== null) return;
    setSelected(value);
    if (value === question.correctOption) setCorrectCount(x => x + 1);
    void recordAnswer(question.entry.id, question.entry.kind, value === question.correctOption);
  };
  const next = () => { setSelected(null); setIndex(x => x + 1); window.scrollTo({ top: 0, behavior: 'instant' }); };
  return <div className="quiz-focus">
    <header className="quiz-top"><button type="button" className="quiet-button" onClick={exit}><Icon name="arrow" size={18}/> Выйти</button><span>{index + 1} / {questions.length}</span></header>
    <main className="quiz-body"><div className="quiz-progress" role="progressbar" aria-label="Прогресс тренировки" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={questions.length}><span style={{ width: `${((index + 1) / questions.length) * 100}%` }}/></div>
      <h1>{question.prompt}</h1>
      {question.showMedia !== false && media && <MediaFrame key={`${question.entry.id}-${media.id}`} media={media} alt={question.entry.kind === 'outline' ? 'Силуэт страны без подписей, север вверху' : question.entry.kind === 'border' ? selected === null ? 'Карта региона: выделена страна из вопроса, соседи не подписаны' : `Карта с подсвеченными соседями: ${question.entry.nameRu}` : question.entry.kind === 'landmark' ? 'Фотография природного объекта для вопроса' : 'Изображение государственного символа для вопроса'} className="quiz-image" />}
      {geographyCard?.kind === 'outline' && <p className="media-hint quiz-map-note">{geographyCard.scopeRu}</p>}
      <div className={`answer-grid ${question.optionMedia ? 'outline-answer-grid' : ''}`} role="group" aria-label="Варианты ответа">{question.options.map(option => {
        const state = selected !== null ? option === question.correctOption ? 'correct' : option === selected ? 'wrong' : 'muted' : '';
        return <button type="button" key={option} className={`answer-button ${state}`} onClick={() => answer(option)} disabled={selected !== null} aria-pressed={selected === option}>
          {question.optionMedia?.[option] && <MediaFrame key={question.optionMedia[option].id} media={question.optionMedia[option]} alt="" retryable={false}/>}
          <span>{selected === null ? question.optionLabels?.[option] ?? option : option}</span>{selected !== null && option === question.correctOption && <Icon name="check" size={18}/ >}{selected !== null && option === selected && !correct && <Icon name="cross" size={18}/ >}
        </button>;
      })}</div>
      {selected !== null && <section className={`quiz-feedback ${correct ? 'feedback-correct' : 'feedback-wrong'}`} aria-live="polite"><p className="feedback-status"><Icon name={correct ? 'check' : 'cross'} size={20}/>{correct ? 'Верно' : `Неверно. Правильный ответ: ${question.optionLabels?.[question.correctOption] ?? question.correctOption}`}</p><h2>{question.entry.nameRu}</h2><p>{question.entry.summaryRu}</p><p>{question.entry.explanationRu}</p>
        {geographyCard?.kind === 'outline' && geographyCard.borderNoteRu && <p className="media-hint">{geographyCard.borderNoteRu}</p>}
        {question.explanationMedia && <MediaFrame key={question.explanationMedia.id} media={question.explanationMedia} alt={`Объяснение: ${question.entry.nameRu}`} className="geography-answer-map"/>}
        {question.detailPath && <p className="feedback-source-link"><Link to={question.detailPath}>Карточка и источники →</Link></p>}
        {question.entry.kind === 'capital' && <p><Link to={`/capital/${question.entry.cardId}`}>Карточка и источники</Link></p>}<button type="button" className="button primary-button next-button" onClick={next}>{index + 1 === questions.length ? 'Завершить' : 'Следующий вопрос'}</button></section>}
    </main>
  </div>;
}
