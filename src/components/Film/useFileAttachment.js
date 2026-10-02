// src/components/Film/useFileAttachment.js
// Reusable file-attachment mechanics, shared across every attachment surface in
// Film (script import in the writers' room, "use your own photo" in cast review).
// It owns ONLY the front-end plumbing — picking (gesture-safe), validating, and
// running a caller-supplied upload — and has no opinion on WHAT the file becomes.
// Each surface passes an `upload(file)` adapter that returns whatever that surface
// needs (a script's {text, sections}, or an image's {photo_url}).
//
// Why a shared hook: this is the second attachment surface, and both need the same
// finicky bits done right — the gesture-safe .click() (browsers block a file dialog
// opened after an await, which bit us on the photo-upload consent flow), type/size
// validation, and a clean {pick, uploading, error, reset} surface. Building it once
// stops the paths from drifting.

import { useState, useRef, useCallback } from 'react';

const DEFAULT_MAX_MB = 5;

export default function useFileAttachment({
  accept = '',              // input accept string, e.g. '.pdf,.docx,.txt,.md'
  maxMB = DEFAULT_MAX_MB,
  upload,                   // async (file) => result ; the surface-specific adapter
  onDone,                   // (result, file) => void ; called on success
  beforePick,               // optional sync side-effect to run inside the gesture
                            // (e.g. record consent) — must NOT be awaited here
} = {}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Opens the OS file dialog. MUST be called synchronously from a user gesture
  // (onClick) — any await before this detaches it from the gesture and the
  // browser silently refuses to open the dialog.
  const pick = useCallback(() => {
    setError(null);
    // beforePick runs in-gesture but is fire-and-forget (e.g. a consent POST):
    // awaiting it would break the .click() below.
    if (beforePick) { try { Promise.resolve(beforePick()).catch(() => {}); } catch (_) {} }
    if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click(); }
  }, [beforePick]);

  const _handleFile = useCallback(async (file) => {
    if (!file) return;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`File is too large — ${maxMB}MB max.`);
      return;
    }
    setUploading(true); setError(null);
    try {
      const result = upload ? await upload(file) : null;
      if (onDone) onDone(result, file);
    } catch (e) {
      const msg = (e && e.response && e.response.data && e.response.data.error)
        || 'Could not use that file. Try another.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }, [upload, onDone, maxMB]);

  const onInputChange = useCallback((e) => {
    const file = e.target.files && e.target.files[0];
    _handleFile(file);
  }, [_handleFile]);

  // Drag-and-drop onto a target element (optional — <AttachButton> wires these).
  const onDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    _handleFile(file);
  }, [_handleFile]);
  const onDragOver = useCallback((e) => { e.preventDefault(); }, []);

  const reset = useCallback(() => { setUploading(false); setError(null); }, []);

  // The hidden <input> the hook drives. Render it once wherever convenient.
  const inputProps = { ref: inputRef, type: 'file', accept, style: { display: 'none' }, onChange: onInputChange };

  return { pick, uploading, error, reset, inputProps, onDrop, onDragOver };
}