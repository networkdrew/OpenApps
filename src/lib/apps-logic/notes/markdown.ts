/**
 * A small, dependency-free Markdown -> HTML renderer purpose-built for note
 * content. Supports the CommonMark subset that matters for note-taking
 * (headings, emphasis, inline code/code blocks, blockquotes, lists
 * including task lists, links, images, horizontal rules) plus `[[wiki
 * links]]`. Deliberately does not support nested/indented sub-lists — that
 * complexity isn't worth the bug surface for this app's use case.
 *
 * Security note: the entire input is HTML-escaped up front, so no user
 * content can inject raw HTML/script — only the tags this renderer itself
 * emits ever reach the DOM. Link/image URLs are further restricted to
 * http(s), mailto, and relative schemes (see `isSafeUrl`) to block
 * `javascript:`-style URL injection.
 */

export interface MarkdownOptions {
  /** Given a wiki-link target title (already un-escaped), returns whether a note with that title exists — used to style existing vs. missing links. Defaults to always "exists" (no special styling) if omitted. */
  noteExists?: (title: string) => boolean;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function isSafeUrl(url: string): boolean {
  const trimmed = unescapeHtml(url).trim();
  if (/^(https?:|mailto:)/i.test(trimmed)) return true;
  if (/^[/#.]/.test(trimmed)) return true;
  return false;
}

interface ParsedLinkLike {
  label: string;
  url: string;
  nextIndex: number;
}

/** Parses `[label](url)` starting at the index of `[`. Doesn't support nested brackets in the label. */
function tryParseLinkLike(text: string, start: number): ParsedLinkLike | null {
  const labelClose = text.indexOf("]", start + 1);
  if (labelClose === -1) return null;
  if (text[labelClose + 1] !== "(") return null;
  const urlClose = text.indexOf(")", labelClose + 2);
  if (urlClose === -1) return null;
  return {
    label: text.slice(start + 1, labelClose),
    url: text.slice(labelClose + 2, urlClose),
    nextIndex: urlClose + 1,
  };
}

/** Scans already-HTML-escaped inline text for Markdown emphasis/links/wiki-links. Recursive calls always operate on a strictly shorter substring, so this always terminates. */
function scanInline(text: string, options: MarkdownOptions): string {
  let out = "";
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];

    if (ch === "\\" && i + 1 < n && "*_`[]\\".includes(text[i + 1] ?? "")) {
      out += text[i + 1];
      i += 2;
      continue;
    }

    if (ch === "`") {
      const close = text.indexOf("`", i + 1);
      if (close !== -1) {
        out += `<code>${text.slice(i + 1, close)}</code>`;
        i = close + 1;
        continue;
      }
    }

    if (ch === "!" && text[i + 1] === "[") {
      const parsed = tryParseLinkLike(text, i + 1);
      if (parsed) {
        if (isSafeUrl(parsed.url)) {
          out += `<img src="${parsed.url}" alt="${parsed.label}" loading="lazy" />`;
        } else {
          out += text.slice(i, parsed.nextIndex);
        }
        i = parsed.nextIndex;
        continue;
      }
    }

    if (ch === "[" && text[i + 1] === "[") {
      const close = text.indexOf("]]", i + 2);
      if (close !== -1) {
        const inner = text.slice(i + 2, close);
        const bar = inner.indexOf("|");
        const rawTarget = bar === -1 ? inner : inner.slice(0, bar);
        const rawAlias = bar === -1 ? "" : inner.slice(bar + 1);
        const target = rawTarget.trim();
        const display = rawAlias.trim() || target;
        if (target) {
          const exists = options.noteExists
            ? options.noteExists(unescapeHtml(target))
            : true;
          const cls = exists ? "wiki-link" : "wiki-link wiki-link-missing";
          out += `<a href="#" class="${cls}" data-wiki-link="${target}">${display}</a>`;
          i = close + 2;
          continue;
        }
      }
    }

    if (ch === "[") {
      const parsed = tryParseLinkLike(text, i);
      if (parsed) {
        if (isSafeUrl(parsed.url)) {
          out += `<a href="${parsed.url}" target="_blank" rel="noopener noreferrer">${scanInline(parsed.label, options)}</a>`;
        } else {
          out += text.slice(i, parsed.nextIndex);
        }
        i = parsed.nextIndex;
        continue;
      }
    }

    if ((ch === "*" || ch === "_") && text[i + 1] === ch) {
      const marker = ch + ch;
      const close = text.indexOf(marker, i + 2);
      if (close !== -1 && close > i + 2) {
        out += `<strong>${scanInline(text.slice(i + 2, close), options)}</strong>`;
        i = close + 2;
        continue;
      }
    }

    if (ch === "*" || ch === "_") {
      const close = text.indexOf(ch, i + 1);
      if (close !== -1 && close > i + 1) {
        out += `<em>${scanInline(text.slice(i + 1, close), options)}</em>`;
        i = close + 1;
        continue;
      }
    }

    out += ch;
    i += 1;
  }

  return out;
}

/** Renders one inline run of raw (unescaped) Markdown text to HTML — headings, list items, and paragraph lines all go through this. */
export function renderInlineText(
  raw: string,
  options: MarkdownOptions = {},
): string {
  return scanInline(escapeHtml(raw), options);
}

const FENCE_RE = /^(```|~~~)/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const HR_RE = /^(-{3,}|\*{3,}|_{3,})\s*$/;
const BLOCKQUOTE_RE = /^>\s?/;
const LIST_ITEM_RE = /^([-*+]|\d+\.)\s+(.*)$/;
const TASK_ITEM_RE = /^\[( |x|X)\]\s+(.*)$/;

function isBlockStart(line: string): boolean {
  const trimmed = line.trim();
  return (
    FENCE_RE.test(trimmed) ||
    HEADING_RE.test(line) ||
    HR_RE.test(trimmed) ||
    BLOCKQUOTE_RE.test(line) ||
    LIST_ITEM_RE.test(line)
  );
}

function renderListItem(text: string, options: MarkdownOptions): string {
  const task = TASK_ITEM_RE.exec(text);
  if (task) {
    const checked = task[1]?.toLowerCase() === "x";
    return `<li class="task-list-item"><input type="checkbox" disabled${checked ? " checked" : ""} /> ${renderInlineText(task[2] ?? "", options)}</li>`;
  }
  return `<li>${renderInlineText(text, options)}</li>`;
}

function renderParagraphLines(
  lines: string[],
  options: MarkdownOptions,
): string {
  return lines
    .map((line, idx) => {
      const hardBreak = / {2,}$/.test(line);
      const html = renderInlineText(line.replace(/ {2,}$/, ""), options);
      if (idx === lines.length - 1) return html;
      return html + (hardBreak ? "<br />" : " ");
    })
    .join("");
}

/** Renders a full note's Markdown content to HTML. See module docs for scope and the XSS-safety approach. */
export function renderMarkdown(
  source: string,
  options: MarkdownOptions = {},
): string {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i++;
      continue;
    }

    const fenceMatch = FENCE_RE.exec(line.trim());
    if (fenceMatch) {
      const fence = fenceMatch[1] ?? "```";
      const lang = line.trim().slice(fence.length).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && (lines[i] ?? "").trim() !== fence) {
        codeLines.push(lines[i] ?? "");
        i++;
      }
      i++; // skip closing fence, or reach EOF if unterminated
      const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      blocks.push(
        `<pre><code${langClass}>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
      );
      continue;
    }

    const headingMatch = HEADING_RE.exec(line);
    if (headingMatch) {
      const level = headingMatch[1]?.length ?? 1;
      blocks.push(
        `<h${level}>${renderInlineText((headingMatch[2] ?? "").trim(), options)}</h${level}>`,
      );
      i++;
      continue;
    }

    if (HR_RE.test(line.trim())) {
      blocks.push("<hr />");
      i++;
      continue;
    }

    if (BLOCKQUOTE_RE.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && BLOCKQUOTE_RE.test(lines[i] ?? "")) {
        quoteLines.push((lines[i] ?? "").replace(BLOCKQUOTE_RE, ""));
        i++;
      }
      blocks.push(
        `<blockquote><p>${renderParagraphLines(quoteLines, options)}</p></blockquote>`,
      );
      continue;
    }

    if (LIST_ITEM_RE.test(line)) {
      const isOrdered = /^\d+\.\s+/.test(line);
      const itemTexts: string[] = [];
      while (i < lines.length && LIST_ITEM_RE.test(lines[i] ?? "")) {
        const m = LIST_ITEM_RE.exec(lines[i] ?? "");
        itemTexts.push(m?.[2] ?? "");
        i++;
      }
      const itemsHtml = itemTexts
        .map((text) => renderListItem(text, options))
        .join("");
      blocks.push(
        isOrdered ? `<ol>${itemsHtml}</ol>` : `<ul>${itemsHtml}</ul>`,
      );
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !isBlockStart(lines[i] ?? "")
    ) {
      paraLines.push(lines[i] ?? "");
      i++;
    }
    blocks.push(`<p>${renderParagraphLines(paraLines, options)}</p>`);
  }

  return blocks.join("\n");
}
