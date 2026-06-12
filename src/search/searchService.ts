import { DocumentRepository } from '../markdown/DocumentRepository';
import { extractMarkers, MarkerName } from '../utils/markdownUtils';

export interface SearchOptions {
  type?: string;
  marker?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  path: string;
  snippet: string;
}

/** Search documents by title/id/tags/content, or by marker if `options.marker` is set. */
export async function searchDocuments(
  repository: DocumentRepository,
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const docs = await repository.listAll();
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const doc of docs) {
    const fm = doc.frontmatter;
    if (options.type && fm.type !== options.type) continue;

    if (options.marker) {
      const markers = extractMarkers(doc.body);
      const matches = markers[options.marker.toUpperCase() as MarkerName];
      if (!matches) continue;
      for (const match of matches) {
        if (q && !match.text.toLowerCase().includes(q) && !String(fm.title).toLowerCase().includes(q)) {
          continue;
        }
        results.push({
          id: String(fm.id),
          title: String(fm.title),
          type: String(fm.type),
          path: doc.relPath,
          snippet: `[${match.marker}]${match.localId ? ` (${match.localId})` : ''} ${match.text}`,
        });
      }
      continue;
    }

    const haystacks = [String(fm.id), String(fm.title), ...(Array.isArray(fm.tags) ? (fm.tags as string[]) : []), doc.body];
    if (haystacks.some((h) => h.toLowerCase().includes(q))) {
      const matchingLine = doc.body.split('\n').find((line) => line.toLowerCase().includes(q));
      const snippet = (matchingLine ?? String(fm.title)).trim().slice(0, 160);
      results.push({ id: String(fm.id), title: String(fm.title), type: String(fm.type), path: doc.relPath, snippet });
    }
  }

  return results;
}
