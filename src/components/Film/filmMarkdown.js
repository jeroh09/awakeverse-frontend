// src/components/Film/filmMarkdown.js
// Small line-based markdown parser for the writers'-room chat bubbles.
// Ported directly from the design reference (Film Mode.dc.html): headers
// (#/##/###), "- " bullet lists, and inline **bold** / *italic* / `code`.
// Framework-agnostic — WritersRoom.jsx turns the returned blocks into real
// JSX nodes (h4/li/b/i/code), never dangerouslySetInnerHTML.

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

// Returns an array of blocks: { type: 'h1'|'h2'|'h3'|'li'|'p', runs? , text? }
export function parseMarkdown(text) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) }); continue; }
    if (line.startsWith('## ')) { blocks.push({ type: 'h2', text: line.slice(3) }); continue; }
    if (line.startsWith('# ')) { blocks.push({ type: 'h1', text: line.slice(2) }); continue; }
    if (line.startsWith('- ')) { blocks.push({ type: 'li', runs: parseInline(line.slice(2)) }); continue; }
    if (/^\d+\.\s/.test(line)) { blocks.push({ type: 'li', runs: parseInline(line.replace(/^\d+\.\s/, '')) }); continue; }
    blocks.push({ type: 'p', runs: parseInline(line) });
  }
  return blocks;
}