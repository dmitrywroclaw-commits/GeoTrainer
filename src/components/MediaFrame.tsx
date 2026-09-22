import { useEffect, useRef, useState } from 'react';
import type { Media } from '../data/schema';
import { Icon } from './Icon';

export function MediaFrame({ media, alt, className = '', expandable = false }: { media: Media; alt: string; className?: string; expandable?: boolean }) {
  const [failed, setFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [source, setSource] = useState(media.localPath);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const objectUrl = useRef<string | null>(null);
  useEffect(() => {
    setSource(media.localPath);
    setFailed(false);
    return () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; };
  }, [media.localPath]);
  useEffect(() => {
    if (open) dialog.current?.showModal(); else dialog.current?.close();
  }, [open]);
  const retry = () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); objectUrl.current = null; setFailed(false); setSource(media.localPath); setRetryKey(x => x + 1); };
  const cacheViewedMedia = () => {
    if (!('caches' in window) || !navigator.onLine || source.startsWith('blob:')) return;
    void caches.open('geotrainer-media-v1').then(async cache => {
      if (!(await cache.match(media.localPath))) await cache.add(media.localPath);
    }).catch(() => undefined);
  };
  const recoverImage = async () => {
    if (source.startsWith('blob:')) { setFailed(true); return; }
    if ('caches' in window) {
      const cached = await caches.match(media.localPath).catch(() => undefined);
      if (cached) {
        const url = URL.createObjectURL(await cached.blob());
        objectUrl.current = url;
        setSource(url);
        return;
      }
    }
    setFailed(true);
  };
  return <>
    <div className={`media-frame ${className} ${media.kind === 'photo' ? 'media-photo' : 'media-symbol'}`}>
      {failed ? <div className="media-unavailable" role="status"><span>Изображение сейчас недоступно{!navigator.onLine ? ' без сети' : ''}.</span><button type="button" className="text-button" onClick={retry}>Повторить</button></div> : <img key={retryKey} src={source} alt={alt} loading="lazy" onLoad={cacheViewedMedia} onError={() => void recoverImage()} />}
      {expandable && !failed && <button type="button" className="expand-button" onClick={() => setOpen(true)} aria-label="Открыть изображение крупнее"><Icon name="expand" size={19}/></button>}
    </div>
    {expandable && <dialog className="media-dialog" ref={dialog} onClose={() => setOpen(false)} onClick={event => { if (event.target === dialog.current) setOpen(false); }} aria-label="Просмотр изображения">
      <button type="button" className="dialog-close" onClick={() => setOpen(false)} aria-label="Закрыть"><Icon name="close" /></button>
      <img src={source} alt={alt} />
    </dialog>}
  </>;
}
