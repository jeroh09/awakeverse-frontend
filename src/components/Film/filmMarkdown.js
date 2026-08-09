// src/components/Film/filmMarkdown.js
// Line-based markdown parser for the writers'-room chat bubbles (DISCUSSION output
// only — the script itself is plain text, stripped server-side). WritersRoom.jsx
// turns the returned blocks into real JSX (never dangerouslySetInnerHTML).
//
// Handles: #/##/### headers, unordered ("- ", "* ") and ordered ("1. ") lists,
// blockquotes ("> "), fenced code blocks (```), horizontal rules (---), GitHub-style
// tables (| a | b | with a |---|---| separator row), and inline **bold** / *italic* /
// `code`. Everything the writers' room emits when ideating — text, tables, arrangements.

export function parseInline(text) {
  const parts = String(text || '')
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    .filter((s) => s !== '');
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return { key: i, text: p.slice(2, -2), type: 'b' };
    if (/^`[^`]+`$/.test(p)) return { key: i, text: p.slice(1, -1), type: 'code' };
    if (/^\*[^*]+\*$/.test(p)) return { key: i, text: p.slice(1, -1), type: 'i' };
    return { key: i, text: p, type: 'plain' };
  });
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
}

function isTableSeparator(line) {
  const cells = splitRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{1,}:?$/.test(c.replace(/\s/g, '')));
}

function alignments(sepLine) {
  return splitRow(sepLine).map((c) => {
    const t = c.replace(/\s/g, '');
    const l = t.startsWith(':'), r = t.endsWith(':');
    if (l && r) return 'center';
    if (r) return 'right';
    return 'left';
  });
}

// Blocks: h1|h2|h3{text}; li{runs,ordered}; quote{runs}; code{text}; hr;
//         table{header:[runs],rows:[[runs]],align:[]}; p{runs}
export function parseMarkdown(text) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) { i++; continue; }

    if (line.startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { buf.push(lines[i]); i++; }
      i++;
      blocks.push({ type: 'code', text: buf.join('\n') });
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) { blocks.push({ type: 'hr' }); i++; continue; }

    if (line.includes('|') && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const header = splitRow(line).map((c) => parseInline(c));
      const align = alignments(lines[i + 1]);
      const rows = [];
      i += 2;
      while (i < lines.length && lines[i].trim().includes('|') && lines[i].trim()) {
        if (isTableSeparator(lines[i])) { i++; continue; }
        rows.push(splitRow(lines[i]).map((c) => parseInline(c)));
        i++;
      }
      blocks.push({ type: 'table', header, rows, align });
      continue;
    }

    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) }); i++; continue; }
    if (line.startsWith('## ')) { blocks.push({ type: 'h2', text: line.slice(3) }); i++; continue; }
    if (line.startsWith('# ')) { blocks.push({ type: 'h1', text: line.slice(2) }); i++; continue; }

    if (line.startsWith('> ')) { blocks.push({ type: 'quote', runs: parseInline(line.slice(2)) }); i++; continue; }

    if (/^[-*]\s+/.test(line)) {
      blocks.push({ type: 'li', ordered: false, runs: parseInline(line.replace(/^[-*]\s+/, '')) });
      i++; continue;
    }
    if (/^\d+\.\s/.test(line)) {
      blocks.push({ type: 'li', ordered: true, runs: parseInline(line.replace(/^\d+\.\s/, '')) });
      i++; continue;
    }

    blocks.push({ type: 'p', runs: parseInline(line) });
    i++;
  }
  return blocks;
}