import { useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import ImageLightbox from '../agent/ImageLightbox';

/** Imagen inline de markdown; clic abre lightbox con zoom. */
const resolveSrc = (s) => {
  if (s.startsWith('file://')) return convertFileSrc(decodeURIComponent(s.slice(7)));
  if (s.startsWith('/')) return convertFileSrc(s);
  return s;
};

export default function MarkdownImage({ src: rawSrc, alt }) {
  const src = resolveSrc(rawSrc);
  const [open, setOpen] = useState(false);
  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={() => setOpen(true)}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: 280,
          margin: '6px 0',
          borderRadius: 'var(--radius-sm, 6px)',
          border: '1px solid var(--border-color)',
          cursor: 'zoom-in'
        }}
        title="Clic para ampliar"
      />
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
