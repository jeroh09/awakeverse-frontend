// src/components/Film/AttachButton.jsx
// The shared "+" attach control for the writers'-room composer. Thin UI over
// useFileAttachment — it renders the button + the hidden input, shows an
// uploading spinner, and surfaces validation/upload errors. The parent supplies
// the upload adapter + onDone via the hook, so this component stays generic.

import React from 'react';
import useFileAttachment from './useFileAttachment';
import { IconPlus } from './filmIcons';

export default function AttachButton({
  accept = '.pdf,.docx,.txt,.md',
  maxMB = 5,
  upload,
  onDone,
  disabled = false,
  title = 'Attach a script',
}) {
  const { pick, uploading, error, inputProps } = useFileAttachment({ accept, maxMB, upload, onDone });
  return (
    <>
      <button type="button" className="film-attach-btn" onClick={pick}
        disabled={disabled || uploading} title={title} aria-label={title}>
        {uploading ? <span className="film-spin film-spin--sm" /> : <IconPlus s={16} />}
      </button>
      <input {...inputProps} />
      {error && <span className="film-attach-err" role="alert">{error}</span>}
    </>
  );
}