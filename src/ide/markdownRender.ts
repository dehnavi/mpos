import { marked } from 'marked';
import { MARKER_NAMES } from '../utils/markdownUtils';

const MARKER_STRONG_RE = new RegExp(`<strong>\\[(${MARKER_NAMES.join('|')})\\]</strong>`, 'g');

/**
 * Renders a document body to HTML for the IDE preview pane, highlighting
 * `[BUSINESS_RULE]`/`[OPEN_QUESTION]`/`[CONFLICT]`/`[RISK]`/`[ASSUMPTION]`/
 * `[DECISION]`/`[TODO]` markers (per markdown-rules.md §3) so the frontend can
 * color/icon them.
 */
export function renderMarkdownHtml(body: string): string {
  const html = marked.parse(body, { async: false }) as string;
  return html.replace(MARKER_STRONG_RE, '<span class="marker marker-$1"><strong>[$1]</strong></span>');
}
